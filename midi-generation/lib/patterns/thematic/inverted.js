/**
 * Thematic Inverted Pattern
 * Calculates intervals between theme notes and flips them (multiply by -1).
 * Rebuilds theme with inverted intervals from the original starting note.
 */

const LEGATO_DURATION_FACTOR = 0.95;

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

  const { notes, rhythm } = theme;
  const { start_time, velocity_avg = 80 } = section;

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
  let currentTime = start_time;

  // Play inverted theme
  invertedNotes.forEach((pitch, index) => {
    // Clamp to valid MIDI range
    const clampedPitch = Math.max(0, Math.min(127, pitch));

    const beatDuration = rhythm[index] || 1;
    const duration = beatDuration * quarterNote;

    track.addNote({
      midi: clampedPitch,
      time: currentTime,
      duration: duration * LEGATO_DURATION_FACTOR,
      velocity: velocity_avg / 127,
    });

    currentTime += duration;
  });

  return midi;
}
export default { apply };
