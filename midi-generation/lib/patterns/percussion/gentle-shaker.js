/**
 * Gentle Shaker Pattern
 * Continuous light shaker for subtle rhythmic texture.
 * Very rapid alternating pattern (32nd notes).
 * Very quiet velocity for background texture.
 */

import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
} from "../../../config/pattern-strategies.js";

/**
 * Apply gentle shaker pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {number} options.tempo - Tempo in BPM
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section, tempo } = options;

  const { end_time, velocity_avg = 70 } = section;

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.gentle_shaker;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing from config
  const quarterNote = 60 / tempo;
  const noteValue = quarterNote * config.noteValue; // 32nd note duration
  const velocity = (velocity_avg / 127) * config.velocityMultiplier;

  let currentTime = startTime;
  let patternIndex = 0;

  while (currentTime < end_time) {
    // Follow on-off pattern
    if (config.pattern[patternIndex % config.pattern.length] === 1) {
      track.addNote({
        midi: config.pitch,
        time: currentTime,
        duration: noteValue * 0.8, // Slightly shorter than note value
        velocity: velocity,
      });
    }

    currentTime += noteValue;
    patternIndex++;
  }

  return midi;
}

export default { apply };
