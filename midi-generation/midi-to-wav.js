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
  const command = `${exePath} -nil -F "${path.resolve(wavFilePath)}" "${path.resolve(soundFontPath)}" "${path.resolve(midiFilePath)}" -g 3.0`;
  console.log(`  Command: ${command}\n`);

  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✓ ${wavFilePath}\n`);
  } catch (error) {
    throw new Error(`FluidSynth conversion failed: ${error.message}`);
  }
}
