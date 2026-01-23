/**
 * Minimal Accents Pattern
 * Sparse notes (one every 3-4 seconds).
 * Random pitches from range.
 * Short duration (0.3 seconds).
 * Occasional punctuation.
 */

import { noteToMidi } from "../../note-utils.js";

const MIN_INTERVAL_SECONDS = 3;
const MAX_INTERVAL_SECONDS = 4;
const ACCENT_DURATION = 0.3;
const STACCATO_FACTOR = 0.4;

/**
 * Apply minimal accents pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {number[]} options.pitches - Available pitches in range
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section, pitches = [] } = options;

  const { start_time, end_time, velocity_avg = 70, pitch_range } = section;

  // Determine available pitches
  let availablePitches = pitches;
  if (availablePitches.length === 0 && pitch_range) {
    const lowNote = noteToMidi(pitch_range.low);
    const highNote = noteToMidi(pitch_range.high);
    for (let n = lowNote; n <= highNote; n++) {
      availablePitches.push(n);
    }
  }
  if (availablePitches.length === 0) {
    // Default range
    availablePitches = [60, 62, 64, 65, 67, 69, 71, 72];
  }

  // Simple seeded random for reproducible results
  let seed = (Math.floor(start_time * 1000) % 1000) + 42;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  let currentTime = start_time;

  while (currentTime + ACCENT_DURATION <= end_time) {
    // Pick random pitch
    const pitchIndex = Math.floor(pseudoRandom() * availablePitches.length);
    const pitch = availablePitches[pitchIndex];

    track.addNote({
      midi: pitch,
      time: currentTime,
      duration: ACCENT_DURATION * STACCATO_FACTOR,
      velocity: velocity_avg / 127,
    });

    // Random interval until next accent (3-4 seconds)
    const interval =
      MIN_INTERVAL_SECONDS +
      pseudoRandom() * (MAX_INTERVAL_SECONDS - MIN_INTERVAL_SECONDS);
    currentTime += interval;
  }

  return midi;
}

export default { apply };
