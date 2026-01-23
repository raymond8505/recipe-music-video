#!/usr/bin/env node
// midi-generator.js
require("dotenv").config();
const { Midi } = require("@tonejs/midi");
const fs = require("fs");

// Configuration - read from environment variable
const WEBHOOK_URL =
  process.env.MIDI_WEBHOOK_URL ||
  "http://localhost:5678/webhook/recipe-to-midi";

// Parse CLI arguments
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

const { execSync } = require("child_process");
const generateSlideshow = require("./generate-slideshow");
const { generateMidi } = require("./generate-midi");

// Configuration for fluidsynth soundfont
const SOUNDFONT_PATH = process.env.SOUNDFONT_PATH;

//|| 'C:/Users/crazy/OneDrive/Desktop/projects/recipe-music/GeneralUser-GS/GeneralUser-GS.sf2';

/**
 * Convert MIDI to WAV using fluidsynth
 * @param {string} midiFilePath - Path to the MIDI file
 * @param {string} wavFilePath - Output WAV file path
 */
function convertMidiToWav(midiFilePath, wavFilePath) {
  console.log("🎹 Converting MIDI to WAV with FluidSynth...");

  const command = `fluidsynth -nil -F "${wavFilePath}" "${SOUNDFONT_PATH}" "${midiFilePath}"`;
  console.log(`  Command: ${command}\n`);

  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✓ ${wavFilePath}\n`);
  } catch (error) {
    throw new Error(`FluidSynth conversion failed: ${error.message}`);
  }
}

async function main() {
  try {
    // 1. Call webhook
    console.log(`Posting recipe URL to webhook: ${WEBHOOK_URL}`);
    console.log(`Recipe: ${recipeUrl}\n`);

    const { Agent } = require("undici");

    const longTimeoutAgent = new Agent({
      connectTimeout: 600000, // 10 minutes for connection
      headersTimeout: 600000, // 10 minutes for headers
      bodyTimeout: 600000, // 10 minutes for body
    });
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_url: recipeUrl }),

      dispatcher: longTimeoutAgent,
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.status}`);
    }

    const result = await webhookResponse.json();
    console.log("✓ Received workflow response\n");

    // 2. Extract data
    const slideshowSpec = result.slideshow_spec;
    const midiSpec = result.midi_spec;
    const ffmpegInstructions = result.ffmpeg_instructions; // From LLM prompt
    const generatedImages = result.generated_images; // Array with URLs
    const recipeName = result.recipe_name;

    // 3. Generate MIDI
    console.log("🎵 Generating MIDI...");
    const midi = generateMidi(midiSpec);
    const midiFilename = `${recipeName.replace(/\s+/g, "_")}.mid`;
    fs.writeFileSync(midiFilename, Buffer.from(midi.toArray()));
    console.log(`✓ ${midiFilename}\n`);

    // 4. Convert MIDI to WAV using FluidSynth
    const wavFilename = `${recipeName.replace(/\s+/g, "_")}.wav`;
    convertMidiToWav(midiFilename, wavFilename);

    console.log({ generatedImages });
    // 5. Extract image URLs in scene order
    const imageUrls = generatedImages;

    // Build FFmpeg command
    const videoFilename = `${recipeName.replace(/\s+/g, "_")}.mp4`;

    generateSlideshow(
      slideshowSpec,
      ffmpegInstructions,
      imageUrls,
      wavFilename,
    );

    console.log("\n🎉 Recipe video complete!");
    console.log(`   MIDI: ${midiFilename}`);
    console.log(`   Audio: ${wavFilename}`);
    console.log(`   Video: ${videoFilename}`);
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
