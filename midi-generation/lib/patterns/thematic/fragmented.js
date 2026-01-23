/**
 * Thematic Fragmented Pattern
 * Takes first 3 notes of theme, repeats the fragment.
 * If sequence is true, transposes each repetition up by 2 semitones.
 */

const LEGATO_DURATION_FACTOR = 0.95;
const FRAGMENT_LENGTH = 3;
const SEQUENCE_TRANSPOSITION = 2; // Semitones

/**
 * Apply thematic fragmented pattern to a track.
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

  if (!theme || !theme.notes || theme.notes.length < FRAGMENT_LENGTH) {
    throw new Error(
      `Thematic fragmented requires theme with at least ${FRAGMENT_LENGTH} notes`,
    );
  }

  const { notes, rhythm } = theme;
  const { start_time, end_time, velocity_avg = 80, sequence = false } = section;

  // Extract fragment (first 3 notes and their rhythms)
  const fragmentNotes = notes.slice(0, FRAGMENT_LENGTH);
  const fragmentRhythm = rhythm.slice(0, FRAGMENT_LENGTH);

  // Calculate timing
  const quarterNote = 60 / tempo;
  const sectionDuration = end_time - start_time;

  // Calculate how long one fragment takes
  const fragmentDuration = fragmentRhythm.reduce(
    (sum, r) => sum + r * quarterNote,
    0,
  );

  let currentTime = start_time;
  let repetition = 0;

  // Repeat fragment until section ends
  while (currentTime + fragmentDuration <= end_time) {
    // Calculate transposition for this repetition
    const transposition = sequence ? repetition * SEQUENCE_TRANSPOSITION : 0;

    // Play the fragment
    fragmentNotes.forEach((pitch, index) => {
      const beatDuration = fragmentRhythm[index] || 1;
      const duration = beatDuration * quarterNote;

      const transposedPitch = pitch + transposition;

      // Only add if within valid MIDI range
      if (transposedPitch >= 0 && transposedPitch <= 127) {
        track.addNote({
          midi: transposedPitch,
          time: currentTime,
          duration: duration * LEGATO_DURATION_FACTOR,
          velocity: velocity_avg / 127,
        });
      }

      currentTime += duration;
    });

    repetition++;
  }

  return midi;
}
export default { apply };
