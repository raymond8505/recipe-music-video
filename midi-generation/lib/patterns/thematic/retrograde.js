/**
 * Thematic Retrograde Pattern
 * Plays theme backwards - reverses both notes and rhythm arrays.
 */

const LEGATO_DURATION_FACTOR = 0.95;

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

  const { notes, rhythm } = theme;
  const { start_time, velocity_avg = 80 } = section;

  // Reverse both arrays
  const retrogradeNotes = [...notes].reverse();
  const retrogradeRhythm = [...rhythm].reverse();

  // Calculate timing
  const quarterNote = 60 / tempo;
  let currentTime = start_time;

  // Play retrograde theme
  retrogradeNotes.forEach((pitch, index) => {
    const beatDuration = retrogradeRhythm[index] || 1;
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
