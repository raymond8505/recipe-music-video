/**
 * Thematic Extended Pattern
 * Plays full theme first, then continues with stepwise motion
 * from the last theme note in the direction of the theme's contour.
 */

import { getContourDirection, getScaleStep } from "../../note-utils.js";

const LEGATO_DURATION_FACTOR = 0.95;

/**
 * Apply thematic extended pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {Object} options.theme - Theme definition with notes and rhythm
 * @param {number} options.tempo - Tempo in BPM
 * @param {number[]} options.scale - Scale pitches to use for extension
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section, theme, tempo, scale = [] } = options;

  if (!theme || !theme.notes || !theme.rhythm) {
    throw new Error(
      "Thematic extended requires theme with notes and rhythm arrays",
    );
  }

  const { notes, rhythm } = theme;
  const { start_time, end_time, velocity_avg = 80 } = section;

  const quarterNote = 60 / tempo;
  let currentTime = start_time;

  // Step 1: Play the full theme
  notes.forEach((pitch, index) => {
    const beatDuration = rhythm[index] || 1;
    const duration = beatDuration * quarterNote;

    track.addNote({
      midi: pitch,
      time: currentTime,
      duration: duration * LEGATO_DURATION_FACTOR,
      velocity: velocity_avg / 127,
    });

    currentTime += duration;
  });

  // Step 2: Continue with stepwise motion
  const direction = getContourDirection(notes);
  const stepDirection = direction === 0 ? 1 : direction; // Default to ascending if static

  let currentPitch = notes[notes.length - 1];

  // Use average rhythm for extension, or default to quarter notes
  const avgRhythm = rhythm.reduce((sum, r) => sum + r, 0) / rhythm.length;
  const extensionBeatDuration = avgRhythm || 1;
  const extensionDuration = extensionBeatDuration * quarterNote;

  // Continue until section end
  while (currentTime + extensionDuration <= end_time) {
    // Move by one step in the contour direction
    if (scale.length > 0) {
      currentPitch = getScaleStep(currentPitch, scale, stepDirection);
    } else {
      // Chromatic stepwise motion
      currentPitch += stepDirection * 2; // Whole step
    }

    // Clamp to valid MIDI range
    if (currentPitch < 0 || currentPitch > 127) {
      break;
    }

    track.addNote({
      midi: currentPitch,
      time: currentTime,
      duration: extensionDuration * LEGATO_DURATION_FACTOR,
      velocity: velocity_avg / 127,
    });

    currentTime += extensionDuration;
  }

  return midi;
}
export default { apply };
