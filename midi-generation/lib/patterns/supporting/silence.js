/**
 * Silence Pattern
 * No notes generated - track inactive for this section.
 */

/**
 * Apply silence pattern (no-op).
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object (unused)
 * @returns {Midi} The unmodified MIDI object
 */
function apply(midi, options) {
  // Intentionally do nothing - silence means no notes
  return midi;
}
export default { apply };
