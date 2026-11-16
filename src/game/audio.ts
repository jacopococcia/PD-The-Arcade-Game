class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

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
    this.tone(240, 560, 0.14, 'square', 0.08);
  }

  public playAwningBounce(): void {
    this.tone(200, 780, 0.22, 'triangle', 0.15);
    this.tone(360, 920, 0.18, 'sine', 0.1, 0.04);
  }

  public playCocktail(combo: number): void {
    const semitoneBoost = Math.min(combo - 1, 8);
    const base = 523.25 * Math.pow(2, semitoneBoost / 12);
    this.tone(base, base * 1.25, 0.09, 'sine', 0.14, 0);
    this.tone(base * 1.5, base * 1.5, 0.14, 'triangle', 0.12, 0.055);
  }

  public playPowerup(): void {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.tone(n, n, 0.11, 'triangle', 0.13, idx * 0.055);
    });
  }

  public playBrickBump(): void {
    this.tone(170, 95, 0.08, 'square', 0.09);
  }

  public playStomp(): void {
    this.tone(280, 90, 0.11, 'sawtooth', 0.13);
    this.tone(420, 620, 0.1, 'triangle', 0.1, 0.04);
  }

  public playWindup(): void {
    this.tone(320, 510, 0.14, 'sawtooth', 0.06);
  }

  public playHit(): void {
    this.tone(190, 65, 0.24, 'sawtooth', 0.15);
    this.tone(130, 55, 0.28, 'square', 0.09, 0.03);
  }

  public playGoalLocked(): void {
    this.tone(300, 240, 0.12, 'triangle', 0.1);
  }

  public playLevelClear(): void {
    const melody = [523.25, 659.25, 783.99, 1046.5];
    melody.forEach((n, i) => {
      this.tone(n, n, 0.16, 'triangle', 0.15, i * 0.09);
    });
  }

  public playVictory(): void {
    const melody = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5, 1318.5];
    melody.forEach((n, i) => {
      this.tone(n, n, i === melody.length - 1 ? 0.45 : 0.14, 'triangle', 0.16, i * 0.095);
    });
  }

  public playGameOver(): void {
    const melody = [392.0, 349.23, 311.13, 261.63];
    melody.forEach((n, i) => {
      this.tone(n, n * 0.96, 0.22, 'sawtooth', 0.1, i * 0.16);
    });
  }
}

export const audioEngine = new AudioEngine();
