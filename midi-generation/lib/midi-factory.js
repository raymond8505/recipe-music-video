/**
 * MIDI Factory
 * Main orchestration module that generates MIDI from a specification.
 * Coordinates between pattern handlers and the MIDI object.
 */

import midi from "@tonejs/midi";
import {
  getPattern,
  isThematicPattern,
  isValidPattern,
} from "./pattern-registry.js";
import { noteToMidi, getScale, getPitchesInRange } from "./note-utils.js";

const Midi = midi.Midi;
/**
 * Generate a MIDI object from a specification.
 * @param {Object} spec - The midi_spec object from input
 * @returns {Midi} The generated MIDI object
 */
export function generateMidi(spec) {
  const midi = new Midi();

  // Set global header properties
  const tempo = spec.tempo || 120;
  midi.header.setTempo(tempo);

  // Set time signature
  const timeSignature = spec.time_signature || [4, 4];
  midi.header.timeSignatures = [
    {
      ticks: 0,
      timeSignature: timeSignature,
      measures: 0,
    },
  ];

  // Set key signature if provided
  if (spec.key_signature) {
    midi.header.keySignatures = [
      {
        key: spec.key_signature,
        scale: "major",
        ticks: 0,
      },
    ];
  }

  // Extract shared constants
  const theme = spec.themeDefinition || null;

  // Process each track
  if (spec.tracks && Array.isArray(spec.tracks)) {
    spec.tracks.forEach((trackSpec, trackIndex) => {
      processTrack(midi, trackSpec, trackIndex, { theme, tempo });
    });
  }

  // Add metadata track if provided
  if (spec.metadata) {
    addMetadataTrack(midi, spec.metadata);
  }

  return midi;
}

/**
 * Process a single track specification.
 * @param {Midi} midi - The MIDI object
 * @param {Object} trackSpec - Track specification
 * @param {number} trackIndex - Track index (for channel assignment)
 * @param {Object} sharedOptions - Shared options (theme, tempo)
 */
function processTrack(midi, trackSpec, trackIndex, sharedOptions) {
  const { theme, tempo } = sharedOptions;

  // Create the track
  const track = midi.addTrack();

  // Set track properties
  track.name =
    trackSpec.component_source ||
    trackSpec.instrument_name ||
    `Track ${trackIndex + 1}`;
  track.instrument.number = trackSpec.midi_program || 0;
  track.channel = trackSpec.track_number
    ? (trackSpec.track_number - 1) % 16
    : trackIndex % 16;

  // Process each section in the track
  if (trackSpec.sections && Array.isArray(trackSpec.sections)) {
    trackSpec.sections.forEach((section) => {
      processSection(midi, track, section, { theme, tempo });
    });
  }
}

/**
 * Process a single section within a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} track - The track to add notes to
 * @param {Object} section - Section specification
 * @param {Object} sharedOptions - Shared options (theme, tempo)
 */
function processSection(midi, track, section, sharedOptions) {
  const { theme, tempo } = sharedOptions;
  const { pattern_type } = section;

  // Validate pattern type
  if (!pattern_type) {
    console.warn("Section missing pattern_type, skipping");
    return;
  }

  if (!isValidPattern(pattern_type)) {
    console.warn(`Unknown pattern type: ${pattern_type}, skipping`);
    return;
  }

  // Get the pattern handler
  const patternHandler = getPattern(pattern_type);
  if (!patternHandler || typeof patternHandler.apply !== "function") {
    console.warn(`Pattern handler for ${pattern_type} is invalid, skipping`);
    return;
  }

  // Validate theme requirement for thematic patterns
  if (isThematicPattern(pattern_type) && !theme) {
    console.warn(
      `Pattern ${pattern_type} requires a theme, but none provided. Skipping.`,
    );
    return;
  }

  // Build the scale from section specification
  let scale = [];
  if (section.scale) {
    try {
      const rootMidi = noteToMidi(section.scale.root);
      scale = getScale(rootMidi, section.scale.type || "major");
    } catch (err) {
      console.warn(`Failed to build scale: ${err.message}`);
    }
  }

  // Build available pitches from pitch range
  let pitches = [];
  if (section.pitch_range) {
    try {
      pitches = getPitchesInRange(
        section.pitch_range,
        scale.length > 0 ? scale : null,
      );
    } catch (err) {
      console.warn(`Failed to get pitches in range: ${err.message}`);
    }
  }

  // Build options object with everything the pattern needs
  const options = {
    track,
    section,
    theme,
    tempo,
    scale,
    pitches,
  };

  // Apply the pattern
  try {
    patternHandler.apply(midi, options);
  } catch (err) {
    console.error(`Error applying pattern ${pattern_type}: ${err.message}`);
  }
}

/**
 * Add a metadata track with recipe information and structure markers.
 * @param {Midi} midi - The MIDI object
 * @param {Object} metadata - Metadata specification
 */
function addMetadataTrack(midi, metadata) {
  const markerTrack = midi.addTrack();
  markerTrack.name = metadata.recipe_name
    ? `Recipe: ${metadata.recipe_name}`
    : "Metadata";

  // Add structure markers as text events if supported
  if (metadata.structure_markers && Array.isArray(metadata.structure_markers)) {
    metadata.structure_markers.forEach((marker) => {
      // Note: @tonejs/midi doesn't directly support text markers,
      // but we can add a very quiet note as a placeholder
      // Or we could use track.addText() if available in newer versions
      if (typeof markerTrack.addText === "function") {
        markerTrack.addText(marker.label, marker.time);
      }
    });
  }
}

/**
 * Validate a specification before generation.
 * @param {Object} spec - The midi_spec object
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateSpec(spec) {
  const errors = [];

  if (!spec) {
    errors.push("Specification is null or undefined");
    return { isValid: false, errors };
  }

  if (!spec.tempo || spec.tempo < 20 || spec.tempo > 300) {
    errors.push("Invalid or missing tempo (must be 20-300 BPM)");
  }

  if (!spec.tracks || !Array.isArray(spec.tracks) || spec.tracks.length === 0) {
    errors.push("Missing or empty tracks array");
  }

  // Check for thematic patterns without theme
  const hasThematicPatterns = spec.tracks?.some((track) =>
    track.sections?.some((section) => isThematicPattern(section.pattern_type)),
  );

  if (hasThematicPatterns && !spec.themeDefinition) {
    errors.push("Spec contains thematic patterns but no themeDefinition");
  }

  if (spec.themeDefinition) {
    if (
      !spec.themeDefinition.notes ||
      !Array.isArray(spec.themeDefinition.notes)
    ) {
      errors.push("themeDefinition.notes must be an array");
    }
    if (
      !spec.themeDefinition.rhythm ||
      !Array.isArray(spec.themeDefinition.rhythm)
    ) {
      errors.push("themeDefinition.rhythm must be an array");
    }
    if (
      spec.themeDefinition.notes?.length !== spec.themeDefinition.rhythm?.length
    ) {
      errors.push(
        "themeDefinition.notes and themeDefinition.rhythm must have same length",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
