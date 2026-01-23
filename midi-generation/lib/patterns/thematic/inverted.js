/**
 * Thematic Inverted Pattern
 * Calculates intervals between theme notes and flips them (multiply by -1).
 * Rebuilds theme with inverted intervals from the original starting note.
 */

import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
} from "../../../config/pattern-strategies.js";

/**
 * Apply thematic inverted pattern to a track.
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
      "Thematic inverted requires theme with notes and rhythm arrays",
    );
  }

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.thematic_inverted;
  const durationFactor = config.durationFactor;

  const { notes, rhythm } = theme;
  const { end_time, velocity_avg = 80 } = section;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Apply velocity modifier
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  if (notes.length < 2) {
    throw new Error("Thematic inverted requires at least 2 notes");
  }

  // Calculate intervals between consecutive notes
  const intervals = [];
  for (let i = 1; i < notes.length; i++) {
    intervals.push(notes[i] - notes[i - 1]);
  }

  // Invert intervals (multiply by -1)
  const invertedIntervals = intervals.map((interval) => -interval);

  // Rebuild theme with inverted intervals, starting from original first note
  const invertedNotes = [notes[0]];
  for (const interval of invertedIntervals) {
    const nextNote = invertedNotes[invertedNotes.length - 1] + interval;
    invertedNotes.push(nextNote);
  }

  // Calculate timing
  const quarterNote = 60 / tempo;
  let currentTime = startTime;

  // Play inverted theme
  invertedNotes.forEach((pitch, index) => {
    // Clamp to valid MIDI range
    const clampedPitch = Math.max(0, Math.min(127, pitch));

    const beatDuration = rhythm[index] || 1;
    const duration = beatDuration * quarterNote;

    // Ensure we don't exceed end_time
    if (currentTime + duration * durationFactor > end_time) return;

    track.addNote({
      midi: clampedPitch,
      time: currentTime,
      duration: duration * durationFactor,
      velocity: adjustedVelocity / 127,
    });

    currentTime += duration;
  });

  return midi;
}
export default { apply };
