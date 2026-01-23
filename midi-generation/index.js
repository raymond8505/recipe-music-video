/**
 * Recipe-to-MIDI Generation System
 * Generates MIDI files from recipe-based musical compositions.
 */

import { generateMidi, validateSpec } from "./lib/midi-factory.js";
export { validateSpec } from "./lib/midi-factory.js";

/**
 * Create a MIDI byte array from a specification object.
 * @param {Object} spec - Specification object (with or without midi_spec wrapper)
 * @returns {Uint8Array} MIDI file as byte array
 * @throws {Error} If specification is invalid
 */
export function createMidiFromSpec(spec) {
  const midiSpec = spec.midi_spec || spec;

  const validation = validateSpec(midiSpec);
  if (!validation.isValid) {
    throw new Error(`Invalid specification: ${validation.errors.join("; ")}`);
  }

  const midi = generateMidi(midiSpec);
  return midi.toArray();
}

/**
 * Create a MIDI object from a specification (for further manipulation).
 * @param {Object} spec - Specification object (with or without midi_spec wrapper)
 * @returns {Midi} Tone.js MIDI object
 * @throws {Error} If specification is invalid
 */
export function createMidiObjectFromSpec(spec) {
  const midiSpec = spec.midi_spec || spec;

  const validation = validateSpec(midiSpec);
  if (!validation.isValid) {
    throw new Error(`Invalid specification: ${validation.errors.join("; ")}`);
  }

  return generateMidi(midiSpec);
}
