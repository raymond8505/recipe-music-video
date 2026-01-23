/**
 * Silence Pattern
 * No notes generated - track inactive for this section.
 * Late entry has no effect since no notes are produced.
 */

/**
 * Apply silence pattern (no-op).
 * @param {Midi} midi - The MIDI object
 * @param {Object} options - Options object (unused)
 * @returns {Midi} The unmodified MIDI object
 */
function apply(midi, options) {
  // Intentionally do nothing - silence means no notes
  // Note: late_entry is supported but has no effect since no notes are generated
  return midi;
}
export default { apply };
