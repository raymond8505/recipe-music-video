/**
 * Gentle Breathing Pattern
 * One note every 3 beats (lots of space).
 * Stepwise motion (move by 1-2 scale degrees).
 * Sustained notes (1.2x beat duration).
 * Calm, spacious feel.
 */

import { getScaleStep, noteToMidi } from "../../note-utils.js";

const BEATS_BETWEEN_NOTES = 3;
const SUSTAIN_FACTOR = 1.2;
const MAX_STEP_SIZE = 2; // Scale degrees

/**
 * Apply gentle breathing pattern to a track.
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

  const { start_time, end_time, velocity_avg = 70, pitch_range } = section;

  // Calculate timing
  const quarterNote = 60 / tempo;
  const noteInterval = BEATS_BETWEEN_NOTES * quarterNote;
  const noteDuration = quarterNote * SUSTAIN_FACTOR;

  // Determine available pitches
  let availablePitches = pitches.length > 0 ? pitches : scale;
  if (availablePitches.length === 0) {
    // Create a simple range if no pitches provided
    const lowNote = pitch_range ? noteToMidi(pitch_range.low) : 48;
    const highNote = pitch_range ? noteToMidi(pitch_range.high) : 72;
    for (let n = lowNote; n <= highNote; n++) {
      availablePitches.push(n);
    }
  }

  // Start in the middle of the range
  let currentPitch = availablePitches[Math.floor(availablePitches.length / 2)];
  let currentTime = start_time;

  // Simple seeded random for consistent results
  let seed = Math.floor(start_time * 1000) % 1000;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  while (currentTime + noteDuration <= end_time) {
    track.addNote({
      midi: currentPitch,
      time: currentTime,
      duration: noteDuration,
      velocity: velocity_avg / 127,
    });

    currentTime += noteInterval;

    // Move stepwise for next note
    if (scale.length > 0) {
      const step =
        Math.floor(pseudoRandom() * (MAX_STEP_SIZE * 2 + 1)) - MAX_STEP_SIZE;
      currentPitch = getScaleStep(currentPitch, scale, step);
    } else {
      // Chromatic stepwise
      const step = Math.floor(pseudoRandom() * 5) - 2; // -2 to +2
      currentPitch = Math.max(
        availablePitches[0],
        Math.min(
          availablePitches[availablePitches.length - 1],
          currentPitch + step,
        ),
      );
    }
  }

  return midi;
}
export default { apply };
