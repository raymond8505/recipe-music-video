import { execSync } from "child_process";
import path from "path";
/**
 * Convert MIDI to WAV using fluidsynth
 * @param {string} midiFilePath - Path to the MIDI file
 * @param {string} wavFilePath - Output WAV file path
 */
export default function convertMidiToWav(
  midiFilePath,
  wavFilePath,
  soundFontPath,
) {
  console.log("🎹 Converting MIDI to WAV with FluidSynth...");

  const exePath = path.resolve("./midi-generation/bin/fluidsynth/fluidsynth");

  // standard
  //const command = `${exePath} -nil -F "${path.resolve(wavFilePath)}" "${path.resolve(soundFontPath)}" "${path.resolve(midiFilePath)}"`;

  // High-quality rendering, 48kHz, 16-bit (Universal standard)
  const command = `"${exePath}" -ni -g 0.6 -R 1 -C 1 -r 48000 -O s16 -F "${path.resolve(wavFilePath)}" "${path.resolve(soundFontPath)}" "${path.resolve(midiFilePath)}"`;

  console.log(`  Command: ${command}\n`);

  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✓ ${wavFilePath}\n`);
  } catch (error) {
    throw new Error(`FluidSynth conversion failed: ${error.message}`);
  }
}
