/**
 * Note Utilities
 * Handles conversion between note names and MIDI numbers, scale generation, and pitch range filtering.
 */

export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
export const NOTE_ALIASES = {
  Db: "C#",
  Eb: "D#",
  Fb: "E",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
  Cb: "B",
  "E#": "F",
  "B#": "C",
};

// Scale intervals (semitones from root)
const SCALE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  natural_minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  pentatonic: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};

/**
 * Convert a note name to MIDI number.
 * @param {string|number} noteName - Note name (e.g., 'C4', 'F#3', 'Bb5') or MIDI number
 * @returns {number} MIDI note number (0-127)
 */
export function noteToMidi(noteName) {
  // If already a number, validate and return
  if (typeof noteName === "number") {
    if (noteName < 0 || noteName > 127) {
      throw new Error(`MIDI note number must be 0-127, got ${noteName}`);
    }
    return Math.floor(noteName);
  }

  if (typeof noteName !== "string" || noteName.length < 2) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  // Parse note name (e.g., 'C#4' -> note='C#', octave=4)
  const match = noteName.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) {
    throw new Error(
      `Invalid note format: ${noteName}. Expected format like 'C4', 'F#3', 'Bb5'`,
    );
  }

  let note = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const octave = parseInt(match[2], 10);

  // Handle enharmonic equivalents
  if (NOTE_ALIASES[note]) {
    note = NOTE_ALIASES[note];
  }

  const noteIndex = NOTE_NAMES.indexOf(note);
  if (noteIndex === -1) {
    throw new Error(`Unknown note name: ${note}`);
  }

  // MIDI note 60 = C4 (middle C)
  // Formula: (octave + 1) * 12 + noteIndex
  const midi = (octave + 1) * 12 + noteIndex;

  if (midi < 0 || midi > 127) {
    throw new Error(`Resulting MIDI note ${midi} is out of range (0-127)`);
  }

  return midi;
}

/**
 * Convert a MIDI number to note name.
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {string} Note name (e.g., 'C4')
 */
export function midiToNote(midiNote) {
  if (midiNote < 0 || midiNote > 127) {
    throw new Error(`MIDI note number must be 0-127, got ${midiNote}`);
  }

  const noteIndex = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;

  return NOTE_NAMES[noteIndex] + octave;
}

/**
 * Generate a scale across multiple octaves.
 * @param {string|number} root - Root note (e.g., 'C4' or 60)
 * @param {string} scaleType - Scale type (e.g., 'major', 'minor', 'pentatonic')
 * @param {number} octaves - Number of octaves to generate (default: 4)
 * @returns {number[]} Array of MIDI note numbers in the scale
 */
export function getScale(root, scaleType, octaves = 4) {
  const rootMidi = noteToMidi(root);
  const intervals = SCALE_INTERVALS[scaleType] || SCALE_INTERVALS.major;

  const scale = [];
  const rootPitchClass = rootMidi % 12;

  // Generate scale across the MIDI range, centered around the root
  const startOctave = Math.floor(rootMidi / 12) - Math.floor(octaves / 2);
  const endOctave = startOctave + octaves;

  for (let octave = startOctave; octave <= endOctave; octave++) {
    const octaveBase = octave * 12;
    for (const interval of intervals) {
      const note = octaveBase + rootPitchClass + interval;
      if (note >= 0 && note <= 127 && !scale.includes(note)) {
        scale.push(note);
      }
    }
  }

  return scale.sort((a, b) => a - b);
}

/**
 * Get all pitches within a given range.
 * @param {Object} range - Range object with low and high properties
 * @param {string|number} range.low - Lowest note (e.g., 'C4' or 60)
 * @param {string|number} range.high - Highest note (e.g., 'G5' or 79)
 * @param {number[]|null} scale - Optional scale to filter pitches by
 * @returns {number[]} Array of MIDI note numbers within range
 */
export function getPitchesInRange(range, scale = null) {
  const lowMidi = noteToMidi(range.low);
  const highMidi = noteToMidi(range.high);

  if (lowMidi > highMidi) {
    throw new Error(
      `Invalid range: low (${range.low}) is higher than high (${range.high})`,
    );
  }

  const pitches = [];

  if (scale && scale.length > 0) {
    // Filter scale to range
    for (const note of scale) {
      if (note >= lowMidi && note <= highMidi) {
        pitches.push(note);
      }
    }
  } else {
    // All chromatic pitches in range
    for (let note = lowMidi; note <= highMidi; note++) {
      pitches.push(note);
    }
  }

  return pitches;
}

/**
 * Get the next note in a scale by step.
 * @param {number} currentNote - Current MIDI note
 * @param {number[]} scale - Scale array
 * @param {number} steps - Number of scale steps to move (positive = up, negative = down)
 * @returns {number} New MIDI note
 */
export function getScaleStep(currentNote, scale, steps) {
  // Find closest note in scale
  let currentIndex = scale.indexOf(currentNote);

  if (currentIndex === -1) {
    // Find nearest scale note
    let minDist = Infinity;
    for (let i = 0; i < scale.length; i++) {
      const dist = Math.abs(scale[i] - currentNote);
      if (dist < minDist) {
        minDist = dist;
        currentIndex = i;
      }
    }
  }

  const newIndex = currentIndex + steps;

  // Clamp to scale bounds
  if (newIndex < 0) return scale[0];
  if (newIndex >= scale.length) return scale[scale.length - 1];

  return scale[newIndex];
}

/**
 * Calculate the interval between two notes.
 * @param {number} note1 - First MIDI note
 * @param {number} note2 - Second MIDI note
 * @returns {number} Interval in semitones (positive = ascending, negative = descending)
 */
export function getInterval(note1, note2) {
  return note2 - note1;
}

/**
 * Determine the overall contour direction of a melody.
 * @param {number[]} notes - Array of MIDI notes
 * @returns {number} 1 for ascending, -1 for descending, 0 for static
 */
export function getContourDirection(notes) {
  if (notes.length < 2) return 0;

  const totalMovement = notes[notes.length - 1] - notes[0];
  if (totalMovement > 0) return 1;
  if (totalMovement < 0) return -1;
  return 0;
}

/**
 * Build a chord/triad from a scale.
 * @param {number} root - Root note MIDI number
 * @param {number[]} scale - Scale array
 * @param {string} chordType - Chord type: 'triad', 'seventh'
 * @returns {number[]} Array of chord tones
 */
export function buildChord(root, scale, chordType = "triad") {
  const rootIndex = scale.indexOf(root);
  if (rootIndex === -1) {
    // Approximate using scale degrees
    const chord = [root];
    // Add third (4 semitones for major, 3 for minor)
    chord.push(root + 4);
    // Add fifth (7 semitones)
    chord.push(root + 7);
    if (chordType === "seventh") {
      chord.push(root + 11);
    }
    return chord;
  }

  const chord = [scale[rootIndex]];

  // Third (2 scale steps up)
  if (rootIndex + 2 < scale.length) {
    chord.push(scale[rootIndex + 2]);
  }

  // Fifth (4 scale steps up)
  if (rootIndex + 4 < scale.length) {
    chord.push(scale[rootIndex + 4]);
  }

  // Seventh (6 scale steps up)
  if (chordType === "seventh" && rootIndex + 6 < scale.length) {
    chord.push(scale[rootIndex + 6]);
  }

  return chord;
}
