/**
 * Pattern Registry
 * Single source of truth for all pattern handlers.
 * Provides lookup and validation for pattern types.
 */

import thematicStatement from "./patterns/thematic/statement.js";
import thematicFragmented from "./patterns/thematic/fragmented.js";
import thematicExtended from "./patterns/thematic/extended.js";
import thematicInverted from "./patterns/thematic/inverted.js";
import thematicRetrograde from "./patterns/thematic/retrograde.js";

import harmonicArpeggio from "./patterns/supporting/arpeggio.js";
import gentleBreathing from "./patterns/supporting/breathing.js";
import foundationPedal from "./patterns/supporting/pedal.js";
import decorativeFlourish from "./patterns/supporting/flourish.js";
import minimalAccents from "./patterns/supporting/accents.js";
import silence from "./patterns/supporting/silence.js";

// Lazy-load pattern modules to avoid circular dependencies
let thematicPatterns = null;
let supportingPatterns = null;

function loadPatterns() {
  if (thematicPatterns === null) {
    thematicPatterns = {
      thematic_statement: thematicStatement,
      thematic_fragmented: thematicFragmented,
      thematic_extended: thematicExtended,
      thematic_inverted: thematicInverted,
      thematic_retrograde: thematicRetrograde,
    };
  }

  if (supportingPatterns === null) {
    supportingPatterns = {
      harmonic_arpeggio: harmonicArpeggio,
      gentle_breathing: gentleBreathing,
      foundation_pedal: foundationPedal,
      decorative_flourish: decorativeFlourish,
      minimal_accents: minimalAccents,
      silence: silence,
    };
  }
}

/**
 * Get a pattern handler by type.
 * @param {string} patternType - The pattern type name
 * @returns {Object|null} Pattern module with apply() function, or null if not found
 */
function getPattern(patternType) {
  loadPatterns();
  return (
    thematicPatterns[patternType] || supportingPatterns[patternType] || null
  );
}

/**
 * Check if a pattern type is a thematic pattern (uses theme).
 * @param {string} patternType - The pattern type name
 * @returns {boolean} True if thematic pattern
 */
function isThematicPattern(patternType) {
  loadPatterns();
  return patternType in thematicPatterns;
}

/**
 * Check if a pattern type is a supporting pattern (procedural).
 * @param {string} patternType - The pattern type name
 * @returns {boolean} True if supporting pattern
 */
function isSupportingPattern(patternType) {
  loadPatterns();
  return patternType in supportingPatterns;
}

/**
 * Get all registered pattern names.
 * @returns {string[]} Array of pattern type names
 */
function getAllPatternNames() {
  loadPatterns();
  return [...Object.keys(thematicPatterns), ...Object.keys(supportingPatterns)];
}

/**
 * Validate that a pattern type exists.
 * @param {string} patternType - The pattern type name
 * @returns {boolean} True if pattern exists
 */
function isValidPattern(patternType) {
  loadPatterns();
  return patternType in thematicPatterns || patternType in supportingPatterns;
}

export {
  getPattern,
  isThematicPattern,
  isSupportingPattern,
  getAllPatternNames,
  isValidPattern,
};
