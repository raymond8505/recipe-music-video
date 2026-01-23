const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');

/**
 * Robust downloader for Google Drive / Redirects
 */
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) return reject(new Error(`Download failed: ${response.statusCode}`));
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        });
        request.on('error', (err) => { if (fs.existsSync(dest)) fs.unlinkSync(dest); reject(err); });
    });
}

/**
 * Internal helper to get duration of the audio file in seconds
 */
function getMediaDuration(filePath) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            filePath
        ]);

        let output = '';
        ffprobe.stdout.on('data', (data) => output += data.toString());
        ffprobe.on('close', (code) => {
            if (code === 0) resolve(parseFloat(output.trim()));
            else reject(new Error(`ffprobe exited with code ${code}`));
        });
        ffprobe.on('error', (err) => reject(err));
    });
}

/**
 * generateSlideshow(spec, instructionsWrapper, images, audioPath)
 */
async function generateSlideshow(spec, instructionsWrapper, images, audioPath) {
    const instructions = instructionsWrapper.ffmpeg_instructions || instructionsWrapper;
    
    // Ensure dimensions are even (libx264 requirement)
    const [rawWidth, rawHeight] = instructions.resolution.split('x').map(Number);
    const width = rawWidth % 2 === 0 ? rawWidth : rawWidth - 1;
    const height = rawHeight % 2 === 0 ? rawHeight : rawHeight - 1;
    
    const titleSlug = spec.title.replace(/\s+/g, '_');
    const videoOutputPath = path.resolve(`${titleSlug}.mp4`);
    const tempDir = path.resolve(`./temp_assets_${Date.now()}`);

    try {
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        console.log("--- Analyzing Audio ---");
        const audioDuration = await getMediaDuration(audioPath);

        console.log("--- Syncing Local Assets ---");
        const localImages = [];
        for (let i = 0; i < images.length; i++) {
            const localPath = path.join(tempDir, `in_${i}.png`);
            await downloadFile(images[i].url, localPath);
            localImages.push(localPath);
        }

        let args = [];

        // 1. Add Image Inputs
        localImages.forEach((localPath, index) => {
            const scene = instructions.scene_filters.find(s => s.input_index === index) || instructions.scene_filters[index];
            const d = scene ? scene.display_duration : 3;
            // -framerate must come BEFORE -i for image2 demuxer
            args.push('-framerate', '25', '-loop', '1', '-t', d.toString(), '-f', 'image2', '-i', localPath);
        });

        // 2. Add Audio Input
        args.push('-i', audioPath);

        // 3. Filter Complex Construction
        let filterParts = [];
        
        instructions.scene_filters.forEach((scene, index) => {
            const isZoomPan = scene.filter_chain.includes('zoompan');
            let manualChain = "";

            if (isZoomPan) {
                const zMatch = scene.filter_chain.match(/z='([^']+)'/);
                const xMatch = scene.filter_chain.match(/x='([^']+)'/);
                const dMatch = scene.filter_chain.match(/d=(\d+)/);
                
                const z = zMatch ? zMatch[1].replace(/\bt\b/g, 'it') : '1.1';
                const x = xMatch ? xMatch[1].replace(/\bt\b/g, 'it') : '0';
                const d = dMatch ? dMatch[1] : '100';

                manualChain = `zoompan=z='${z}':x='${x}':d=${d}:s=${width}x${height}`;
            } else {
                manualChain = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
            }

            // Normalization: Re-added :v specifier now that -f image2 and -framerate are correctly positioned
            filterParts.push(`[${index}:v]fps=25,${manualChain},setsar=1,scale=${width}:${height},settb=1/25,format=yuv420p[${scene.output_label}]`);
        });

        // Link crossfade labels
        instructions.crossfade_chain.forEach(xfade => {
            filterParts.push(`[${xfade.input_label_1}][${xfade.input_label_2}]xfade=transition=${xfade.transition_type}:duration=${xfade.duration}:offset=${xfade.offset}[${xfade.output_label}]`);
        });

        args.push('-filter_complex', filterParts.join(';'));

        // 4. Final Mapping & Encoding
        args.push(
            '-map', '[outv]',
            '-map', `${localImages.length}:a`, 
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-r', '25',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',
            '-y',
            videoOutputPath
        );

        console.log("\nStarting Render...");
        const ffmpeg = spawn('ffmpeg', args);

        ffmpeg.stderr.on('data', (data) => {
            const out = data.toString();
            if (out.includes('frame=')) {
                process.stdout.write(`\r${out.trim()}`);
            } else if (out.includes('Error') || out.includes('Invalid')) {
                console.log(`\nFFmpeg Log: ${out.trim()}`);
            }
        });

        await new Promise((resolve, reject) => {
            ffmpeg.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
            });
        });

        console.log(`\n\nVideo Created: ${videoOutputPath}`);
        return videoOutputPath;

    } catch (err) {
        console.error(`\nPipeline Error: ${err.message}`);
        throw err;
    } finally {
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

module.exports = generateSlideshow;