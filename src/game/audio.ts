interface ParsedTrack {
  title: string;
  stepDuration: number;
  steps: number;
  lead: (string | null)[];
  harmony: (string | null)[];
  bass: (string | null)[];
  drums: (string | null)[];
}

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

function noteToFreq(token: string): number {
  const match = /^([A-G](?:#|b)?)(-?\d)$/.exec(token.trim());
  if (!match) return 440;
  const [, name, octStr] = match;
  const semi = NOTE_INDEX[name] ?? 0;
  const octave = parseInt(octStr, 10);
  const midi = (octave + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function parseBars(bars: string[]): (string | null)[] {
  const tokens: (string | null)[] = [];
  for (const bar of bars) {
    const parts = bar.trim().split(/\s+/);
    for (const part of parts) {
      if (!part || part === '.') {
        tokens.push(null);
      } else {
        tokens.push(part);
      }
    }
  }
  return tokens;
}

function repeatBar(bar: string, times: number): string[] {
  return Array.from({ length: times }, () => bar);
}

// =============================================================================
// 4 CANZONI RETRO 8-BIT ISPIRATE ALLO STILE FOLK-COMICO DI 'NDUCCIO
// =============================================================================
const LEVEL_TRACKS: ParsedTrack[] = [
  // LIVELLO 1: PIAZZA ROMA — Saltarello abruzzese allegro in Do maggiore (6/8)
  {
    title: 'Saltarello di Piazza Roma',
    stepDuration: 0.09,
    steps: 96,
    lead: parseBars([
      'E5 . G5 E5 C5 . G4 A4 B4 C5 D5 E5',
      'F5 . D5 B4 G4 . D5 . B4 G4 B4 D5',
      'E5 . G5 E5 C5 . C5 D5 E5 G5 A5 G5',
      'F5 E5 D5 C5 B4 A4 G4 . . C5 . .',
      'A5 . F5 C5 A4 . C5 D5 E5 F5 G5 A5',
      'G5 . E5 C5 G4 . E5 . C5 G4 C5 E5',
      'D5 . F5 D5 B4 G4 A4 B4 C5 D5 E5 F5',
      'G5 E5 C5 G4 E5 D5 C5 - . C5 . .',
    ]),
    harmony: parseBars([
      '. . E4+G4 . E4+G4 . . . E4+G4 . E4+G4 .',
      '. . D4+F4 . D4+F4 . . . D4+F4 . D4+F4 .',
      '. . E4+G4 . E4+G4 . . . E4+G4 . E4+G4 .',
      '. . D4+F4 . D4+F4 . . . E4+G4 . . .',
      '. . F4+A4 . F4+A4 . . . F4+A4 . F4+A4 .',
      '. . E4+G4 . E4+G4 . . . E4+G4 . E4+G4 .',
      '. . D4+F4 . D4+F4 . . . D4+F4 . D4+F4 .',
      '. . E4+G4 . D4+F4 . . . E4+G4 . . .',
    ]),
    bass: parseBars([
      'C3 . . . . . G2 . . . . .',
      'G2 . . . . . D3 . . . . .',
      'C3 . . . . . G2 . . . . .',
      'G2 . . . . . C3 . . G2 . .',
      'F2 . . . . . C3 . . . . .',
      'C3 . . . . . G2 . . . . .',
      'G2 . . . . . D3 . . . . .',
      'C3 . . G2 . . C3 . . . . .',
    ]),
    drums: parseBars([
      ...repeatBar('K . H . S . K . H . S .', 7),
      'K . H . S . K . S S K .',
    ]),
  },

  // LIVELLO 2: LE PIANE — Polka campagnola di "Lu Trattore" in Sol maggiore (2/4)
  {
    title: 'Polka di Lu Trattore',
    stepDuration: 0.115,
    steps: 128,
    lead: parseBars([
      'B4 D5 G5 D5 B4 G4 B4 D5',
      'C5 A4 F#4 A4 D5 C5 B4 A4',
      'G4 B4 D5 G5 F#5 G5 A5 G5',
      'F#5 D5 C5 A4 D5 . D5 .',
      'B4 D5 G5 D5 B4 G4 B4 D5',
      'C5 A4 F#4 A4 D5 C5 B4 A4',
      'G4 B4 D5 G5 A5 G5 F#5 E5',
      'D5 F#5 A5 F#5 G5 . G4 .',
      'E5 G5 C6 G5 E5 C5 E5 G5',
      'D5 G5 B5 G5 D5 B4 D5 G5',
      'F#5 A5 C6 A5 F#5 D5 E5 F#5',
      'G5 B5 D6 B5 G5 . D5 .',
      'E5 G5 C6 G5 E5 C5 E5 G5',
      'D5 G5 B5 G5 D5 B4 D5 G5',
      'A5 F#5 D5 C5 B4 A4 G4 F#4',
      'G4 B4 D5 G5 G5 . . .',
    ]),
    harmony: parseBars([
      '. . B3+D4 . . . B3+D4 .',
      '. . C4+F#4 . . . C4+F#4 .',
      '. . B3+D4 . . . B3+D4 .',
      '. . C4+F#4 . . . C4+F#4 .',
      '. . B3+D4 . . . B3+D4 .',
      '. . C4+F#4 . . . C4+F#4 .',
      '. . B3+D4 . . . B3+D4 .',
      '. . C4+F#4 . . . B3+D4 .',
      '. . E4+G4 . . . E4+G4 .',
      '. . B3+D4 . . . B3+D4 .',
      '. . C4+F#4 . . . C4+F#4 .',
      '. . B3+D4 . . . B3+D4 .',
      '. . E4+G4 . . . E4+G4 .',
      '. . B3+D4 . . . B3+D4 .',
      '. . C4+F#4 . . . C4+F#4 .',
      '. . B3+D4 . . . B3+D4 .',
    ]),
    bass: parseBars([
      'G2 . . . D3 . . .',
      'D2 . . . A2 . . .',
      'G2 . . . D3 . . .',
      'D2 . . . A2 . . .',
      'G2 . . . D3 . . .',
      'D2 . . . A2 . . .',
      'G2 . . . D3 . . .',
      'D2 . . . G2 . . .',
      'C3 . . . G2 . . .',
      'G2 . . . D3 . . .',
      'D2 . . . A2 . . .',
      'G2 . . . D3 . . .',
      'C3 . . . G2 . . .',
      'G2 . . . D3 . . .',
      'D2 . . . A2 . . .',
      'G2 . D2 . G2 . . .',
    ]),
    drums: parseBars([
      ...repeatBar('K . S . K . S H', 7),
      'K . S . K S K .',
      ...repeatBar('K . S . K . S H', 7),
      'K . S . K S K .',
    ]),
  },

  // LIVELLO 3: COLLEMICI & RANCO — Tarantella scatenata da campo sportivo in Re minore (6/8)
  {
    title: 'Tarantella dello Stadio',
    stepDuration: 0.084,
    steps: 96,
    lead: parseBars([
      'D5 . F5 A5 . F5 D5 E5 F5 G5 A5 G5',
      'E5 . G5 Bb5 . G5 E5 . C#5 A4 C#5 E5',
      'D5 . F5 A5 . F5 D5 F5 A5 D6 C6 Bb5',
      'A5 G5 F5 E5 D5 C#5 D5 - . A4 . .',
      'F5 . A5 C6 . A5 F5 G5 A5 Bb5 C6 A5',
      'G5 . Bb5 E5 . G5 C5 D5 E5 F5 G5 E5',
      'D5 E5 F5 G5 A5 Bb5 A5 G5 F5 E5 D5 C#5',
      'D5 . A4 . F4 . D5 . . D5 . .',
    ]),
    harmony: parseBars([
      '. . F4+A4 . F4+A4 . . . F4+A4 . F4+A4 .',
      '. . E4+G4 . E4+G4 . . . C#4+G4 . C#4+G4 .',
      '. . F4+A4 . F4+A4 . . . F4+A4 . F4+A4 .',
      '. . E4+G4 . E4+G4 . . . F4+A4 . . .',
      '. . A4+C5 . A4+C5 . . . A4+C5 . A4+C5 .',
      '. . E4+Bb4 . E4+Bb4 . . . E4+Bb4 . E4+Bb4 .',
      '. . F4+A4 . F4+A4 . . . C#4+G4 . C#4+G4 .',
      '. . F4+A4 . C#4+G4 . . . F4+A4 . . .',
    ]),
    bass: parseBars([
      'D3 . . . . . A2 . . . . .',
      'A2 . . . . . E3 . . . . .',
      'D3 . . . . . A2 . . . . .',
      'A2 . . . . . D3 . . A2 . .',
      'F2 . . . . . C3 . . . . .',
      'C3 . . . . . G2 . . . . .',
      'D3 . . . . . A2 . . . . .',
      'D3 . . A2 . . D3 . . . . .',
    ]),
    drums: parseBars([
      ...repeatBar('K . H S . H K . H S . H', 7),
      'K . H S . H K S S K . .',
    ]),
  },

  // LIVELLO 4: NOTTE DELLA SAGRA — Marcetta folk-punk della Notte del Giudizio in La minore
  {
    title: 'Marcetta della Notte del Giudizio',
    stepDuration: 0.095,
    steps: 128,
    lead: parseBars([
      'A4 C5 E5 A5 E5 C5 A4 E5',
      'G#4 B4 E5 G#5 E5 D5 C5 B4',
      'A4 C5 E5 A5 B5 A5 G#5 A5',
      'E5 F5 E5 D#5 E5 . E4 .',
      'D5 F5 A5 F5 D5 F5 A5 D6',
      'C6 A5 E5 C5 A4 C5 E5 A5',
      'B5 G#5 E5 D5 C5 B4 G#4 B4',
      'A4 . E5 . A5 . . .',
      'F5 A5 C6 A5 F5 C5 F5 A5',
      'E5 G5 C6 G5 E5 C5 E5 G5',
      'D5 F5 A5 F5 D5 E5 F5 G5',
      'G#5 . E5 . B4 . E5 .',
      'A5 G5 F5 E5 D5 C5 B4 A4',
      'D5 F5 A5 F5 D5 C5 B4 A4',
      'G#4 B4 D5 F5 E5 D5 C5 B4',
      'A4 C5 E5 A5 A4 . . .',
    ]),
    harmony: parseBars([
      '. C4+E4 . . . C4+E4 . .',
      '. D4+G#4 . . . D4+G#4 . .',
      '. C4+E4 . . . C4+E4 . .',
      '. D4+G#4 . . . D4+G#4 . .',
      '. D4+F4 . . . D4+F4 . .',
      '. C4+E4 . . . C4+E4 . .',
      '. D4+G#4 . . . D4+G#4 . .',
      '. C4+E4 . . . C4+E4 . .',
      '. C4+A4 . . . C4+A4 . .',
      '. E4+G4 . . . E4+G4 . .',
      '. D4+F4 . . . D4+F4 . .',
      '. D4+G#4 . . . D4+G#4 . .',
      '. C4+E4 . . . C4+E4 . .',
      '. D4+F4 . . . D4+F4 . .',
      '. D4+G#4 . . . D4+G#4 . .',
      '. C4+E4 . . . C4+E4 . .',
    ]),
    bass: parseBars([
      'A2 . A3 . E2 . E3 .',
      'E2 . E3 . B2 . E3 .',
      'A2 . A3 . E2 . E3 .',
      'E2 . E3 . B2 . E2 .',
      'D2 . D3 . A2 . D3 .',
      'A2 . A3 . E2 . A2 .',
      'E2 . E3 . B2 . E3 .',
      'A2 . E2 . A2 . . .',
      'F2 . F3 . C3 . F3 .',
      'C3 . C4 . G2 . C3 .',
      'D2 . D3 . A2 . D3 .',
      'E2 . E3 . B2 . E3 .',
      'A2 . A3 . E2 . A2 .',
      'D2 . D3 . A2 . D3 .',
      'E2 . E3 . B2 . E3 .',
      'A2 . E2 . A2 . . .',
    ]),
    drums: parseBars([
      ...repeatBar('K H S H K K S H', 7),
      'K S K S K S K .',
      ...repeatBar('K H S H K K S H', 3),
      'K S K S K S K .',
      ...repeatBar('K H S H K K S H', 3),
      'K S K S K S K .',
    ]),
  },
];

export function getLevelTrackTitle(levelIndex: number): string {
  const track = LEVEL_TRACKS[levelIndex % LEVEL_TRACKS.length];
  return track ? track.title : LEVEL_TRACKS[0].title;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  // Chiptune BGM state
  private musicGain: GainNode | null = null;
  private leadFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private schedulerId: number | null = null;
  private activeLevelIndex: number | null = null;
  private musicShouldPlay = false;
  private currentStep = 0;
  private nextStepTime = 0;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.muted) {
      this.haltScheduler();
    } else if (this.musicShouldPlay && this.activeLevelIndex !== null) {
      this.beginScheduler(this.activeLevelIndex);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private ensureMusicBus(ctx: AudioContext): { musicGain: GainNode; leadFilter: BiquadFilterNode } {
    if (!this.musicGain) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.42, ctx.currentTime);
      gain.connect(ctx.destination);
      this.musicGain = gain;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2900, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);
      filter.connect(gain);
      this.leadFilter = filter;
    }
    return {
      musicGain: this.musicGain,
      leadFilter: this.leadFilter!,
    };
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      const length = Math.floor(ctx.sampleRate * 0.4);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  // ===========================================================================
  // SEQUENCER MUSICA 8-BIT
  // ===========================================================================
  public playMusic(levelIndex: number): void {
    const normalized = Math.max(0, levelIndex) % LEVEL_TRACKS.length;
    const isSameTrack = this.activeLevelIndex === normalized;
    this.activeLevelIndex = normalized;
    this.musicShouldPlay = true;

    if (this.muted) {
      this.haltScheduler();
      return;
    }

    if (isSameTrack && this.schedulerId !== null) {
      return;
    }

    this.currentStep = 0;
    this.beginScheduler(normalized);
  }

  public stopMusic(): void {
    this.musicShouldPlay = false;
    this.haltScheduler();
  }

  private haltScheduler(): void {
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
        const oldGain = this.musicGain;
        const oldFilter = this.leadFilter;
        window.setTimeout(() => {
          oldGain.disconnect();
          oldFilter?.disconnect();
        }, 60);
      } catch {
        // Ignore teardown issues
      }
      this.musicGain = null;
      this.leadFilter = null;
    }
  }

  private beginScheduler(levelIndex: number): void {
    this.haltScheduler();
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.ensureMusicBus(ctx);
    const track = LEVEL_TRACKS[levelIndex] ?? LEVEL_TRACKS[0];
    this.nextStepTime = ctx.currentTime + 0.04;

    const scheduleAheadTime = 0.14;
    const tick = () => {
      if (this.muted || !this.musicShouldPlay || !this.ctx || !this.musicGain) return;
      while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
        this.scheduleStep(this.ctx, track, this.currentStep, this.nextStepTime);
        this.nextStepTime += track.stepDuration;
        this.currentStep = (this.currentStep + 1) % track.steps;
      }
    };

    tick();
    this.schedulerId = window.setInterval(tick, 35);
  }

  private scheduleStep(
    ctx: AudioContext,
    track: ParsedTrack,
    step: number,
    time: number
  ): void {
    const { musicGain, leadFilter } = this.ensureMusicBus(ctx);
    const stepDur = track.stepDuration;

    // 1. Organetto 8-bit Lead (Square)
    const leadTok = track.lead[step];
    if (leadTok && leadTok !== '-') {
      let holdSteps = 1;
      for (let s = step + 1; s < track.steps && track.lead[s] === '-'; s++) {
        holdSteps += 1;
      }
      const dur = Math.max(0.055, holdSteps * stepDur * 0.84);
      const freq = noteToFreq(leadTok);
      this.playMusicOsc(ctx, leadFilter, freq, time, dur, 'square', 0.115);
    }

    // 2. Fisarmonica Chord Stabs ("pa-pa")
    const harmTok = track.harmony[step];
    if (harmTok && harmTok !== '-') {
      const notes = harmTok.split('+');
      const perNoteVol = 0.055 / Math.max(1, notes.length * 0.75);
      for (const n of notes) {
        this.playMusicOsc(ctx, leadFilter, noteToFreq(n), time, stepDur * 0.65, 'square', perNoteVol);
      }
    }

    // 3. Basso 8-bit NES Triangle ("zum")
    const bassTok = track.bass[step];
    if (bassTok && bassTok !== '-') {
      this.playMusicOsc(ctx, musicGain, noteToFreq(bassTok), time, stepDur * 1.45, 'triangle', 0.21);
    }

    // 4. Tamburello & Batteria 8-bit
    const drumTok = track.drums[step];
    if (drumTok === 'K') {
      this.playMusicKick(ctx, musicGain, time);
    } else if (drumTok === 'S') {
      this.playMusicSnare(ctx, musicGain, time);
    } else if (drumTok === 'H') {
      this.playMusicHat(ctx, musicGain, time);
    }
  }

  private playMusicOsc(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.015);
  }

  private playMusicKick(ctx: AudioContext, dest: AudioNode, time: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.075);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.085);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.095);
  }

  private playMusicSnare(ctx: AudioContext, dest: AudioNode, time: number): void {
    // Tamburello folk abruzzese (filtered noise + light wooden tap)
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.Q.setValueAtTime(1.1, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.085, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.065);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(time);
    src.stop(time + 0.075);
  }

  private playMusicHat(ctx: AudioContext, dest: AudioNode, time: number): void {
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5200, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.04, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.028);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(time);
    src.stop(time + 0.035);
  }

  // ===========================================================================
  // EFFETTI SONORI (SFX)
  // ===========================================================================
  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'triangle',
    volume = 0.14,
    delay = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump(): void {
    this.tone(240, 560, 0.14, 'square', 0.09);
  }

  public playAwningBounce(): void {
    this.tone(200, 780, 0.22, 'triangle', 0.16);
    this.tone(360, 920, 0.18, 'sine', 0.11, 0.04);
  }

  public playCocktail(combo: number): void {
    const semitoneBoost = Math.min(combo - 1, 8);
    const base = 523.25 * Math.pow(2, semitoneBoost / 12);
    this.tone(base, base * 1.25, 0.09, 'sine', 0.16, 0);
    this.tone(base * 1.5, base * 1.5, 0.14, 'triangle', 0.14, 0.055);
  }

  public playPowerup(): void {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.tone(n, n, 0.11, 'triangle', 0.14, idx * 0.055);
    });
  }

  public playBrickBump(): void {
    this.tone(170, 95, 0.08, 'square', 0.1);
  }

  public playStomp(): void {
    this.tone(280, 90, 0.11, 'sawtooth', 0.14);
    this.tone(420, 620, 0.1, 'triangle', 0.11, 0.04);
  }

  public playWindup(): void {
    this.tone(320, 510, 0.14, 'sawtooth', 0.07);
  }

  public playHit(): void {
    this.tone(190, 65, 0.24, 'sawtooth', 0.16);
    this.tone(130, 55, 0.28, 'square', 0.1, 0.03);
  }

  public playGoalLocked(): void {
    this.tone(300, 240, 0.12, 'triangle', 0.11);
  }

  public playLevelClear(): void {
    const melody = [523.25, 659.25, 783.99, 1046.5];
    melody.forEach((n, i) => {
      this.tone(n, n, 0.16, 'triangle', 0.16, i * 0.09);
    });
  }

  public playVictory(): void {
    const melody = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5, 1318.5];
    melody.forEach((n, i) => {
      this.tone(n, n, i === melody.length - 1 ? 0.45 : 0.14, 'triangle', 0.17, i * 0.095);
    });
  }

  public playGameOver(): void {
    const melody = [392.0, 349.23, 311.13, 261.63];
    melody.forEach((n, i) => {
      this.tone(n, n * 0.96, 0.22, 'sawtooth', 0.11, i * 0.16);
    });
  }
}

export const audioEngine = new AudioEngine();
