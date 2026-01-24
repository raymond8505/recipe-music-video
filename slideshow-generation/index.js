import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import https from "https";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { sanitizePath } from "../helpers.js";

/**
 * Ken Burns Filter Generator
 */
function generateKenBurnsFilter(scene, width, height, fps) {
  const { start_scale, end_scale, direction } = scene.effect;
  const duration = scene.end_time - scene.start_time;
  const totalFrames = Math.max(duration * fps, 1);

  const z = `(${start_scale}+(on/${totalFrames})*(${end_scale}-${start_scale}))`;

  let x = `iw/2-(iw/${z}/2)`;
  let y = `ih/2-(ih/${z}/2)`;

  if (direction.includes("right")) x = `iw-(iw/${z})`;
  if (direction.includes("left")) x = `0`;
  if (direction.includes("lower")) y = `ih-(ih/${z})`;
  if (direction.includes("upper")) y = `0`;

  return (
    `scale=${width * 2}:${height * 2}:force_original_aspect_ratio=increase,crop=${width * 2}:${height * 2},` +
    `zoompan=z='${z}':x='${x}':y='${y}':d=${totalFrames}:s=${width}x${height},setsar=1`
  );
}

/**
 * Main Library Function
 */
export async function createSlideshowFromSpec(
  payload,
  audioInputPath,
  outputFilePath,
) {
  const { video_spec } = payload;
  const { fps, duration: totalDuration } = video_spec; // Grab the total duration here
  const { width, height } = video_spec.resolution;

  // 1. Sanitize all paths
  const safeAudioPath = sanitizePath(audioInputPath);
  const finalOutputPath = sanitizePath(outputFilePath);

  const jobID = randomBytes(4).toString("hex");
  const workingDir = sanitizePath(path.join(tmpdir(), `ffmpeg-job-${jobID}`));
  if (!fs.existsSync(workingDir)) fs.mkdirSync(workingDir, { recursive: true });

  try {
    const scenes = Object.values(video_spec.movements).flatMap((m) => m.scenes);

    // 2. Download Assets
    const sceneAssets = await Promise.all(
      scenes.map(async (scene) => {
        const dest = `${workingDir}/scene_${scene.scene_number}.jpg`;
        await downloadFile(scene.image_src, dest);
        return { ...scene, localPath: dest };
      }),
    );

    const command = ffmpeg();
    const filterGraph = [];
    let runningOffset = 0;

    // 3. Inputs
    sceneAssets.forEach((scene) => {
      command.input(scene.localPath).inputOptions(["-loop 1"]);
    });
    command.input(safeAudioPath);

    // 4. Filter Graph Construction
    sceneAssets.forEach((scene, i) => {
      filterGraph.push(
        `[${i}:v]${generateKenBurnsFilter(scene, width, height, fps)}[v${i}]`,
      );
    });

    let lastStream = "v0";
    const transDur = 0.5;
    for (let i = 0; i < sceneAssets.length - 1; i++) {
      const duration = sceneAssets[i].end_time - sceneAssets[i].start_time;
      runningOffset += duration;
      const outStream = `xfade${i}`;
      filterGraph.push(
        `[${lastStream}][v${i + 1}]xfade=transition=fade:duration=${transDur}:offset=${runningOffset - transDur}[${outStream}]`,
      );
      lastStream = outStream;
    }

    // 5. Run FFmpeg
    return new Promise((resolve, reject) => {
      command
        .complexFilter(filterGraph)
        .outputOptions([
          "-map",
          `[${lastStream}]`,
          "-map",
          `${sceneAssets.length}:a`,
          "-c:v libx264",
          "-pix_fmt yuv420p",
          `-t ${totalDuration}`, // CLAMP: Forces the output to match payload duration
          "-shortest", // Backup: Ensures we don't outrun the audio if it's shorter
          "-y",
        ])
        .on("start", (cmd) => console.log(`FFmpeg started: ${cmd}`))
        .on("progress", (p) =>
          console.log(`Encoding: ${p.percent?.toFixed(1) || 0}%`),
        )
        .on("error", (err, stdout, stderr) => {
          console.error("FFmpeg Error:", stderr);
          cleanup(workingDir);
          reject(err);
        })
        .on("end", () => {
          cleanup(workingDir);
          resolve(finalOutputPath);
        })
        .save(finalOutputPath);
    });
  } catch (error) {
    cleanup(workingDir);
    throw error;
  }
}

/**
 * Internal Utilities
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      (response) => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
          return downloadFile(response.headers.location, dest)
            .then(resolve)
            .catch(reject);
        }
        if (response.statusCode !== 200)
          return reject(new Error(`Status: ${response.statusCode}`));
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      },
    );
    request.on("error", (err) => {
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function cleanup(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
