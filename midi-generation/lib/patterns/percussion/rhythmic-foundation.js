/**
 * Rhythmic Foundation Pattern
 * Basic drum pattern (kick, snare, hi-hat) for driving energy.
 * Standard 4/4 rock/pop pattern.
 * Kick on beats 1 and 3, snare on 2 and 4, hi-hat on eighth notes.
 */

import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
} from "../../../config/pattern-strategies.js";

/**
 * Apply rhythmic foundation pattern to a track.
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
  const config = PATTERN_STRATEGIES.patterns.rhythmic_foundation;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing
  const quarterNote = 60 / tempo;
  const duration = end_time - startTime;
  const numBeats = Math.floor(duration / quarterNote);

  const baseVelocity = velocity_avg / 127;

  // Add kicks (beats 1 and 3 in each measure)
  for (let beat = 0; beat < numBeats; beat++) {
    if (config.kick.beats.includes(beat % 4)) {
      track.addNote({
        midi: config.kick.pitch,
        time: startTime + beat * quarterNote,
        duration: quarterNote * 0.3,
        velocity: baseVelocity * config.kick.velocityMultiplier,
      });
    }
  }

  // Add snares (beats 2 and 4 in each measure)
  for (let beat = 0; beat < numBeats; beat++) {
    if (config.snare.beats.includes(beat % 4)) {
      track.addNote({
        midi: config.snare.pitch,
        time: startTime + beat * quarterNote,
        duration: quarterNote * 0.2,
        velocity: baseVelocity * config.snare.velocityMultiplier,
      });
    }
  }

  // Add hi-hats (eighth notes throughout)
  const hihatValue = quarterNote * config.hihat.noteValue;
  let currentTime = startTime;
  while (currentTime < end_time) {
    track.addNote({
      midi: config.hihat.pitch,
      time: currentTime,
      duration: hihatValue * 0.8,
      velocity: baseVelocity * config.hihat.velocityMultiplier,
    });
    currentTime += hihatValue;
  }

  return midi;
}

export default { apply };
