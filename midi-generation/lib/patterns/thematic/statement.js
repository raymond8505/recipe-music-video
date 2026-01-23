/**
 * Thematic Statement Pattern
 * Plays the theme exactly as defined - no transformation.
 */

const LEGATO_DURATION_FACTOR = 0.95;

/**
 * Apply thematic statement to a track.
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
      "Thematic statement requires theme with notes and rhythm arrays",
    );
  }

  const { notes, rhythm } = theme;
  const { start_time, velocity_avg = 80 } = section;

  // Calculate duration of a quarter note in seconds
  const quarterNote = 60 / tempo;

  let currentTime = start_time;

  // Play each note of the theme exactly as defined
  notes.forEach((pitch, index) => {
    // Rhythm value: 1.0 = quarter note, 2.0 = half note, 0.5 = eighth note
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

  return midi;
}
export default { apply };
