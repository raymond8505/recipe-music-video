/**
 * Thematic Retrograde Pattern
 * Plays theme backwards - reverses both notes and rhythm arrays.
 */

import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
} from "../../../config/pattern-strategies.js";

/**
 * Apply thematic retrograde pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {Object} options.theme - Theme definition with notes and rhythm
 * @param {number} options.tempo - Tempo in BPM
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section, theme, tempo } = options;

  if (!theme || !theme.notes || !theme.rhythm) {
    throw new Error(
      "Thematic retrograde requires theme with notes and rhythm arrays",
    );
  }

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.thematic_retrograde;
  const durationFactor = config.durationFactor;

  const { notes, rhythm } = theme;
  const { end_time, velocity_avg = 80 } = section;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Apply velocity modifier
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  // Reverse both arrays
  const retrogradeNotes = [...notes].reverse();
  const retrogradeRhythm = [...rhythm].reverse();

  // Calculate timing
  const quarterNote = 60 / tempo;
  let currentTime = startTime;

  // Play retrograde theme
  retrogradeNotes.forEach((pitch, index) => {
    const beatDuration = retrogradeRhythm[index] || 1;
    const duration = beatDuration * quarterNote;

    // Ensure we don't exceed end_time
    if (currentTime + duration * durationFactor > end_time) return;

    track.addNote({
      midi: pitch,
      time: currentTime,
      duration: duration * durationFactor,
      velocity: adjustedVelocity / 127,
    });

    currentTime += duration;
  });

  return midi;
}
export default { apply };
