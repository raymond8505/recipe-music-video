# MIDI Generation

Generates MIDI files from pattern-based musical specifications.

## Installation

```bash
npm install
```

## Usage

```javascript
const { createMidiFromSpec, createMidiObjectFromSpec, validateSpec } = require('./midi-generation');
```

### createMidiFromSpec(spec)

Generates MIDI and returns raw bytes.

```javascript
const spec = {
  tempo: 112,
  time_signature: [4, 4],
  key_signature: "C",
  themeDefinition: {
    notes: [60, 62, 64, 66, 67],
    rhythm: [1.0, 1.0, 1.0, 1.0, 2.0],
    character: "Ascending melody"
  },
  tracks: [
    {
      track_number: 1,
      instrument_name: "Acoustic Grand Piano",
      midi_program: 0,
      sections: [
        {
          start_time: 0,
          end_time: 5.4,
          pattern_type: "thematic_statement",
          velocity_avg: 60
        }
      ]
    }
  ]
};

const midiBytes = createMidiFromSpec(spec);

// Write to file
const fs = require('fs');
fs.writeFileSync('output.mid', Buffer.from(midiBytes));
```

### createMidiObjectFromSpec(spec)

Returns the Tone.js MIDI object for further manipulation.

```javascript
const midi = createMidiObjectFromSpec(spec);

// Access tracks
midi.tracks.forEach(track => {
  console.log(`Track: ${track.name}, Notes: ${track.notes.length}`);
});

// Get duration
console.log(`Duration: ${midi.duration} seconds`);

// Convert to bytes when ready
const bytes = midi.toArray();
```

### validateSpec(spec)

Validates a specification before generation.

```javascript
const { isValid, errors } = validateSpec(spec);

if (!isValid) {
  console.error('Validation errors:', errors);
}
```

## Specification Format

```javascript
{
  tempo: 120,                    // BPM (20-300)
  time_signature: [4, 4],        // [beats, beat unit]
  key_signature: "C",            // Key name

  themeDefinition: {             // Required for thematic patterns
    notes: [60, 62, 64],         // MIDI note numbers
    rhythm: [1, 1, 2],           // Beat values (1 = quarter note)
    character: "Description"     // Optional
  },

  tracks: [{
    track_number: 1,
    instrument_name: "Piano",
    midi_program: 0,             // General MIDI program number
    sections: [{
      start_time: 0,             // Seconds
      end_time: 10,              // Seconds
      pattern_type: "thematic_statement",
      velocity_avg: 80,          // 0-127
      scale: {                   // Optional
        root: "C4",
        type: "major"
      },
      pitch_range: {             // Optional
        low: "C3",
        high: "C5"
      }
    }]
  }],

  metadata: {                    // Optional
    recipe_name: "Recipe Title"
  }
}
```

## Pattern Types

### Thematic Patterns

Use the theme defined in `themeDefinition`.

| Pattern | Description |
|---------|-------------|
| `thematic_statement` | Plays theme exactly as defined |
| `thematic_fragmented` | First 3 notes, repeated. Set `sequence: true` to transpose up 2 semitones each repetition |
| `thematic_extended` | Full theme, then stepwise continuation in theme's direction |
| `thematic_inverted` | Theme with all intervals flipped |
| `thematic_retrograde` | Theme played backwards |

### Supporting Patterns

Procedural patterns that don't require a theme.

| Pattern | Description |
|---------|-------------|
| `harmonic_arpeggio` | Triadic arpeggiation in eighth notes |
| `gentle_breathing` | One note every 3 beats, stepwise motion |
| `foundation_pedal` | Single sustained bass note for entire section |
| `decorative_flourish` | 4 quick ascending notes at 65% through section |
| `minimal_accents` | Sparse notes every 3-4 seconds |
| `silence` | No notes (track silent for this section) |

## Note Formats

The following formats are accepted for note names:

- MIDI numbers: `60`, `72`
- Note names: `C4`, `F#3`, `Bb5`
- Flats and sharps: `Db4` (converted to `C#4`)

## Scale Types

Available scale types for the `scale.type` field:

- `major`, `minor`, `natural_minor`
- `harmonic_minor`, `melodic_minor`
- `pentatonic`, `pentatonic_minor`
- `dorian`, `phrygian`, `lydian`, `mixolydian`, `locrian`
- `chromatic`
