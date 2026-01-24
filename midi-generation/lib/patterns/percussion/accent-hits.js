/**
 * Accent Hits Pattern
 * Occasional single hits for structural punctuation.
 * Cymbal crashes or similar at key moments.
 * Evenly spaced through section with long sustain.
 */

import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
} from "../../../config/pattern-strategies.js";

/**
 * Apply accent hits pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {number} options.tempo - Tempo in BPM
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section } = options;

  const { end_time, velocity_avg = 70 } = section;

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.accent_hits;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing
  const duration = end_time - startTime;
  const hitCount = config.hitsPerSection;
  const baseVelocity = (velocity_avg / 127) * config.velocityMultiplier;

  // Place hits evenly spaced through section
  for (let i = 0; i < hitCount; i++) {
    // Distribute hits evenly, avoiding very start and very end
    const hitTime = startTime + (duration * (i + 1)) / (hitCount + 1);
    const instrument = config.instruments[i % config.instruments.length];

    track.addNote({
      midi: instrument.pitch,
      time: hitTime,
      duration: config.duration,
      velocity: baseVelocity,
    });
  }

  return midi;
}

export default { apply };
