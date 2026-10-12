// Retro Music Tracks: 5 New Upbeat 16-Bit / SNES Koei Style In-Game Soundtracks
// Handcrafted musical scores with rich harmonies, basslines, and authentic melodies.

import { BarScore, DrumStyle, ChordStabDef } from './executiveLoungeFullSong';

export interface BgmTrackDefinition {
  id: string;
  bpm: number;
  titleTh: string;
  titleEn: string;
  descTh: string;
  descEn: string;
  genre: string;
  score: BarScore[];
}

// ============================================================================
// TRACK 1: Pacific Horizon (Skyward Fusion) - 112 BPM
// Upbeat Japanese City Pop / T-Square style aviation jazz fusion
// ============================================================================
const PACIFIC_HORIZON_SCORE: BarScore[] = [
  // Bar 1: Intro Fanfare
  {
    barIndex: 0,
    sectionName: 'Intro',
    chordName: 'Gmaj7',
    lead: ['G5', null, 'B5', null, 'D6', null, 'C6', 'B5', 'A5', null, 'G5', null, 'F#5', null, 'G5', null],
    bass: ['G2', null, null, null, 'D3', null, null, null, 'G2', null, 'B2', null, 'D3', null, 'G2', null],
    chords: [{ step: 0, notes: ['B3', 'D4', 'F#4'] }, { step: 8, notes: ['B3', 'D4', 'G4'] }],
    drumStyle: 'intro',
  },
  // Bar 2: Cmaj7 -> D/C
  {
    barIndex: 1,
    sectionName: 'Intro',
    chordName: 'Cmaj7 -> D/C',
    lead: ['E5', null, 'G5', null, 'B5', null, 'A5', 'G5', 'F#5', null, 'A5', null, 'D6', null, 'C6', null],
    bass: ['C2', null, null, null, 'G2', null, null, null, 'C3', null, 'D3', null, 'A2', null, 'F#2', null],
    chords: [{ step: 0, notes: ['E3', 'G3', 'B3'] }, { step: 8, notes: ['F#3', 'A3', 'D4'] }],
    drumStyle: 'fill',
  },
  // Bar 3: Theme A - Bm7 -> Em7
  {
    barIndex: 2,
    sectionName: 'Theme A',
    chordName: 'Bm7 -> Em7',
    lead: ['B5', null, 'A5', 'G5', 'F#5', null, 'G5', null, 'E5', null, 'G5', 'B5', 'D6', null, 'C#6', null],
    bass: ['B2', null, 'F#3', null, 'B2', null, 'D3', null, 'E2', null, 'B2', null, 'E3', null, 'G2', null],
    chords: [{ step: 0, notes: ['D3', 'F#3', 'A3'] }, { step: 8, notes: ['E3', 'G3', 'B3'] }],
    drumStyle: 'normal',
  },
  // Bar 4: Am7 -> D7sus4
  {
    barIndex: 3,
    sectionName: 'Theme A',
    chordName: 'Am7 -> D7',
    lead: ['C6', null, 'B5', 'A5', 'G5', null, 'F#5', null, 'A5', null, 'G5', 'F#5', 'D5', null, 'F#5', null],
    bass: ['A2', null, 'E3', null, 'A2', null, 'C3', null, 'D2', null, 'A2', null, 'D3', null, 'F#2', null],
    chords: [{ step: 0, notes: ['C3', 'E3', 'G3'] }, { step: 8, notes: ['C3', 'D3', 'F#3'] }],
    drumStyle: 'normal',
  },
  // Bar 5: Gmaj7 High Flight
  {
    barIndex: 4,
    sectionName: 'Theme A2',
    chordName: 'Gmaj7',
    lead: ['G5', null, 'A5', 'B5', 'D6', null, 'G6', null, 'F#6', null, 'E6', 'D6', 'B5', null, 'D6', null],
    bass: ['G2', null, 'G2', 'D3', null, 'G2', 'B2', null, 'G2', null, 'D3', null, 'G3', null, 'F#3', null],
    chords: [{ step: 0, notes: ['B3', 'D4', 'F#4'] }, { step: 8, notes: ['B3', 'D4', 'G4'] }],
    drumStyle: 'groove',
  },
  // Bar 6: Cmaj7 -> C#dim7
  {
    barIndex: 5,
    sectionName: 'Theme A2',
    chordName: 'Cmaj7 -> C#dim7',
    lead: ['E6', null, 'D6', 'C6', 'B5', null, 'A5', null, 'Bb5', null, 'G5', 'E5', 'C#5', null, 'E5', null],
    bass: ['C2', null, 'G2', null, 'C3', null, 'E3', null, 'C#2', null, 'G2', null, 'C#3', null, 'E2', null],
    chords: [{ step: 0, notes: ['E3', 'G3', 'B3'] }, { step: 8, notes: ['E3', 'G3', 'Bb3', 'C#4'] }],
    drumStyle: 'groove',
  },
  // Bar 7: D/C -> B7
  {
    barIndex: 6,
    sectionName: 'Bridge',
    chordName: 'D/C -> B7',
    lead: ['D5', null, 'F#5', 'A5', 'C6', null, 'B5', null, 'D#5', null, 'F#5', 'A5', 'B5', null, 'D#6', null],
    bass: ['C2', null, 'D2', null, 'A2', null, 'C3', null, 'B2', null, 'F#2', null, 'D#2', null, 'F#2', null],
    chords: [{ step: 0, notes: ['F#3', 'A3', 'D4'] }, { step: 8, notes: ['D#3', 'F#3', 'A3', 'B3'] }],
    drumStyle: 'normal',
  },
  // Bar 8: Em7 -> A7 -> D7 (Turnaround)
  {
    barIndex: 7,
    sectionName: 'Turnaround',
    chordName: 'Em7 -> A7 -> D7',
    lead: ['E6', null, 'D6', 'B5', 'G5', null, 'E5', null, 'A5', null, 'C#6', null, 'D6', null, null, null],
    bass: ['E2', null, 'B2', null, 'A2', null, 'E3', null, 'D2', null, 'A2', null, 'D3', null, 'F#2', null],
    chords: [{ step: 0, notes: ['G3', 'B3', 'E4'] }, { step: 6, notes: ['G3', 'A3', 'C#4'] }, { step: 12, notes: ['F#3', 'A3', 'D4'] }],
    drumStyle: 'fill',
  },
  // Bar 9-16: Part B Expansion
  {
    barIndex: 8,
    sectionName: 'Theme B',
    chordName: 'Cmaj7',
    lead: ['B5', null, 'C6', null, 'D6', null, 'E6', null, 'D6', 'C6', 'B5', 'A5', 'G5', null, 'A5', null],
    bass: ['C2', null, 'G2', null, 'C3', null, 'E3', null, 'C2', null, 'E2', null, 'G2', null, 'B2', null],
    chords: [{ step: 0, notes: ['E3', 'G3', 'B3'] }, { step: 8, notes: ['E3', 'G3', 'C4'] }],
    drumStyle: 'normal',
  },
  {
    barIndex: 9,
    sectionName: 'Theme B',
    chordName: 'Bm7 -> Em7',
    lead: ['F#5', null, 'G5', null, 'A5', null, 'B5', null, 'A5', 'G5', 'F#5', 'E5', 'D5', null, 'E5', null],
    bass: ['B2', null, 'F#3', null, 'B2', null, 'D3', null, 'E2', null, 'B2', null, 'E3', null, 'G2', null],
    chords: [{ step: 0, notes: ['D3', 'F#3', 'A3'] }, { step: 8, notes: ['D3', 'G3', 'B3'] }],
    drumStyle: 'normal',
  },
  {
    barIndex: 10,
    sectionName: 'Theme B',
    chordName: 'Am7 -> D7',
    lead: ['C5', null, 'E5', null, 'G5', null, 'B5', null, 'A5', null, 'G5', null, 'F#5', null, 'A5', null],
    bass: ['A2', null, 'E3', null, 'A2', null, 'C3', null, 'D2', null, 'A2', null, 'D3', null, 'C3', null],
    chords: [{ step: 0, notes: ['C3', 'E3', 'G3'] }, { step: 8, notes: ['C3', 'D3', 'F#3'] }],
    drumStyle: 'groove',
  },
  {
    barIndex: 11,
    sectionName: 'Theme B',
    chordName: 'Gmaj7 -> G7',
    lead: ['G5', null, 'D6', null, 'B5', null, 'G5', null, 'F5', null, 'D5', null, 'F5', null, 'G5', null],
    bass: ['G2', null, 'D3', null, 'G3', null, 'B2', null, 'F2', null, 'G2', null, 'B2', null, 'D3', null],
    chords: [{ step: 0, notes: ['B3', 'D4', 'F#4'] }, { step: 8, notes: ['B3', 'D4', 'F4'] }],
    drumStyle: 'groove',
  },
  {
    barIndex: 12,
    sectionName: 'Climax',
    chordName: 'Cmaj7 -> Cm7',
    lead: ['E6', null, 'D6', null, 'C6', null, 'B5', null, 'Eb6', null, 'D6', null, 'C6', null, 'Bb5', null],
    bass: ['C2', null, 'G2', null, 'C3', null, 'E3', null, 'C2', null, 'Eb2', null, 'G2', null, 'Bb2', null],
    chords: [{ step: 0, notes: ['E3', 'G3', 'B3'] }, { step: 8, notes: ['Eb3', 'G3', 'Bb3'] }],
    drumStyle: 'groove',
  },
  {
    barIndex: 13,
    sectionName: 'Climax',
    chordName: 'Bm7 -> E7',
    lead: ['D6', null, 'C#6', null, 'B5', null, 'A5', null, 'G#5', null, 'B5', null, 'D6', null, 'E6', null],
    bass: ['B2', null, 'F#2', null, 'B2', null, 'D3', null, 'E2', null, 'G#2', null, 'B2', null, 'E3', null],
    chords: [{ step: 0, notes: ['D3', 'F#3', 'B3'] }, { step: 8, notes: ['D3', 'G#3', 'B3', 'E4'] }],
    drumStyle: 'normal',
  },
  {
    barIndex: 14,
    sectionName: 'Outro Prep',
    chordName: 'Am7 -> D7alt',
    lead: ['C6', null, 'B5', 'A5', 'G5', null, 'F#5', null, 'Ab5', null, 'C6', null, 'Eb6', null, 'D6', null],
    bass: ['A2', null, 'E3', null, 'A2', null, 'C3', null, 'D2', null, 'Ab2', null, 'C3', null, 'D3', null],
    chords: [{ step: 0, notes: ['C3', 'E3', 'G3'] }, { step: 8, notes: ['C3', 'Eb3', 'Ab3'] }],
    drumStyle: 'fill',
  },
  {
    barIndex: 15,
    sectionName: 'Cadence',
    chordName: 'Gmaj7 -> D7',
    lead: ['G6', null, null, null, 'D6', null, 'B5', null, 'G5', null, null, null, null, null, null, null],
    bass: ['G2', null, null, null, 'D3', null, null, null, 'G2', null, 'D2', null, 'F#2', null, 'A2', null],
    chords: [{ step: 0, notes: ['B3', 'D4', 'G4'] }, { step: 8, notes: ['A3', 'C4', 'D4'] }],
    drumStyle: 'intro',
  },
];

// ============================================================================
// TRACK 2: Rio Samba Airways (Tropical Flight) - 120 BPM
// Upbeat Latin Bossa & Samba batucada with playful brass & flute lead
// ============================================================================
const RIO_SAMBA_SCORE: BarScore[] = [
  // Bar 1: Brazilian Bossa Rhythm Start
  {
    barIndex: 0,
    sectionName: 'Samba Intro',
    chordName: 'Dmaj9',
    lead: ['F#5', null, 'A5', null, 'C#6', null, 'B5', null, 'A5', 'F#5', null, 'E5', 'F#5', null, null, null],
    bass: ['D2', null, null, null, 'A2', null, 'D3', null, 'D2', null, null, null, 'A2', null, 'C#3', null],
    chords: [{ step: 2, notes: ['F#3', 'A3', 'C#4', 'E4'] }, { step: 8, notes: ['F#3', 'A3', 'C#4'] }, { step: 14, notes: ['F#3', 'A3', 'C#4'] }],
    drumStyle: 'groove',
  },
  // Bar 2: Em9 -> A13
  {
    barIndex: 1,
    sectionName: 'Samba Intro',
    chordName: 'Em9 -> A13',
    lead: ['G5', null, 'B5', null, 'D6', null, 'C#6', null, 'B5', 'G5', null, 'F#5', 'E5', null, 'F#5', 'G5'],
    bass: ['E2', null, null, null, 'B2', null, 'E3', null, 'A2', null, null, null, 'E3', null, 'G2', null],
    chords: [{ step: 2, notes: ['G3', 'B3', 'D4', 'F#4'] }, { step: 8, notes: ['G3', 'C#4', 'F#4'] }, { step: 14, notes: ['G3', 'C#4', 'F#4'] }],
    drumStyle: 'groove',
  },
  // Bar 3: F#m7 -> B7b9
  {
    barIndex: 2,
    sectionName: 'Tropical Theme',
    chordName: 'F#m7 -> B7b9',
    lead: ['A5', null, 'C#6', null, 'E6', null, 'D#6', null, 'C6', 'A5', null, 'F#5', 'D#5', null, 'F#5', null],
    bass: ['F#2', null, null, null, 'C#3', null, 'F#3', null, 'B2', null, null, null, 'F#2', null, 'A2', null],
    chords: [{ step: 2, notes: ['A3', 'C#4', 'E4'] }, { step: 8, notes: ['A3', 'C4', 'D#4'] }, { step: 14, notes: ['A3', 'C4', 'D#4'] }],
    drumStyle: 'normal',
  },
  // Bar 4: Em7 -> A7
  {
    barIndex: 3,
    sectionName: 'Tropical Theme',
    chordName: 'Em7 -> A7',
    lead: ['G5', null, 'F#5', 'E5', 'D5', null, 'C#5', null, 'E5', null, 'G5', null, 'B5', null, 'A5', null],
    bass: ['E2', null, null, null, 'B2', null, 'E3', null, 'A2', null, null, null, 'E2', null, 'G2', null],
    chords: [{ step: 2, notes: ['G3', 'B3', 'D4'] }, { step: 8, notes: ['G3', 'A3', 'C#4'] }, { step: 14, notes: ['G3', 'A3', 'C#4'] }],
    drumStyle: 'fill',
  },
  // Bar 5: Dmaj9 High Carnival
  {
    barIndex: 4,
    sectionName: 'Carnival Flight',
    chordName: 'Dmaj9',
    lead: ['F#6', null, 'E6', 'D6', 'C#6', null, 'B5', null, 'A5', null, 'F#5', null, 'D5', null, 'F#5', null],
    bass: ['D2', null, null, null, 'A2', null, 'D3', null, 'D2', null, null, null, 'A2', null, 'C#3', null],
    chords: [{ step: 2, notes: ['F#3', 'A3', 'C#4', 'E4'] }, { step: 8, notes: ['F#3', 'A3', 'C#4'] }, { step: 14, notes: ['F#3', 'A3', 'C#4'] }],
    drumStyle: 'groove',
  },
  // Bar 6: Gmaj7 -> Gm6
  {
    barIndex: 5,
    sectionName: 'Carnival Flight',
    chordName: 'Gmaj7 -> Gm6',
    lead: ['B5', null, 'D6', null, 'G6', null, 'F#6', null, 'Bb5', null, 'D6', null, 'G6', null, 'F6', null],
    bass: ['G2', null, null, null, 'D3', null, 'G3', null, 'G2', null, null, null, 'D3', null, 'F2', null],
    chords: [{ step: 2, notes: ['B3', 'D4', 'F#4'] }, { step: 8, notes: ['Bb3', 'D4', 'E4'] }, { step: 14, notes: ['Bb3', 'D4', 'E4'] }],
    drumStyle: 'groove',
  },
  // Bar 7: F#m7 -> B7
  {
    barIndex: 6,
    sectionName: 'Copacabana',
    chordName: 'F#m7 -> B7',
    lead: ['A5', null, 'C#6', null, 'E6', null, 'D6', null, 'B5', null, 'G#5', null, 'F#5', null, 'D#5', null],
    bass: ['F#2', null, null, null, 'C#3', null, 'F#3', null, 'B2', null, null, null, 'F#2', null, 'A2', null],
    chords: [{ step: 2, notes: ['A3', 'C#4', 'E4'] }, { step: 8, notes: ['A3', 'B3', 'D#4'] }],
    drumStyle: 'normal',
  },
  // Bar 8: Em9 -> A7 Turnaround
  {
    barIndex: 7,
    sectionName: 'Samba Turnaround',
    chordName: 'Em9 -> A7',
    lead: ['E5', null, 'G5', 'B5', 'D6', null, 'C#6', null, 'A5', null, 'E5', null, 'D5', null, null, null],
    bass: ['E2', null, null, null, 'B2', null, 'E3', null, 'A2', null, 'C#3', null, 'E3', null, 'G2', null],
    chords: [{ step: 2, notes: ['G3', 'B3', 'D4'] }, { step: 8, notes: ['G3', 'A3', 'C#4'] }],
    drumStyle: 'fill',
  },
];

// ============================================================================
// TRACK 3: Tokyo Boardroom Funk (Grooveliner) - 108 BPM
// 90s Funky Boardroom Slap Bass Groove with minor 9th stabs & Koei simulation attitude
// ============================================================================
const TOKYO_FUNK_SCORE: BarScore[] = [
  // Bar 1: Funky Slap Bass Opening
  {
    barIndex: 0,
    sectionName: 'Funk Intro',
    chordName: 'Am9',
    lead: [null, null, 'E5', null, 'G5', null, 'A5', null, 'C6', null, 'A5', null, 'G5', 'E5', 'D5', 'C5'],
    bass: ['A1', null, 'A2', null, null, 'G2', 'A2', null, 'A1', null, 'C2', null, 'D2', 'D#2', 'E2', null],
    chords: [{ step: 4, notes: ['G3', 'B3', 'C4', 'E4'] }, { step: 10, notes: ['G3', 'B3', 'C4', 'E4'] }],
    drumStyle: 'groove',
  },
  // Bar 2: D9 Funk Stab
  {
    barIndex: 1,
    sectionName: 'Funk Intro',
    chordName: 'D9',
    lead: ['D5', null, 'F#5', null, 'A5', null, 'C6', null, 'E6', null, 'D6', null, 'C6', 'A5', 'F#5', null],
    bass: ['D2', null, 'D3', null, null, 'C3', 'D3', null, 'D2', null, 'F#2', null, 'G2', 'G#2', 'A2', null],
    chords: [{ step: 4, notes: ['F#3', 'C4', 'E4'] }, { step: 10, notes: ['F#3', 'C4', 'E4'] }],
    drumStyle: 'groove',
  },
  // Bar 3: Fmaj7 -> E7#9 (Hendrix / Funk Chord)
  {
    barIndex: 2,
    sectionName: 'Boardroom Theme',
    chordName: 'Fmaj7 -> E7#9',
    lead: ['F5', null, 'A5', null, 'C6', null, 'E6', null, 'G6', null, 'F6', 'E6', 'D#6', null, 'E6', null],
    bass: ['F2', null, 'F3', null, 'C3', null, 'F2', null, 'E2', null, 'E3', null, 'G#2', null, 'B2', null],
    chords: [{ step: 0, notes: ['A3', 'C4', 'E4'] }, { step: 8, notes: ['G#3', 'D4', 'G4'] }],
    drumStyle: 'normal',
  },
  // Bar 4: Am9 Break
  {
    barIndex: 3,
    sectionName: 'Boardroom Theme',
    chordName: 'Am9',
    lead: ['A5', null, 'C6', 'D6', 'D#6', 'E6', 'G6', 'E6', 'D6', 'C6', 'A5', null, 'G5', 'E5', 'C5', null],
    bass: ['A1', null, 'A2', null, 'E2', null, 'G2', null, 'A2', null, 'C3', null, 'D3', null, 'D#3', null],
    chords: [{ step: 0, notes: ['G3', 'C4', 'E4'] }, { step: 8, notes: ['G3', 'C4', 'E4'] }],
    drumStyle: 'fill',
  },
  // Bar 5: Am9 High Clavinet
  {
    barIndex: 4,
    sectionName: 'High Groove',
    chordName: 'Am9',
    lead: ['C6', null, 'A5', null, 'G5', null, 'E5', null, 'G5', 'A5', 'C6', 'D6', 'E6', null, 'G6', null],
    bass: ['A1', null, 'A2', null, null, 'G2', 'A2', null, 'A1', null, 'C2', null, 'D2', 'D#2', 'E2', null],
    chords: [{ step: 4, notes: ['G3', 'B3', 'C4', 'E4'] }, { step: 10, notes: ['G3', 'B3', 'C4', 'E4'] }],
    drumStyle: 'groove',
  },
  // Bar 6: D9 High Clavinet
  {
    barIndex: 5,
    sectionName: 'High Groove',
    chordName: 'D9',
    lead: ['A6', null, 'G6', 'E6', 'D6', null, 'C6', null, 'A5', null, 'C6', null, 'D6', null, 'C6', null],
    bass: ['D2', null, 'D3', null, null, 'C3', 'D3', null, 'D2', null, 'F#2', null, 'G2', 'G#2', 'A2', null],
    chords: [{ step: 4, notes: ['F#3', 'C4', 'E4'] }, { step: 10, notes: ['F#3', 'C4', 'E4'] }],
    drumStyle: 'groove',
  },
  // Bar 7: Dm9 -> G13
  {
    barIndex: 6,
    sectionName: 'Funky Bridge',
    chordName: 'Dm9 -> G13',
    lead: ['F5', null, 'A5', null, 'C6', null, 'E6', null, 'F6', null, 'E6', 'D6', 'B5', null, 'G5', null],
    bass: ['D2', null, 'A2', null, 'D3', null, 'F3', null, 'G2', null, 'D3', null, 'F2', null, 'B2', null],
    chords: [{ step: 0, notes: ['F3', 'A3', 'C4', 'E4'] }, { step: 8, notes: ['F3', 'B3', 'E4'] }],
    drumStyle: 'normal',
  },
  // Bar 8: Cmaj7 -> E7#9 Turnaround
  {
    barIndex: 7,
    sectionName: 'Turnaround',
    chordName: 'Cmaj7 -> E7#9',
    lead: ['E5', null, 'G5', null, 'B5', null, 'D6', null, 'D#6', null, 'E6', null, null, null, null, null],
    bass: ['C2', null, 'G2', null, 'C3', null, 'E3', null, 'E2', null, 'G#2', null, 'B2', null, 'E3', null],
    chords: [{ step: 0, notes: ['E3', 'G3', 'B3', 'D4'] }, { step: 8, notes: ['G#3', 'D4', 'G4'] }],
    drumStyle: 'fill',
  },
];

// ============================================================================
// TRACK 4: Supersonic Anthem (Super Famicom March) - 124 BPM
// Authentic 16-Bit Koei Arcade Simulation Theme: Heroic, uplifting brass & march snare
// ============================================================================
const SUPERSONIC_MARCH_SCORE: BarScore[] = [
  // Bar 1: Heroic Fanfare
  {
    barIndex: 0,
    sectionName: 'Anthem Intro',
    chordName: 'Bb',
    lead: ['Bb4', null, 'D5', null, 'F5', null, null, null, 'Bb5', null, 'A5', 'G5', 'F5', null, 'D5', null],
    bass: ['Bb2', null, 'Bb2', null, 'F3', null, 'Bb2', null, 'Bb2', null, 'D3', null, 'F3', null, 'Bb2', null],
    chords: [{ step: 0, notes: ['D4', 'F4', 'Bb4'] }, { step: 8, notes: ['D4', 'F4', 'Bb4'] }],
    drumStyle: 'normal',
  },
  // Bar 2: F/A
  {
    barIndex: 1,
    sectionName: 'Anthem Intro',
    chordName: 'F/A',
    lead: ['C5', null, 'F5', null, 'A5', null, null, null, 'C6', null, 'Bb5', 'A5', 'G5', null, 'F5', null],
    bass: ['A2', null, 'A2', null, 'E3', null, 'A2', null, 'A2', null, 'C3', null, 'F3', null, 'A2', null],
    chords: [{ step: 0, notes: ['C4', 'F4', 'A4'] }, { step: 8, notes: ['C4', 'F4', 'A4'] }],
    drumStyle: 'normal',
  },
  // Bar 3: Gm7 -> Eb
  {
    barIndex: 2,
    sectionName: 'Heroic March',
    chordName: 'Gm7 -> Eb',
    lead: ['G5', null, 'Bb5', null, 'D6', null, 'C6', 'Bb5', 'G5', null, 'Eb5', null, 'G5', null, 'Bb5', null],
    bass: ['G2', null, 'D3', null, 'G2', null, 'Bb2', null, 'Eb2', null, 'Bb2', null, 'Eb3', null, 'G2', null],
    chords: [{ step: 0, notes: ['Bb3', 'D4', 'G4'] }, { step: 8, notes: ['G3', 'Bb3', 'Eb4'] }],
    drumStyle: 'groove',
  },
  // Bar 4: Fsus4 -> F
  {
    barIndex: 3,
    sectionName: 'Heroic March',
    chordName: 'Fsus4 -> F',
    lead: ['C6', null, 'D6', null, 'Eb6', null, 'D6', 'C6', 'Bb5', null, 'A5', null, 'G5', null, 'A5', null],
    bass: ['F2', null, 'C3', null, 'F2', null, 'A2', null, 'F2', null, 'A2', null, 'C3', null, 'Eb3', null],
    chords: [{ step: 0, notes: ['Bb3', 'C4', 'F4'] }, { step: 8, notes: ['A3', 'C4', 'F4'] }],
    drumStyle: 'fill',
  },
  // Bar 5: Bb Grand Skies
  {
    barIndex: 4,
    sectionName: 'Triumphant Flight',
    chordName: 'Bb',
    lead: ['Bb5', null, 'D6', null, 'F6', null, null, null, 'D6', null, 'C6', 'Bb5', 'C6', null, 'D6', null],
    bass: ['Bb2', null, 'F3', null, 'Bb2', null, 'D3', null, 'Bb2', null, 'D3', null, 'F3', null, 'Bb2', null],
    chords: [{ step: 0, notes: ['D4', 'F4', 'Bb4'] }, { step: 8, notes: ['D4', 'F4', 'Bb4'] }],
    drumStyle: 'normal',
  },
  // Bar 6: Ebmaj7 -> Dm7
  {
    barIndex: 5,
    sectionName: 'Triumphant Flight',
    chordName: 'Ebmaj7 -> Dm7',
    lead: ['Eb6', null, 'D6', null, 'C6', null, 'Bb5', null, 'A5', null, 'Bb5', null, 'C6', null, 'D6', null],
    bass: ['Eb2', null, 'Bb2', null, 'Eb3', null, 'G2', null, 'D2', null, 'A2', null, 'D3', null, 'F2', null],
    chords: [{ step: 0, notes: ['G3', 'Bb3', 'D4'] }, { step: 8, notes: ['F3', 'A3', 'D4'] }],
    drumStyle: 'groove',
  },
  // Bar 7: Cm7 -> F7
  {
    barIndex: 6,
    sectionName: 'Global Conquest',
    chordName: 'Cm7 -> F7',
    lead: ['Eb5', null, 'G5', null, 'Bb5', null, 'D6', null, 'C6', null, 'Bb5', null, 'A5', null, 'C6', null],
    bass: ['C2', null, 'G2', null, 'C3', null, 'Eb3', null, 'F2', null, 'C3', null, 'F3', null, 'A2', null],
    chords: [{ step: 0, notes: ['Eb3', 'G3', 'Bb3', 'D4'] }, { step: 8, notes: ['Eb3', 'F3', 'A3', 'C4'] }],
    drumStyle: 'normal',
  },
  // Bar 8: Bb Triumphant Cadence
  {
    barIndex: 7,
    sectionName: 'Cadence',
    chordName: 'Bb',
    lead: ['Bb5', null, null, null, 'F5', null, 'D5', null, 'Bb4', null, null, null, null, null, null, null],
    bass: ['Bb2', null, 'F2', null, 'Bb2', null, 'D3', null, 'Bb2', null, 'F3', null, 'Bb3', null, null, null],
    chords: [{ step: 0, notes: ['D4', 'F4', 'Bb4'] }, { step: 8, notes: ['D4', 'F4', 'Bb4'] }],
    drumStyle: 'fill',
  },
];

// ============================================================================
// TRACK 5: Neon Future Expressway (Cyber Chiptune) - 128 BPM
// High-Energy Supersonic Chiptune & Eurobeat Synthwave: Driving 16th-note bass & catchy hooks
// ============================================================================
const NEON_EXPRESSWAY_SCORE: BarScore[] = [
  // Bar 1: Driving Mach 5 Pulse
  {
    barIndex: 0,
    sectionName: 'Mach 5 Drive',
    chordName: 'Cm',
    lead: ['C5', 'Eb5', 'G5', 'C6', 'G5', 'Eb5', 'C5', 'Eb5', 'G5', 'C6', 'Eb6', 'D6', 'C6', 'G5', 'Eb5', 'D5'],
    bass: ['C2', 'C2', 'G2', 'C2', 'C2', 'G2', 'C2', 'C2', 'C2', 'C2', 'G2', 'C2', 'Eb2', 'C2', 'G2', 'C2'],
    chords: [{ step: 0, notes: ['Eb3', 'G3', 'C4'] }, { step: 8, notes: ['Eb3', 'G3', 'C4'] }],
    drumStyle: 'groove',
  },
  // Bar 2: Abmaj7 Turbo
  {
    barIndex: 1,
    sectionName: 'Mach 5 Drive',
    chordName: 'Abmaj7',
    lead: ['Eb5', 'G5', 'Ab5', 'C6', 'Eb6', null, 'D6', 'C6', 'Bb5', null, 'Ab5', null, 'G5', null, 'F5', null],
    bass: ['Ab1', 'Ab1', 'Eb2', 'Ab1', 'Ab1', 'Eb2', 'Ab1', 'Ab1', 'Ab1', 'Ab1', 'Eb2', 'Ab1', 'C2', 'Ab1', 'Eb2', 'Ab1'],
    chords: [{ step: 0, notes: ['Eb3', 'G3', 'C4'] }, { step: 8, notes: ['Eb3', 'Ab3', 'C4'] }],
    drumStyle: 'groove',
  },
  // Bar 3: Bb -> Gm
  {
    barIndex: 2,
    sectionName: 'Cyber Flight',
    chordName: 'Bb -> Gm',
    lead: ['F5', 'Bb5', 'D6', 'F6', 'D6', 'Bb5', 'F5', 'Bb5', 'D6', 'C6', 'Bb5', 'A5', 'G5', null, 'Bb5', null],
    bass: ['Bb1', 'Bb1', 'F2', 'Bb1', 'Bb1', 'F2', 'Bb1', 'Bb1', 'G1', 'G1', 'D2', 'G1', 'G1', 'D2', 'G1', 'G1'],
    chords: [{ step: 0, notes: ['D3', 'F3', 'Bb3'] }, { step: 8, notes: ['D3', 'G3', 'Bb3'] }],
    drumStyle: 'normal',
  },
  // Bar 4: Cm -> G7 Power Turn
  {
    barIndex: 3,
    sectionName: 'Cyber Flight',
    chordName: 'Cm -> G7',
    lead: ['C6', null, 'D6', null, 'Eb6', null, 'F6', null, 'G6', null, 'F6', 'Eb6', 'D6', null, 'B5', null],
    bass: ['C2', 'C2', 'G2', 'C2', 'C2', 'G2', 'C2', 'C2', 'G1', 'G1', 'D2', 'G1', 'F2', 'G1', 'B1', 'G1'],
    chords: [{ step: 0, notes: ['Eb3', 'G3', 'C4'] }, { step: 8, notes: ['D3', 'F3', 'B3'] }],
    drumStyle: 'fill',
  },
  // Bar 5: Superluminal Chorus
  {
    barIndex: 4,
    sectionName: 'Superluminal',
    chordName: 'Abmaj7',
    lead: ['C6', null, 'C6', 'D6', 'Eb6', null, 'D6', 'C6', 'Bb5', null, 'G5', null, 'Ab5', null, 'Bb5', null],
    bass: ['Ab1', 'Ab1', 'Eb2', 'Ab1', 'Ab1', 'Eb2', 'Ab1', 'Ab1', 'Ab1', 'Ab1', 'Eb2', 'Ab1', 'C2', 'Ab1', 'Eb2', 'Ab1'],
    chords: [{ step: 0, notes: ['Eb3', 'Ab3', 'C4'] }, { step: 8, notes: ['Eb3', 'Ab3', 'C4'] }],
    drumStyle: 'groove',
  },
  // Bar 6: Bb Power Chorus
  {
    barIndex: 5,
    sectionName: 'Superluminal',
    chordName: 'Bb',
    lead: ['D6', null, 'D6', 'Eb6', 'F6', null, 'Eb6', 'D6', 'C6', null, 'A5', null, 'Bb5', null, 'C6', null],
    bass: ['Bb1', 'Bb1', 'F2', 'Bb1', 'Bb1', 'F2', 'Bb1', 'Bb1', 'Bb1', 'Bb1', 'F2', 'Bb1', 'D2', 'Bb1', 'F2', 'Bb1'],
    chords: [{ step: 0, notes: ['F3', 'Bb3', 'D4'] }, { step: 8, notes: ['F3', 'Bb3', 'D4'] }],
    drumStyle: 'groove',
  },
  // Bar 7: Cm -> Eb
  {
    barIndex: 6,
    sectionName: 'Hyperdrive',
    chordName: 'Cm -> Eb',
    lead: ['Eb6', null, 'D6', 'C6', 'G5', null, 'C6', null, 'Bb5', null, 'G5', 'Eb5', 'F5', null, 'G5', null],
    bass: ['C2', 'C2', 'G2', 'C2', 'C2', 'G2', 'C2', 'C2', 'Eb2', 'Eb2', 'Bb2', 'Eb2', 'Eb2', 'Bb2', 'Eb2', 'Eb2'],
    chords: [{ step: 0, notes: ['Eb3', 'G3', 'C4'] }, { step: 8, notes: ['Eb3', 'G3', 'Bb3'] }],
    drumStyle: 'normal',
  },
  // Bar 8: G7sus4 -> G7 Apex
  {
    barIndex: 7,
    sectionName: 'Apex',
    chordName: 'G7sus4 -> G7',
    lead: ['Ab5', null, 'G5', 'F5', 'Eb5', 'D5', 'C5', 'D5', 'G5', null, null, null, null, null, null, null],
    bass: ['G1', 'G1', 'D2', 'G1', 'F2', 'G1', 'G1', 'G1', 'G1', null, 'B1', null, 'D2', null, 'F2', null],
    chords: [{ step: 0, notes: ['C3', 'D3', 'F3', 'G3'] }, { step: 8, notes: ['B2', 'D3', 'F3', 'G3'] }],
    drumStyle: 'fill',
  },
];

// All Available Tracks Catalog
export const BGM_TRACKS_CATALOG: BgmTrackDefinition[] = [
  {
    id: 'executive_lounge',
    bpm: 100,
    titleTh: 'Executive Lounge (Grand Suite)',
    titleEn: 'Executive Lounge (Grand Suite)',
    descTh: 'ซิตี้ป๊อปหรูหรา ผ่อนคลาย สำหรับการบริหารสายการบิน (48 บาร์เต็ม)',
    descEn: 'Sophisticated 48-bar City Pop lounge suite for executive focus',
    genre: 'City Pop / Lounge',
    score: [], // Will point to EXECUTIVE_LOUNGE_FULL_SCORE dynamically
  },
  {
    id: 'pacific_horizon',
    bpm: 112,
    titleTh: 'Pacific Horizon (Skyward Fusion)',
    titleEn: 'Pacific Horizon (Skyward Fusion)',
    descTh: 'แจ๊สฟิวชันยุค 90s สดใส มีชีวิตชีวา ท่วงทำนองบินข้ามมหาสมุทรแปซิฟิก',
    descEn: 'Upbeat 90s Japanese fusion flight over the sparkling Pacific ocean',
    genre: 'City Pop Fusion',
    score: PACIFIC_HORIZON_SCORE,
  },
  {
    id: 'rio_samba',
    bpm: 120,
    titleTh: 'Rio Samba Airways (Tropical Carnival)',
    titleEn: 'Rio Samba Airways (Tropical Carnival)',
    descTh: 'ละตินแซมบ้าและบอสซาโนวา สนุกสนาน คึกคัก กลิ่นอายเส้นทางอเมริกาใต้',
    descEn: 'Lively Brazilian samba carnival rhythm with playful sunny melodies',
    genre: 'Latin Samba / Bossa',
    score: RIO_SAMBA_SCORE,
  },
  {
    id: 'tokyo_funk',
    bpm: 108,
    titleTh: 'Tokyo Boardroom Funk (Grooveliner)',
    titleEn: 'Tokyo Boardroom Funk (Grooveliner)',
    descTh: 'ฟังก์ 90s จังหวะสแล็ปเบสแน่นๆ เร้าใจ สไตล์ห้องประชุมผู้บริหารโคเออิ',
    descEn: '90s slap bass corporate funk groove with confident boardroom attitude',
    genre: '90s Boardroom Funk',
    score: TOKYO_FUNK_SCORE,
  },
  {
    id: 'supersonic_march',
    bpm: 124,
    titleTh: 'Supersonic Anthem (16-Bit March)',
    titleEn: 'Supersonic Anthem (16-Bit March)',
    descTh: 'เพลงมาร์ชอาร์เคดสไตล์ Super Famicom แท้ๆ ฮึกเหิม อบอวลด้วยชัยชนะ',
    descEn: 'Authentic 16-bit Koei simulation march fanfare with triumphant brass',
    genre: '16-Bit Simulation Anthem',
    score: SUPERSONIC_MARCH_SCORE,
  },
  {
    id: 'neon_expressway',
    bpm: 128,
    titleTh: 'Neon Future Expressway (Cyber Chiptune)',
    titleEn: 'Neon Future Expressway (Cyber Chiptune)',
    descTh: 'ยูโรบีตชิปจูนความเร็วสูง บินสู่ยุค Mach 5 สนุกเร้าใจเต็มพิกัด',
    descEn: 'High-energy Mach 5 supersonic synthwave with driving 16th-note pulse',
    genre: 'Cyber Chiptune / Eurobeat',
    score: NEON_EXPRESSWAY_SCORE,
  },
];
