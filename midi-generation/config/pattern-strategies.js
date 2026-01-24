/**
 * Pattern Strategies Configuration
 * Centralizes all "magic numbers" and strategy decisions for composition behavior.
 * Adjust these values to tune musical output without modifying pattern code.
 */

export const PATTERN_STRATEGIES = {
  /**
   * Note Duration Factors
   * Multipliers applied to beat duration to control articulation.
   * Values < 1.0 create space between notes, > 1.0 create overlap.
   */
  durations: {
    staccato: 0.4,        // Very short, detached notes (40% of beat duration)
                          // Recommended range: 0.3-0.5
    portato: 0.85,        // Slightly detached, gentle separation (85% of beat)
                          // Recommended range: 0.75-0.9
    normal: 0.95,         // Nearly full value, standard articulation (95% of beat)
                          // Recommended range: 0.9-0.98
    legato: 1.05,         // Slight overlap for smooth connection (105% of beat)
                          // Recommended range: 1.0-1.1
    molto_legato: 1.15    // Definite overlap for very smooth phrasing (115% of beat)
                          // Recommended range: 1.1-1.25
  },

  /**
   * Velocity Modifiers
   * Additive adjustments to section.velocity_avg (not multiplicative).
   * Negative values = quieter, positive values = louder.
   * Final velocity is clamped to 1-127 range.
   */
  velocityModifiers: {
    harmonyBelow: -15,    // Harmony parts sit below melody
                          // Recommended range: -20 to -10
    bassBelow: -20,       // Bass is quieter to provide foundation without dominating
                          // Recommended range: -25 to -15
    accentAbove: 10,      // Accents stand out from surrounding material
                          // Recommended range: 5 to 20
    pedalBelow: -25,      // Pedal tones are very quiet, felt more than heard
                          // Recommended range: -30 to -20
    flourishAbove: 5      // Flourishes are slightly brighter
                          // Recommended range: 0 to 10
  },

  /**
   * Rhythmic Spacing Configuration
   * Controls timing between notes for different pattern types.
   */
  rhythmicSpacing: {
    breathing: {
      interval: 3.0,      // Beats between notes (spacious, meditative feel)
                          // Recommended range: 2.0-4.0
      humanize: 0.1       // Random timing variation as fraction (±10%)
                          // Recommended range: 0.0-0.2
    },
    very_sparse_breathing: {
      interval: 4.0,      // One note every 4 beats (very spacious, minimal presence)
      humanize: 0.1
    },
    moderate_breathing: {
      interval: 2.0,      // One note every 2 beats (gentle rhythmic pulse)
      humanize: 0.08
    },
    active_breathing: {
      interval: 1.0,      // One note per beat (flowing, constant presence)
      humanize: 0.05
    },
    accents: {
      interval: 4.0,      // Beats between accent notes (sparse punctuation)
                          // Recommended range: 3.0-6.0
      humanize: 0.3       // Higher variation for more organic feel (±30%)
                          // Recommended range: 0.1-0.4
    },
    arpeggio: {
      noteValue: 0.5,     // Eighth notes (0.5 = half a beat)
                          // Common values: 0.25 (16th), 0.5 (8th), 1.0 (quarter)
      pattern: [0, 2, 1, 2] // Chord tone indices: root(0), fifth(2), third(1), fifth(2)
                            // Indices refer to position in built chord array
    }
  },

  /**
   * Late Entry Defaults
   * Values are 0.0-1.0, representing percentage through section.
   * Used when patterns should enter partway through their section.
   */
  lateEntry: {
    secondaryInPrep: 0.65,  // Secondary melody enters 65% through PREP section
                            // Recommended range: 0.5-0.8
    bassFadeIn: 0.3,        // Bass fades in 30% through (gentle entrance)
                            // Recommended range: 0.2-0.5
    decoration: 0.7         // Decorative elements near end of section
                            // Recommended range: 0.6-0.85
  },

  /**
   * Pattern-Specific Behaviors
   * Detailed configuration for each pattern type.
   */
  patterns: {
    /**
     * Thematic Statement - plays theme exactly as defined
     */
    thematic_statement: {
      durationFactor: 0.95,   // Use normal articulation
                              // Maps to durations.normal
      velocityModifier: 0     // No velocity adjustment (primary melody)
    },

    /**
     * Thematic Fragmented - repeats first N notes of theme
     */
    thematic_fragmented: {
      fragmentLength: 3,           // Number of notes to extract from theme
                                   // Recommended range: 2-5
      sequenceInterval: 2,         // Semitones to transpose each repetition (when sequence=true)
                                   // Recommended range: 1-4
      durationFactor: 0.95,        // Normal articulation
      velocityModifier: 0
    },

    /**
     * Thematic Extended - plays theme then continues with stepwise motion
     */
    thematic_extended: {
      durationFactor: 0.95,        // Normal articulation
      velocityModifier: 0,
      extensionStepSize: 1         // Scale degrees to move in extension
                                   // Recommended: 1 for stepwise, 2 for larger leaps
    },

    /**
     * Thematic Inverted - flips intervals of theme
     */
    thematic_inverted: {
      durationFactor: 0.95,
      velocityModifier: 0
    },

    /**
     * Thematic Retrograde - plays theme backwards
     */
    thematic_retrograde: {
      durationFactor: 0.95,
      velocityModifier: 0
    },

    /**
     * Gentle Breathing - spacious, meditative single notes
     */
    gentle_breathing: {
      noteDuration: 1.2,           // Beat multiplier for sustain (longer than beat)
                                   // Recommended range: 1.0-2.0
      stepwise: true,              // Move by steps, not leaps
      maxInterval: 2,              // Max scale degrees between notes
                                   // Recommended range: 1-3
      velocityModifier: 0          // No adjustment (matches section velocity)
    },

    /**
     * Melodic Counterpoint - active melodic line complementing primary melody
     * More melodic than arpeggio, smoother than breathing patterns.
     */
    melodic_counterpoint: {
      noteInterval: 0.75,          // Beats between notes (dotted eighth = 3:2 feel)
                                   // Recommended range: 0.5-1.0
      noteDuration: 0.9,           // Duration factor (slightly detached)
                                   // Recommended range: 0.8-1.0
      stepwiseBias: 0.7,           // 70% stepwise motion (1-2 semitones)
                                   // Recommended range: 0.6-0.8
      leapProbability: 0.2,        // 20% small leaps (3-5 semitones)
                                   // Recommended range: 0.1-0.3
      directionChangeEvery: 7,     // Change contour direction every N notes
                                   // Recommended range: 5-10
      startInRange: 0.4,           // Start at 40% through pitch range (lower-middle)
                                   // Recommended range: 0.3-0.5
      velocityModifier: -10        // Slightly below melody
    },

    /**
     * Foundation Pedal - sustained bass note for harmonic grounding
     */
    foundation_pedal: {
      pitchSelection: 'low',       // Where to select pitch: 'low', 'mid', 'high'
      quartilePosition: 0.25,      // Use bottom quartile of pitch range (0.0-1.0)
                                   // 0.25 = bottom quarter, 0.75 = top quarter
      sustainGap: 0.05,            // Small gap at end to avoid clipping (seconds)
                                   // Recommended range: 0.02-0.1
      velocityModifier: -25        // Very quiet pedal tone
    },

    /**
     * Decorative Flourish - quick ornamental passage
     */
    decorative_flourish: {
      noteCount: 4,                // Number of notes in flourish
                                   // Recommended range: 3-6
      appearTime: 0.65,            // When in section (0.0-1.0) - like built-in late_entry
                                   // Recommended range: 0.5-0.85
      noteValue: 0.25,             // Sixteenth notes (quarter = 1.0)
                                   // Recommended: 0.25 (16th), 0.5 (8th)
      direction: 'ascending',      // 'ascending', 'descending', or 'random'
      durationFactor: 0.8,         // Slightly detached for clarity
                                   // Recommended range: 0.7-0.9
      velocityModifier: 5          // Slightly brighter than surroundings
    },

    /**
     * Minimal Accents - sparse punctuation notes
     */
    minimal_accents: {
      minInterval: 3.0,            // Minimum seconds between accents
                                   // Recommended range: 2.0-4.0
      maxInterval: 4.0,            // Maximum seconds between accents
                                   // Recommended range: 3.0-6.0
      duration: 0.3,               // Fixed duration in seconds
                                   // Recommended range: 0.2-0.5
      durationFactor: 0.4,         // Staccato articulation
      velocityModifier: 0          // Matches section velocity
    },

    /**
     * Harmonic Arpeggio - broken chord accompaniment
     */
    harmonic_arpeggio: {
      noteValue: 0.5,              // Eighth notes (0.5 beats)
                                   // Recommended: 0.25, 0.5, or 1.0
      pattern: [0, 2, 1, 2],       // Chord tone indices [root, fifth, third, fifth]
      durationFactor: 0.9,         // Slightly detached for clarity
                                   // Recommended range: 0.85-0.95
      velocityModifier: -12        // Below melody
    },

    /**
     * Silence - intentional rest
     */
    silence: {
      // No configuration needed - this pattern produces no notes
    }
  }
};

/**
 * Calculate the actual start time for a section, accounting for late entry.
 * @param {Object} section - Section specification with start_time, end_time, and optional late_entry
 * @returns {number} The calculated start time in seconds
 */
export function calculateLateEntryStart(section) {
  const { start_time, end_time, late_entry } = section;

  if (late_entry === undefined || late_entry <= 0) {
    return start_time;
  }

  // Clamp late_entry to valid range
  const clampedLateEntry = Math.min(1.0, Math.max(0.0, late_entry));

  const duration = end_time - start_time;
  return start_time + (duration * clampedLateEntry);
}

/**
 * Apply velocity modifier to a base velocity.
 * @param {number} baseVelocity - The base velocity (0-127)
 * @param {number} modifier - The additive modifier
 * @returns {number} Clamped velocity in range 1-127
 */
export function applyVelocityModifier(baseVelocity, modifier) {
  return Math.max(1, Math.min(127, baseVelocity + modifier));
}

/**
 * Add humanization (random variation) to a timing value.
 * @param {number} value - The base timing value
 * @param {number} humanize - The humanization factor (0.0-1.0)
 * @param {function} randomFn - Optional random function (returns 0.0-1.0)
 * @returns {number} The humanized value
 */
export function humanizeValue(value, humanize, randomFn = Math.random) {
  if (humanize <= 0) return value;
  const variation = (randomFn() * 2 - 1) * humanize; // -humanize to +humanize
  return value * (1 + variation);
}
