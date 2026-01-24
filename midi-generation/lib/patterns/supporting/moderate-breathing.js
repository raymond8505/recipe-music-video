/**
 * Moderate Breathing Pattern
 * One note every 2 beats (gentle rhythmic pulse).
 * Stepwise motion (move by 1-2 scale degrees).
 * Sustained notes.
 * Continuous but calm presence.
 */

import { getScaleStep, noteToMidi } from "../../note-utils.js";
import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
  humanizeValue,
} from "../../../config/pattern-strategies.js";

/**
 * Apply moderate breathing pattern to a track.
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

  const { end_time, velocity_avg = 70, pitch_range } = section;

  // Get configuration - use base breathing pattern config for note duration
  const config = PATTERN_STRATEGIES.patterns.gentle_breathing;
  const spacingConfig = PATTERN_STRATEGIES.rhythmicSpacing.moderate_breathing;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing from config
  const quarterNote = 60 / tempo;
  const baseNoteInterval = spacingConfig.interval * quarterNote; // 2 beats
  const noteDuration = quarterNote * config.noteDuration;

  // Apply velocity modifier
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  // Determine available pitches
  let availablePitches = pitches.length > 0 ? pitches : scale;
  if (availablePitches.length === 0) {
    // Create a simple range if no pitches provided
    const lowNote = pitch_range ? noteToMidi(pitch_range.low) : 48;
    const highNote = pitch_range ? noteToMidi(pitch_range.high) : 72;
    availablePitches = [];
    for (let n = lowNote; n <= highNote; n++) {
      availablePitches.push(n);
    }
  }

  // Start in the middle of the range
  let currentPitch = availablePitches[Math.floor(availablePitches.length / 2)];
  let currentTime = startTime;

  // Simple seeded random for consistent results
  let seed = Math.floor(startTime * 1000) % 1000;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  while (currentTime + noteDuration <= end_time) {
    // Apply humanization to timing
    const humanizedInterval = humanizeValue(baseNoteInterval, spacingConfig.humanize, pseudoRandom);

    track.addNote({
      midi: currentPitch,
      time: currentTime,
      duration: noteDuration,
      velocity: adjustedVelocity / 127,
    });

    currentTime += humanizedInterval;

    // Move stepwise for next note based on config
    if (config.stepwise && scale.length > 0) {
      const maxStep = config.maxInterval;
      const step = Math.floor(pseudoRandom() * (maxStep * 2 + 1)) - maxStep;
      currentPitch = getScaleStep(currentPitch, scale, step);
    } else if (scale.length > 0) {
      const step = Math.floor(pseudoRandom() * (config.maxInterval * 2 + 1)) - config.maxInterval;
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
