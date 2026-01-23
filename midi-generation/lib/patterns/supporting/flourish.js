/**
 * Decorative Flourish Pattern
 * Appears at configured point through the section.
 * Quick ascending/descending notes (configurable rhythm).
 * Upper register of pitch range.
 * Brief, ornamental.
 */

import { noteToMidi } from "../../note-utils.js";
import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
} from "../../../config/pattern-strategies.js";

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

  const { end_time, velocity_avg = 80, pitch_range } = section;

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.decorative_flourish;

  // Handle late entry - use section late_entry if provided, otherwise use config appearTime
  // Section late_entry takes precedence
  let flourishStart;
  if (section.late_entry !== undefined && section.late_entry > 0) {
    flourishStart = calculateLateEntryStart(section);
  } else {
    // Use config appearTime as built-in late entry for this pattern
    const sectionDuration = end_time - section.start_time;
    flourishStart = section.start_time + sectionDuration * config.appearTime;
  }

  // Calculate timing
  const quarterNote = 60 / tempo;
  const noteValue = quarterNote * config.noteValue;
  const noteDuration = noteValue * config.durationFactor;

  // Determine pitches for flourish (upper register)
  let flourishPitches = [];
  const noteCount = config.noteCount;

  if (pitches.length >= noteCount) {
    // Use top quarter of available pitches
    const startIndex = Math.floor(pitches.length * 0.75);
    flourishPitches = pitches.slice(startIndex, startIndex + noteCount);
  } else if (scale.length >= noteCount) {
    // Use top quarter of scale
    const startIndex = Math.floor(scale.length * 0.75);
    flourishPitches = scale.slice(startIndex, startIndex + noteCount);
  } else if (pitch_range) {
    // Build pitches from upper range
    const highNote = noteToMidi(pitch_range.high);
    for (let i = 0; i < noteCount; i++) {
      flourishPitches.push(highNote - (noteCount - 1 - i) * 2);
    }
  } else {
    // Default ascending flourish
    flourishPitches = [72, 74, 76, 79]; // C5, D5, E5, G5
  }

  // Ensure we have exactly the configured number of notes
  while (flourishPitches.length < noteCount) {
    const lastPitch = flourishPitches[flourishPitches.length - 1] || 72;
    flourishPitches.push(lastPitch + 2);
  }

  // Apply direction from config
  flourishPitches.sort((a, b) => a - b);
  flourishPitches = flourishPitches.slice(0, noteCount);

  if (config.direction === 'descending') {
    flourishPitches.reverse();
  } else if (config.direction === 'random') {
    // Shuffle using seeded random
    let seed = Math.floor(flourishStart * 1000) % 1000;
    const pseudoRandom = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = flourishPitches.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [flourishPitches[i], flourishPitches[j]] = [flourishPitches[j], flourishPitches[i]];
    }
  }
  // 'ascending' is default (already sorted ascending)

  // Apply velocity modifier from config
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  // Add flourish notes - ensure we don't exceed end_time
  let currentTime = flourishStart;
  flourishPitches.forEach((pitch) => {
    if (currentTime + noteDuration > end_time) return;

    track.addNote({
      midi: Math.min(127, Math.max(0, pitch)),
      time: currentTime,
      duration: noteDuration,
      velocity: adjustedVelocity / 127,
    });
    currentTime += noteValue;
  });

  return midi;
}
export default { apply };
