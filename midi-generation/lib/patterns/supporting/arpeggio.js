/**
 * Harmonic Arpeggio Pattern
 * Builds triad from scale (root, third, fifth).
 * Arpeggiates pattern: [root, fifth, third, fifth] in eighth notes.
 * Velocity 10-15 below melody.
 */
import { buildChord, noteToMidi } from "../../note-utils.js";

const VELOCITY_REDUCTION = 12; // Below melody average
const LEGATO_DURATION_FACTOR = 0.9;

/**
 * Apply harmonic arpeggio pattern to a track.
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object
 * @param {Object} options.track - The track to add notes to
 * @param {Object} options.section - Section specification
 * @param {number} options.tempo - Tempo in BPM
 * @param {number[]} options.scale - Scale pitches
 * @param {number[]} options.pitches - Available pitches in range
 * @returns {Midi} The modified MIDI object
 */
function apply(midi, options) {
  const { track, section, tempo, scale = [], pitches = [] } = options;

  const { start_time, end_time, velocity_avg = 80 } = section;

  // Calculate timing
  const quarterNote = 60 / tempo;
  const eighthNote = quarterNote / 2;

  // Determine root note from scale or section
  let root;
  if (section.scale && section.scale.root) {
    root = noteToMidi(section.scale.root);
  } else if (scale.length > 0) {
    root = scale[0];
  } else if (pitches.length > 0) {
    root = pitches[0];
  } else {
    root = 48; // Default to C3
  }

  // Build triad
  const chord = buildChord(root, scale, "triad");

  // Ensure we have at least 3 notes for the arpeggio pattern
  while (chord.length < 3) {
    chord.push(chord[chord.length - 1] + 4); // Add approximate third
  }

  // Arpeggio pattern: [root, fifth, third, fifth]
  const arpeggioPattern = [chord[0], chord[2], chord[1], chord[2]];

  // Velocity slightly below melody
  const arpeggioVelocity =
    Math.max(20, velocity_avg - VELOCITY_REDUCTION) / 127;

  let currentTime = start_time;
  let patternIndex = 0;

  // Fill section with arpeggio
  while (currentTime + eighthNote <= end_time) {
    const pitch = arpeggioPattern[patternIndex % arpeggioPattern.length];

    track.addNote({
      midi: pitch,
      time: currentTime,
      duration: eighthNote * LEGATO_DURATION_FACTOR,
      velocity: arpeggioVelocity,
    });

    currentTime += eighthNote;
    patternIndex++;
  }

  return midi;
}
export default { apply };
