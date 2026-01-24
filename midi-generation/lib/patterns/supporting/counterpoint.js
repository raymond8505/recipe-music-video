/**
 * Melodic Counterpoint Pattern
 * Active melodic line that complements primary melody without competing.
 * More melodic than arpeggio, smoother than breathing patterns.
 * Creates gentle arch or wave contours with mostly stepwise motion.
 */

import { noteToMidi } from "../../note-utils.js";
import {
  PATTERN_STRATEGIES,
  calculateLateEntryStart,
  applyVelocityModifier,
} from "../../../config/pattern-strategies.js";

/**
 * Apply melodic counterpoint pattern to a track.
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
  const config = PATTERN_STRATEGIES.patterns.melodic_counterpoint;

  // Handle late entry
  const startTime = calculateLateEntryStart(section);

  // Calculate timing from config
  const quarterNote = 60 / tempo;
  const noteInterval = quarterNote * config.noteInterval;
  const noteDuration = noteInterval * config.noteDuration;

  // Apply velocity modifier
  const adjustedVelocity = applyVelocityModifier(velocity_avg, config.velocityModifier);

  // Determine available pitches
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

  // Start at lower-middle of range (40% through)
  let pitchIndex = Math.floor(availablePitches.length * config.startInRange);
  let ascending = true;
  let notesSinceDirectionChange = 0;

  // Simple seeded random for consistent results
  let seed = Math.floor(startTime * 1000) % 1000;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  let currentTime = startTime;

  while (currentTime + noteDuration <= end_time) {
    // Add note
    track.addNote({
      midi: availablePitches[pitchIndex],
      time: currentTime,
      duration: noteDuration,
      velocity: adjustedVelocity / 127,
    });

    // Determine next pitch movement
    const motion = pseudoRandom();
    let pitchMove = 0;

    if (motion < config.stepwiseBias) {
      // Stepwise motion (70%): move 1-2 semitones/scale degrees
      pitchMove = ascending ? 1 : -1;
      // Occasionally move by 2 for variety
      if (pseudoRandom() < 0.3) {
        pitchMove *= 2;
      }
    } else if (motion < config.stepwiseBias + config.leapProbability) {
      // Small leap (20%): move 3-5 semitones/scale degrees
      const leapSize = 2 + Math.floor(pseudoRandom() * 2); // 2-3 scale steps
      pitchMove = ascending ? leapSize : -leapSize;
    } else {
      // Direction change (10%): reverse and move
      ascending = !ascending;
      pitchMove = ascending ? 1 : -1;
    }

    pitchIndex += pitchMove;

    // Periodic direction change for wave/arch contour
    notesSinceDirectionChange++;
    if (notesSinceDirectionChange >= config.directionChangeEvery) {
      ascending = !ascending;
      notesSinceDirectionChange = 0;
    }

    // Keep within pitch range bounds
    if (pitchIndex <= 0) {
      pitchIndex = 0;
      ascending = true; // Bounce back up
    } else if (pitchIndex >= availablePitches.length - 1) {
      pitchIndex = availablePitches.length - 1;
      ascending = false; // Bounce back down
    }

    currentTime += noteInterval;
  }

  return midi;
}

export default { apply };
