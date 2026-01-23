/**
 * Decorative Flourish Pattern
 * Appears at 60-70% through the section.
 * 4 quick ascending notes (sixteenth note rhythm).
 * Upper register of pitch range.
 * Brief, ornamental.
 */

import { noteToMidi } from "../../note-utils.js";
const FLOURISH_POSITION = 0.65; // 65% through section
const FLOURISH_NOTE_COUNT = 4;
const VELOCITY_BOOST = 5; // Slightly brighter than surroundings

/**
 * Apply decorative flourish pattern to a track.
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

  const { start_time, end_time, velocity_avg = 80, pitch_range } = section;

  // Calculate timing
  const quarterNote = 60 / tempo;
  const sixteenthNote = quarterNote / 4;

  // Determine when flourish starts (60-70% through section)
  const sectionDuration = end_time - start_time;
  const flourishStart = start_time + sectionDuration * FLOURISH_POSITION;

  // Determine pitches for flourish (upper register)
  let flourishPitches = [];

  if (pitches.length >= FLOURISH_NOTE_COUNT) {
    // Use top quarter of available pitches
    const startIndex = Math.floor(pitches.length * 0.75);
    flourishPitches = pitches.slice(
      startIndex,
      startIndex + FLOURISH_NOTE_COUNT,
    );
  } else if (scale.length >= FLOURISH_NOTE_COUNT) {
    // Use top quarter of scale
    const startIndex = Math.floor(scale.length * 0.75);
    flourishPitches = scale.slice(startIndex, startIndex + FLOURISH_NOTE_COUNT);
  } else if (pitch_range) {
    // Build ascending pitches from upper range
    const highNote = noteToMidi(pitch_range.high);
    for (let i = 0; i < FLOURISH_NOTE_COUNT; i++) {
      flourishPitches.push(highNote - (FLOURISH_NOTE_COUNT - 1 - i) * 2);
    }
  } else {
    // Default ascending flourish
    flourishPitches = [72, 74, 76, 79]; // C5, D5, E5, G5
  }

  // Ensure we have exactly 4 ascending notes
  while (flourishPitches.length < FLOURISH_NOTE_COUNT) {
    const lastPitch = flourishPitches[flourishPitches.length - 1] || 72;
    flourishPitches.push(lastPitch + 2);
  }

  // Sort ascending
  flourishPitches.sort((a, b) => a - b);
  flourishPitches = flourishPitches.slice(0, FLOURISH_NOTE_COUNT);

  // Velocity slightly boosted
  const flourishVelocity = Math.min(127, velocity_avg + VELOCITY_BOOST) / 127;

  // Add flourish notes
  let currentTime = flourishStart;
  flourishPitches.forEach((pitch) => {
    track.addNote({
      midi: Math.min(127, Math.max(0, pitch)),
      time: currentTime,
      duration: sixteenthNote * 0.8, // Slightly detached
      velocity: flourishVelocity,
    });
    currentTime += sixteenthNote;
  });

  return midi;
}
export default { apply };
