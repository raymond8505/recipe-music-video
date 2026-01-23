/**
 * Foundation Pedal Pattern
 * Single sustained note for entire section duration.
 * Uses low note from pitch range (bottom quartile).
 * Quiet (15-25 velocity below melody).
 * Provides harmonic grounding.
 */

import { noteToMidi } from "../../note-utils.js";

const VELOCITY_REDUCTION = 20;
const SUSTAIN_GAP = 0.05; // Small gap at end to avoid clipping

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

  const { start_time, end_time, velocity_avg = 80, pitch_range } = section;

  // Determine pedal note (low note from bottom quartile)
  let pedalNote;

  if (pitches.length > 0) {
    // Use bottom quartile
    const quartileIndex = Math.floor(pitches.length / 4);
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

  // Calculate duration (full section minus small gap)
  const duration = end_time - start_time - SUSTAIN_GAP;

  // Velocity is quiet, below melody
  const pedalVelocity = Math.max(15, velocity_avg - VELOCITY_REDUCTION) / 127;

  track.addNote({
    midi: pedalNote,
    time: start_time,
    duration: Math.max(0.1, duration),
    velocity: pedalVelocity,
  });

  return midi;
}
export default { apply };
