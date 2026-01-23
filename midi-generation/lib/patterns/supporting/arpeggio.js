/**
 * Harmonic Arpeggio Pattern
 * Builds triad from scale (root, third, fifth).
 * Arpeggiates pattern based on config.
 * Velocity below melody.
 */

import { buildChord, noteToMidi } from "../../note-utils.js";
import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
} from "../../../config/pattern-strategies.js";

/**
 * Apply harmonic arpeggio pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {number} options.tempo - Tempo in BPM
 * @param {number[]} options.scale - Scale pitches
 * @param {number[]} options.pitches - Available pitches in range
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section, tempo, scale = [], pitches = [] } = options;

  const { end_time, velocity_avg = 80 } = section;

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.harmonic_arpeggio;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing from config
  const quarterNote = 60 / tempo;
  const noteValue = quarterNote * config.noteValue;
  const noteDuration = noteValue * config.durationFactor;

  // Determine root note from scale or section
  let root;
  if (section.scale && section.scale.root) {
    root = noteToMidi(section.scale.root);
  } else if (scale.length > 0) {
    root = scale[0];
  } else if (pitches.length > 0) {
    root = pitches[0];
  } else {
    root = 48; // Default to C3
  }

  // Build triad
  const chord = buildChord(root, scale, "triad");

  // Ensure we have at least 3 notes for the arpeggio pattern
  while (chord.length < 3) {
    chord.push(chord[chord.length - 1] + 4); // Add approximate third
  }

  // Build arpeggio pattern from config indices
  const arpeggioPattern = config.pattern.map((index) => {
    // Clamp index to valid chord range
    const clampedIndex = Math.min(index, chord.length - 1);
    return chord[clampedIndex];
  });

  // Apply velocity modifier from config
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  let currentTime = startTime;
  let patternIndex = 0;

  // Fill section with arpeggio
  while (currentTime + noteValue <= end_time) {
    const pitch = arpeggioPattern[patternIndex % arpeggioPattern.length];

    track.addNote({
      midi: pitch,
      time: currentTime,
      duration: noteDuration,
      velocity: adjustedVelocity / 127,
    });

    currentTime += noteValue;
    patternIndex++;
  }

  return midi;
}
export default { apply };
