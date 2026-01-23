/**
 * Minimal Accents Pattern
 * Sparse notes at configured intervals.
 * Random pitches from range.
 * Short duration.
 * Occasional punctuation.
 */

import { noteToMidi } from "../../note-utils.js";
import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
  humanizeValue,
} from "../../../config/pattern-strategies.js";

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

  const { end_time, velocity_avg = 70, pitch_range } = section;

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.minimal_accents;
  const spacingConfig = PATTERN_STRATEGIES.rhythmicSpacing.accents;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate note duration from config
  const noteDuration = config.duration * config.durationFactor;

  // Apply velocity modifier
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  // Determine available pitches
  let availablePitches = [...pitches];
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
  let seed = (Math.floor(startTime * 1000) % 1000) + 42;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  let currentTime = startTime;

  while (currentTime + noteDuration <= end_time) {
    // Pick random pitch
    const pitchIndex = Math.floor(pseudoRandom() * availablePitches.length);
    const pitch = availablePitches[pitchIndex];

    track.addNote({
      midi: pitch,
      time: currentTime,
      duration: noteDuration,
      velocity: adjustedVelocity / 127,
    });

    // Random interval until next accent from config range
    const baseInterval = config.minInterval +
      pseudoRandom() * (config.maxInterval - config.minInterval);

    // Apply humanization
    const interval = humanizeValue(baseInterval, spacingConfig.humanize, pseudoRandom);
    currentTime += interval;
  }

  return midi;
}

export default { apply };
