/**
 * Hand Percussion Pattern
 * Syncopated conga/bongo patterns for ethnic/energetic feel.
 * Uses different pitches for different drum tones.
 * Pattern repeats every 4 beats.
 */

import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
} from "../../../config/pattern-strategies.js";

/**
 * Apply hand percussion pattern to a track.
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
  const config = PATTERN_STRATEGIES.patterns.hand_percussion;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing
  const quarterNote = 60 / tempo;
  const loopDuration = quarterNote * config.loopLength;
  const baseVelocity = velocity_avg / 127;

  let currentLoopStart = startTime;

  while (currentLoopStart < end_time) {
    // Play each note in the pattern
    for (const note of config.pattern) {
      const noteTime = currentLoopStart + quarterNote * note.offset;

      if (noteTime < end_time) {
        track.addNote({
          midi: note.pitch,
          time: noteTime,
          duration: quarterNote * config.noteDuration,
          velocity: baseVelocity * note.velocityMultiplier,
        });
      }
    }

    currentLoopStart += loopDuration;
  }

  return midi;
}

export default { apply };
