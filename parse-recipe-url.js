import dotenv from "dotenv";
import { longLivedFetch } from "./helpers.js";
import { createMidiFromSpec } from "./midi-generation/index.js";
import fs from "fs";
import convertMidiToWav from "./midi-generation/midi-to-wav.js";

dotenv.config();

const WEBHOOK_URL = process.env.MIDI_WEBHOOK_URL;
const SOUNDFONT_PATH = process.env.SOUNDFONT_PATH;

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node midi-generator.js <recipe-url>");
  console.error(
    "Example: node midi-generator.js https://raymonds.recipes/spaghetti-aglio-e-olio/",
  );
  console.error(`\nWebhook URL: ${WEBHOOK_URL}`);
  console.error(
    "Set MIDI_WEBHOOK_URL environment variable to override default\n",
  );
  process.exit(1);
}

const recipeUrl = args[0];

const webhookResult = await longLivedFetch(WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ recipe_url: recipeUrl }),
});

console.log(webhookResult);
const midiBytes = createMidiFromSpec(webhookResult);

const mediaFileName = webhookResult.recipe.name.replace(/\s+/g, "_");
const midiFilePath = `./media/${mediaFileName}.mid`;
const wavFilePath = `./media/${mediaFileName}.wav`;

fs.writeFileSync(midiFilePath, midiBytes);

convertMidiToWav(midiFilePath, wavFilePath, SOUNDFONT_PATH);
