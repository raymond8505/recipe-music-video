// midi-generation.js
const { Midi } = require('@tonejs/midi');

// Helper to convert note names to MIDI numbers
function noteToMidi(noteName) {
  // Handle numbers directly
  if (typeof noteName === 'number') return noteName;
  
  // Handle undefined/null
  if (!noteName || typeof noteName !== 'string') {
    console.warn(`Warning: Invalid note "${noteName}" (${typeof noteName}), defaulting to C4 (60)`);
    return 60;
  }
  
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Convert flats to sharps before parsing
  const flatToSharp = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'db': 'C#', 'eb': 'D#', 'gb': 'F#', 'ab': 'G#', 'bb': 'A#'
  };
  
  let normalizedNote = noteName.trim();
  
  // Replace flats with sharps
  for (const [flat, sharp] of Object.entries(flatToSharp)) {
    normalizedNote = normalizedNote.replace(flat, sharp);
  }
  
  // Match note pattern (supports sharps now)
  const match = normalizedNote.match(/^([A-Ga-g]#?)(-?\d+)$/);
  
  if (!match) {
    console.warn(`Warning: Invalid note format "${noteName}", defaulting to C4 (60)`);
    return 60;
  }
  
  const [, note, octave] = match;
  const noteUpper = note.toUpperCase();
  const noteIndex = notes.indexOf(noteUpper);
  
  if (noteIndex === -1) {
    console.warn(`Warning: Unknown note "${note}" in "${noteName}", defaulting to C4 (60)`);
    return 60;
  }
  
  return (parseInt(octave) + 1) * 12 + noteIndex;
}

// Get all MIDI note numbers in a range
function getPitchesInRange(range) {
  // Validate range object
  if (!range || typeof range !== 'object') {
    console.warn('Warning: Invalid pitch range object, using default C3-C5');
    return getPitchesInRange({ low: 'C3', high: 'C5' });
  }
  
  if (!range.low || !range.high) {
    console.warn(`Warning: Missing low/high in range ${JSON.stringify(range)}, using default C3-C5`);
    return getPitchesInRange({ low: 'C3', high: 'C5' });
  }
  
  const low = noteToMidi(range.low);
  const high = noteToMidi(range.high);
  
  if (low > high) {
    console.warn(`Warning: Invalid range ${range.low} to ${range.high} (reversed), swapping`);
    const pitches = [];
    for (let i = high; i <= low; i++) {
      pitches.push(i);
    }
    return pitches;
  }
  
  const pitches = [];
  for (let i = low; i <= high; i++) {
    pitches.push(i);
  }
  return pitches;
}

// Get pitches for a scale
function getScale(root, scaleType = 'major') {
  const rootMidi = noteToMidi(root);
  const scales = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  };
  
  const intervals = scales[scaleType] || scales.major;
  return intervals.map(interval => rootMidi + interval);
}

// Procedural pattern generators
function generateNotesFromSection(section, tempo, trackRole = 'harmony') {
  const notes = [];
  const duration = section.end_time - section.start_time;
  const quarterNote = 60 / tempo;
  
  // Get pitch pool based on range or scale
  let pitches;
  if (section.pitch_range) {
    pitches = getPitchesInRange(section.pitch_range);
  } else if (section.scale) {
    const baseScale = getScale(section.scale.root, section.scale.type);
    pitches = [];
    for (let octave = -1; octave <= 2; octave++) {
      pitches.push(...baseScale.map(p => p + (octave * 12)));
    }
    if (section.pitch_range) {
      const low = noteToMidi(section.pitch_range.low);
      const high = noteToMidi(section.pitch_range.high);
      pitches = pitches.filter(p => p >= low && p <= high);
    }
  } else {
    // Fallback if no pitch info provided
    console.warn('Warning: No pitch_range or scale provided, using default C3-C5');
    pitches = getPitchesInRange({ low: 'C3', high: 'C5' });
  }
  
  // Filter to scale degrees if available (more musical)
  if (pitches && pitches.length > 7) {
    pitches = pitches.filter((_, idx) => idx % 2 === 0);
  }
  
  const densityMap = {
    sparse: 0.5,
    low: 1,
    medium: 2,
    high: 3,
    very_high: 5
  };
  
  const notesPerSecond = densityMap[section.note_density] || 1.5;
  const velocityVariation = trackRole === 'primary_melody' ? 15 : 8;
  const baseVelocity = section.velocity_avg || 75;
  
  switch (section.pattern_type) {
    case 'sustained':
      const sustainedNotes = Math.max(1, Math.floor(duration / 4));
      const sustainDuration = duration / sustainedNotes;
      
      for (let i = 0; i < sustainedNotes; i++) {
        notes.push({
          time: section.start_time + (i * sustainDuration),
          pitch: pitches[Math.floor(pitches.length / 2) + (i % 3 - 1)],
          duration: sustainDuration * 0.95,
          velocity: baseVelocity + (Math.random() * 5 - 2.5)
        });
      }
      break;
      
    case 'steady_rhythm':
      const divisions = [quarterNote, quarterNote / 2, quarterNote / 4];
      const noteInterval = divisions[Math.min(2, Math.floor(notesPerSecond / 2))];
      
      for (let t = section.start_time; t < section.end_time; t += noteInterval) {
        const pitchIndex = Math.floor(Math.random() * Math.min(5, pitches.length));
        notes.push({
          time: t,
          pitch: pitches[pitchIndex],
          duration: noteInterval * 0.8,
          velocity: baseVelocity + (Math.random() * velocityVariation - velocityVariation/2)
        });
      }
      break;
      
    case 'walking_bass':
      let currentPitchIndex = Math.floor(pitches.length / 3);
      for (let t = section.start_time; t < section.end_time; t += quarterNote) {
        notes.push({
          time: t,
          pitch: pitches[currentPitchIndex],
          duration: quarterNote * 0.85,
          velocity: baseVelocity + (Math.random() * 5 - 2.5)
        });
        if (Math.random() < 0.7) {
          currentPitchIndex += Math.random() > 0.5 ? 1 : -1;
        } else {
          currentPitchIndex += Math.random() > 0.5 ? 2 : -2;
        }
        currentPitchIndex = Math.max(0, Math.min(pitches.length - 1, currentPitchIndex));
      }
      break;
      
    case 'ascending':
      const ascendSteps = Math.floor(duration * Math.min(notesPerSecond, 2));
      const pitchStep = (pitches.length - 1) / ascendSteps;
      for (let i = 0; i < ascendSteps; i++) {
        const t = section.start_time + (i * (duration / ascendSteps));
        const pitchIndex = Math.floor(i * pitchStep);
        notes.push({
          time: t,
          pitch: pitches[pitchIndex],
          duration: (duration / ascendSteps) * 0.85,
          velocity: Math.min(110, baseVelocity + (i / ascendSteps) * 20)
        });
      }
      break;
      
    case 'descending':
      const descendSteps = Math.floor(duration * Math.min(notesPerSecond, 2));
      const descendPitchStep = (pitches.length - 1) / descendSteps;
      for (let i = 0; i < descendSteps; i++) {
        const t = section.start_time + (i * (duration / descendSteps));
        const pitchIndex = pitches.length - 1 - Math.floor(i * descendPitchStep);
        notes.push({
          time: t,
          pitch: pitches[pitchIndex],
          duration: (duration / descendSteps) * 0.85,
          velocity: Math.max(40, baseVelocity - (i / descendSteps) * 20)
        });
      }
      break;
      
    case 'ostinato':
      const patternLength = 4;
      const pattern = [];
      for (let i = 0; i < patternLength; i++) {
        pattern.push(pitches[i % pitches.length]);
      }
      
      let patternIndex = 0;
      const ostinateInterval = quarterNote / 2;
      
      for (let t = section.start_time; t < section.end_time; t += ostinateInterval) {
        notes.push({
          time: t,
          pitch: pattern[patternIndex % pattern.length],
          duration: ostinateInterval * 0.75,
          velocity: baseVelocity + (Math.random() * 5 - 2.5)
        });
        patternIndex++;
      }
      break;
      
    case 'melodic':
      const melodySteps = Math.floor(duration * Math.min(notesPerSecond, 2.5));
      let lastPitchIndex = Math.floor(pitches.length / 2);
      
      for (let i = 0; i < melodySteps; i++) {
        const t = section.start_time + (i * (duration / melodySteps));
        
        const motion = Math.random();
        if (motion < 0.8) {
          lastPitchIndex += Math.random() > 0.5 ? 1 : -1;
        } else {
          lastPitchIndex += Math.floor(Math.random() * 5 - 2);
        }
        
        lastPitchIndex = Math.max(0, Math.min(pitches.length - 1, lastPitchIndex));
        
        notes.push({
          time: t,
          pitch: pitches[lastPitchIndex],
          duration: (duration / melodySteps) * (0.8 + Math.random() * 0.15),
          velocity: baseVelocity + (Math.random() * velocityVariation - velocityVariation/2)
        });
      }
      break;
      
    case 'arpeggio':
      const arpeggioPattern = [0, 2, 4, 2];
      let arpIndex = 0;
      const arpInterval = quarterNote / 2;
      
      for (let t = section.start_time; t < section.end_time; t += arpInterval) {
        const basePitch = pitches[Math.floor(pitches.length / 3)];
        const offset = arpeggioPattern[arpIndex % arpeggioPattern.length];
        
        notes.push({
          time: t,
          pitch: basePitch + offset,
          duration: arpInterval * 0.75,
          velocity: baseVelocity + (Math.random() * 5 - 2.5)
        });
        
        arpIndex++;
      }
      break;
      
    case 'staccato_bursts':
      const burstCount = Math.max(2, Math.floor(duration / 3));
      for (let b = 0; b < burstCount; b++) {
        const burstStart = section.start_time + (b * (duration / burstCount));
        const notesInBurst = 3 + Math.floor(Math.random() * 3);
        
        for (let n = 0; n < notesInBurst; n++) {
          notes.push({
            time: burstStart + (n * 0.12),
            pitch: pitches[Math.floor(Math.random() * Math.min(7, pitches.length))],
            duration: 0.1,
            velocity: baseVelocity + (Math.random() * velocityVariation - velocityVariation/2)
          });
        }
      }
      break;
      
    case 'sparse_accents':
      // Very occasional notes - for low prominence components (1-3)
      const sparseInterval = Math.max(2, duration / 3);
      for (let i = 0; i < Math.floor(duration / sparseInterval); i++) {
        const t = section.start_time + (i * sparseInterval) + (Math.random() * 0.5);
        notes.push({
          time: t,
          pitch: pitches[Math.floor(Math.random() * pitches.length)],
          duration: 0.3 + Math.random() * 0.4,
          velocity: (baseVelocity || 65) + (Math.random() * 10 - 5)
        });
      }
      break;
      
    case 'pedal_tone':
      // Single sustained note - for foundation components
      const pedalPitch = pitches[Math.floor(pitches.length / 3)];
      notes.push({
        time: section.start_time,
        pitch: pedalPitch,
        duration: duration,
        velocity: baseVelocity || 60
      });
      break;
      
    case 'breathing_pattern':
      // Deliberate pacing with rests - calm, unhurried
      const breathInterval = 2;
      for (let t = section.start_time; t < section.end_time; t += breathInterval) {
        const pitchIndex = Math.floor(Math.random() * pitches.length);
        notes.push({
          time: t,
          pitch: pitches[pitchIndex],
          duration: 0.8,
          velocity: (baseVelocity || 70) + (Math.random() * 10 - 5)
        });
      }
      break;
      
    case 'rare_flourish':
      // Single brief gesture - for very minimal presence
      if (duration > 2) {
        const appearTime = section.start_time + duration * 0.7;
        const flourishNotes = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < flourishNotes; i++) {
          const upperRange = Math.floor(pitches.length * 0.7);
          const rangeSize = Math.floor(pitches.length * 0.3);
          notes.push({
            time: appearTime + (i * 0.15),
            pitch: pitches[upperRange + Math.floor(Math.random() * rangeSize)],
            duration: 0.12,
            velocity: (baseVelocity || 75) + (Math.random() * 15 - 7)
          });
        }
      }
      break;
      
    case 'silence':
      // Component not present - no notes generated
      break;
      
    default:
      console.warn(`Unknown pattern type: ${section.pattern_type}, using steady_rhythm`);
      const defaultInterval = quarterNote;
      for (let t = section.start_time; t < section.end_time; t += defaultInterval) {
        notes.push({
          time: t,
          pitch: pitches[Math.floor(Math.random() * Math.min(5, pitches.length))],
          duration: defaultInterval * 0.8,
          velocity: baseVelocity + (Math.random() * 5 - 2.5)
        });
      }
  }
  
  return notes;
}

// Generate MIDI from spec
function generateMidi(spec) {
  const midi = new Midi();
  
  // Set tempo and time signature
  midi.header.setTempo(spec.tempo);
  midi.header.timeSignatures = [{
    ticks: 0,
    timeSignature: spec.time_signature || [4, 4],
    measures: 0
  }];
  
  console.log(`\nGenerating MIDI:`);
  console.log(`  Tempo: ${spec.tempo} BPM`);
  console.log(`  Time Signature: ${(spec.time_signature || [4, 4]).join('/')}`);
  console.log(`  Tracks: ${spec.tracks.length}`);
  
  // Create tracks
  spec.tracks.forEach((trackSpec, index) => {
    const track = midi.addTrack();
    track.name = `${trackSpec.component_source || trackSpec.ingredient_source} (${trackSpec.instrument_name})`;
    track.instrument.number = trackSpec.midi_program;
    track.channel = (trackSpec.channel !== undefined) ? trackSpec.channel : (index % 16);
    
    console.log(`\n  Track ${index + 1}: ${track.name}`);
    console.log(`    Instrument: ${trackSpec.instrument_name} (Program ${trackSpec.midi_program})`);
    console.log(`    Role: ${trackSpec.overall_role || 'harmony'}`);
    
    // Generate notes from sections
    let allNotes = [];
    trackSpec.sections.forEach(section => {
      const sectionNotes = generateNotesFromSection(
        section, 
        spec.tempo,
        trackSpec.overall_role || 'harmony'
      );
      allNotes = allNotes.concat(sectionNotes);
      console.log(`    Section: ${section.pattern_type} (${sectionNotes.length} notes)`);
    });
    
    console.log(`    Total notes: ${allNotes.length}`);
    
    // Add all notes to track
    allNotes.forEach(note => {
      track.addNote({
        midi: typeof note.pitch === 'number' ? note.pitch : noteToMidi(note.pitch),
        time: note.time,
        duration: note.duration,
        velocity: note.velocity / 127
      });
    });
  });
  
  // Add metadata track with markers
  if (spec.metadata) {
    const markerTrack = midi.addTrack();
    markerTrack.name = `Recipe: ${spec.metadata.recipe_name || 'Untitled'}`;
    
    console.log(`\n  Metadata Track: ${markerTrack.name}`);
    
    if (spec.metadata.structure_markers && Array.isArray(spec.metadata.structure_markers)) {
      console.log(`    Markers: ${spec.metadata.structure_markers.length}`);
      spec.metadata.structure_markers.forEach((marker, idx) => {
        console.log(`      ${idx + 1}. ${marker.label} @ ${marker.time}s`);
      });
    }
  }
  
  return midi;
}

module.exports = { generateMidi };