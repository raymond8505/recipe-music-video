/**
 * Thematic Fragmented Pattern
 * Takes first N notes of theme (from config), repeats the fragment.
 * If sequence is true, transposes each repetition by configured semitones.
 */

import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
} from "../../../config/pattern-strategies.js";

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

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.thematic_fragmented;
  const fragmentLength = config.fragmentLength;

  if (!theme || !theme.notes || theme.notes.length < fragmentLength) {
    throw new Error(
      `Thematic fragmented requires theme with at least ${fragmentLength} notes`,
    );
  }

  const { notes, rhythm } = theme;
  const { end_time, velocity_avg = 80, sequence = false } = section;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Apply velocity modifier
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  // Extract fragment (first N notes and their rhythms from config)
  const fragmentNotes = notes.slice(0, fragmentLength);
  const fragmentRhythm = rhythm.slice(0, fragmentLength);

  // Calculate timing
  const quarterNote = 60 / tempo;
  const durationFactor = config.durationFactor;

  // Calculate how long one fragment takes
  const fragmentDuration = fragmentRhythm.reduce(
    (sum, r) => sum + r * quarterNote,
    0,
  );

  let currentTime = startTime;
  let repetition = 0;

  // Repeat fragment until section ends
  while (currentTime + fragmentDuration <= end_time) {
    // Calculate transposition for this repetition using config interval
    const transposition = sequence ? repetition * config.sequenceInterval : 0;

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
          duration: duration * durationFactor,
          velocity: adjustedVelocity / 127,
        });
      }

      currentTime += duration;
    });

    repetition++;
  }

  return midi;
}
export default { apply };
