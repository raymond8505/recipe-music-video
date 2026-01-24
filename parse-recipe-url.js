import dotenv from "dotenv";
import { longLivedFetch, sanitizePath } from "./helpers.js";
import { createMidiFromSpec } from "./midi-generation/index.js";
import fs from "fs";
import convertMidiToWav from "./midi-generation/midi-to-wav.js";
import { createSlideshowFromSpec } from "./slideshow-generation/index.js";
import path from "path";

dotenv.config();

const MIDI_WEBHOOK_URL = process.env.MIDI_WEBHOOK_URL;
const VIDEO_WEBHOOK_URL = process.env.VIDEO_WEBHOOK_URL;
const SOUNDFONT_PATH = process.env.SOUNDFONT_PATH;

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node midi-generator.js <recipe-url>");
  console.error(
    "Example: node midi-generator.js https://raymonds.recipes/spaghetti-aglio-e-olio/",
  );
  console.error(`\nWebhook URL: ${MIDI_WEBHOOK_URL}`);
  console.error(
    "Set MIDI_WEBHOOK_URL environment variable to override default\n",
  );
  process.exit(1);
}

const recipeUrl = args[0];

const midiResult = await longLivedFetch(MIDI_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipe_url: recipeUrl }),
});

const midiBytes = createMidiFromSpec(midiResult);

const mediaFileName = midiResult.recipe.name.replace(/\s+/g, "_");
const midiFilePath = sanitizePath(`./media/${mediaFileName}.mid`);
const wavFilePath = sanitizePath(`./media/${mediaFileName}.wav`);
const mp4FilePath = sanitizePath(`./media/${mediaFileName}.mp4`);

fs.writeFileSync(midiFilePath, midiBytes);

convertMidiToWav(midiFilePath, wavFilePath, SOUNDFONT_PATH);

console.log("Getting Video Spec");

const videoResult = await longLivedFetch(VIDEO_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(midiResult),
});

console.log("Creating Slideshow");
createSlideshowFromSpec(videoResult, wavFilePath, mp4FilePath);
