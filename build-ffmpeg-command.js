const fs = require('fs');
/**
 * Build complete FFmpeg args array from LLM-generated instructions
 * @param {Object} ffmpegInstructions - Instructions from LLM
 * @param {Array} imageUrls - Array of image URLs in scene order
 * @param {string} audioFilePath - Path to WAV audio file
 * @param {string} outputPath - Output video file path
 * @returns {Array} Array of FFmpeg arguments ready for spawn()
 */
function buildFFmpegCommand(ffmpegInstructions, imageUrls, audioFilePath, outputPath) {
  console.log('🔧 Building FFmpeg command from instructions...\n');

  const {
    scene_filters,
    crossfade_chain
  } = ffmpegInstructions;

  const audioInputIndex = imageUrls.length;
  const args = [];

  // 1. Build input arguments (images + audio)
  scene_filters.forEach((scene, idx) => {
    args.push('-loop', '1', '-t', String(scene.display_duration), '-i', imageUrls[idx]);
  });
  args.push('-i', audioFilePath);

  // 2. Build filter_complex from scene filters
  // On Windows, single quotes don't work as quoting in cmd.exe
  // Strip them and escape commas ONLY inside parentheses (function args)
  const escapeCommasInParens = (str) => {
    let result = '';
    let parenDepth = 0;
    for (const char of str) {
      if (char === '(') {
        parenDepth++;
        result += char;
      } else if (char === ')') {
        parenDepth--;
        result += char;
      } else if (char === ',' && parenDepth > 0) {
        result += '\\,';  // Escape comma inside parentheses
      } else {
        result += char;
      }
    }
    return result;
  };

  const sceneFilterStrings = scene_filters.map(scene => {
    const cleanedFilter = escapeCommasInParens(scene.filter_chain.replace(/'/g, ''));
    return `[${scene.input_index}:v]${cleanedFilter}[${scene.output_label}]`;
  });

  // 3. Build crossfade chain
  const crossfadeStrings = crossfade_chain.map(xfade => {
    return `[${xfade.input_label_1}][${xfade.input_label_2}]xfade=transition=${xfade.transition_type}:duration=${xfade.duration}:offset=${xfade.offset}[${xfade.output_label}]`;
  });

  // 4. Combine into filter_complex
  const filterComplex = `${sceneFilterStrings.join(';')};${crossfadeStrings.join(';')}`;
  args.push('-filter_complex', filterComplex);

  // 5. Add output options
  args.push(
    '-map', '[outv]',
    '-map', `${audioInputIndex}:a`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-pix_fmt', 'yuv420p',
    '-shortest',
    '-y',  // Overwrite output file if exists
    outputPath
  );

  console.log('✓ FFmpeg command built\n');
  console.log('Command breakdown:');
  console.log(`  Inputs: ${scene_filters.length} images + 1 audio`);
  console.log(`  Scenes: ${scene_filters.length}`);
  console.log(`  Transitions: ${crossfade_chain.length}`);
  console.log(`  Output: ${outputPath}\n`);

  return args;
}

const { spawn } = require('child_process');

/**
 * Escape an argument for cmd.exe shell
 */
function escapeForCmd(arg) {
  // If arg contains spaces, &, or other special chars, wrap in double quotes
  // Also escape any existing double quotes
  if (/[\s&<>|^()]/.test(arg) || arg.includes('"')) {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }
  return arg;
}

/**
 * Execute FFmpeg command with real-time progress
 * @param {Array} ffmpegArgs - Array of FFmpeg arguments
 * @param {string} outputPath - Output file path
 * @param {number} totalDuration - Total expected duration in seconds (for percentage)
 * @returns {Promise<Object>}
 */
async function executeFFmpegCommand(ffmpegArgs, outputPath, totalDuration = null) {
  console.log('🎬 Starting FFmpeg encoding...\n');

  // Build command string for shell execution
  const commandStr = 'ffmpeg ' + ffmpegArgs.map(escapeForCmd).join(' ');
  console.log(commandStr + '\n');

  return new Promise((resolve, reject) => {
    // Use shell: true so that quoting in filter expressions is handled correctly
    const ffmpeg = spawn(commandStr, [], { stdio: ['ignore', 'pipe', 'pipe'], shell: true });

    let stderrBuffer = '';

    ffmpeg.stderr.on('data', (data) => {
      const text = data.toString();
      stderrBuffer += text;

      // Extract key progress metrics
      const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      const fpsMatch = text.match(/fps=\s*(\d+)/);
      const speedMatch = text.match(/speed=\s*([\d.]+)x/);

      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        let progressStr = `⏱️  ${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3].padStart(5, '0')}`;

        // Add percentage if total duration known
        if (totalDuration) {
          const percent = Math.min(100, (currentTime / totalDuration * 100)).toFixed(1);
          progressStr += `  (${percent}%)`;
        }

        if (fpsMatch) progressStr += `  │  📹 ${fpsMatch[1]} fps`;
        if (speedMatch) progressStr += `  │  ⚡ ${speedMatch[1]}x`;

        // Clear line and print progress
        process.stdout.write(`\r\x1b[K${progressStr}`);
      }
    });

    ffmpeg.on('close', (code) => {
      process.stdout.write('\n\n');

      if (code === 0) {
        try {
          const stats = fs.statSync(outputPath);
          if (stats.size === 0) {
            console.error('⚠️  Warning: Output file is empty!\n');
            console.error('FFmpeg stderr output:\n');
            console.error(stderrBuffer);
            reject(new Error('FFmpeg produced an empty output file'));
            return;
          }
          console.log('✅ Encoding complete!');
          console.log(`📦 ${outputPath}`);
          console.log(`📏 ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

          resolve({
            success: true,
            outputPath,
            fileSizeMB: stats.size / 1024 / 1024
          });
        } catch (err) {
          console.error('❌ Could not read output file\n');
          console.error('FFmpeg stderr output:\n');
          console.error(stderrBuffer);
          reject(err);
        }
      } else {
        console.error(`❌ FFmpeg failed with exit code ${code}\n`);
        console.error('FFmpeg stderr output:\n');
        console.error(stderrBuffer);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('\n❌ FFmpeg error:', err.message);
      reject(err);
    });
  });
}

module.exports = {
    buildFFmpegCommand,
    executeFFmpegCommand
}
