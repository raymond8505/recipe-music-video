/**
 * Foundation Pedal Pattern
 * Single sustained note for entire section duration.
 * Uses low note from pitch range (bottom quartile).
 * Quiet, provides harmonic grounding.
 */

import { noteToMidi } from "../../note-utils.js";
import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
} from "../../../config/pattern-strategies.js";

/**
 * Apply foundation pedal pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {number[]} options.scale - Scale pitches
 * @param {number[]} options.pitches - Available pitches in range
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section, scale = [], pitches = [] } = options;

  const { end_time, velocity_avg = 80, pitch_range } = section;

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.foundation_pedal;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Determine pedal note based on config pitch selection
  let pedalNote;

  if (pitches.length > 0) {
    // Use quartile position from config
    const quartileIndex = Math.floor(pitches.length * config.quartilePosition);
    pedalNote = pitches[Math.max(0, quartileIndex)];
  } else if (pitch_range) {
    // Use low end of range
    pedalNote = noteToMidi(pitch_range.low);
  } else if (scale.length > 0) {
    // Use low note from scale
    pedalNote = scale[0];
  } else {
    // Default to C2
    pedalNote = 36;
  }

  // Calculate duration (from start to end minus small gap from config)
  const duration = end_time - startTime - config.sustainGap;

  // Apply velocity modifier from config
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  track.addNote({
    midi: pedalNote,
    time: startTime,
    duration: Math.max(0.1, duration),
    velocity: adjustedVelocity / 127,
  });

  return midi;
}
export default { apply };
