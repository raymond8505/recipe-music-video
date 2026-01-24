/**
 * Sustained Pad Pattern
 * Continuous harmonic wash for atmospheric depth.
 * Slow-changing chords that overlap for smooth transitions.
 * Very quiet throughout - background texture only.
 */

import { noteToMidi } from "../../note-utils.js";
import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
} from "../../../config/pattern-strategies.js";

/**
 * Apply sustained pad pattern to a track.
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

  const { end_time, velocity_avg = 70, pitch_range } = section;

  // Get configuration
  const config = PATTERN_STRATEGIES.patterns.sustained_pad;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing
  const quarterNote = 60 / tempo;
  const chordDuration = quarterNote * config.updateInterval;
  const baseVelocity = (velocity_avg / 127) * config.velocityMultiplier;

  // Determine available pitches for root selection
  let availablePitches = pitches.length > 0 ? pitches : scale;
  if (availablePitches.length === 0) {
    // Create a simple range if no pitches provided
    const lowNote = pitch_range ? noteToMidi(pitch_range.low) : 48;
    const highNote = pitch_range ? noteToMidi(pitch_range.high) : 72;
    availablePitches = [];
    for (let n = lowNote; n <= highNote; n++) {
      availablePitches.push(n);
    }
  }

  // Select root note from lower portion of pitch range
  const rootIndex = Math.floor(availablePitches.length * config.pitchRangePosition);
  const baseRoot = availablePitches[rootIndex];

  // Simple seeded random for consistent chord variations
  let seed = Math.floor(startTime * 1000) % 1000;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  let currentTime = startTime;

  while (currentTime < end_time) {
    // Vary root slightly using scale tones for harmonic interest
    let root = baseRoot;
    if (scale.length > 0) {
      // Find scale tones near base root and occasionally shift
      const scaleIndex = scale.indexOf(baseRoot);
      if (scaleIndex !== -1 && pseudoRandom() > 0.6) {
        // Sometimes move to adjacent scale tone
        const offset = pseudoRandom() > 0.5 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(scale.length - 1, scaleIndex + offset));
        root = scale[newIndex];
      }
    }

    // Calculate note duration with overlap for smooth transitions
    const noteDuration = Math.min(
      chordDuration + config.releaseOverlap,
      end_time - currentTime + config.releaseOverlap
    );

    // Build chord voices based on voicing spread
    for (const interval of config.voicingSpread) {
      const pitch = root + interval;

      // Make sure pitch is valid MIDI note
      if (pitch >= 0 && pitch <= 127) {
        track.addNote({
          midi: pitch,
          time: currentTime,
          duration: noteDuration,
          velocity: baseVelocity,
        });
      }
    }

    currentTime += chordDuration;
  }

  return midi;
}

export default { apply };
