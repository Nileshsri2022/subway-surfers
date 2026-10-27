export type SoundName = 'coin' | 'jump' | 'roll' | 'crash' | 'powerup' | 'click';

type Ctor = new () => AudioContext;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private muted: boolean;

  constructor() {
    this.muted = this.readMuted();
  }

  private readMuted(): boolean {
    try {
      const ls = (globalThis as { localStorage?: Storage }).localStorage;
      return ls?.getItem('subway-runner.muted') === '1';
    } catch {
      return false;
    }
  }

  private persistMuted(): void {
    try {
      const ls = (globalThis as { localStorage?: Storage }).localStorage;
      ls?.setItem('subway-runner.muted', this.muted ? '1' : '0');
    } catch {
      // ignore
    }
  }

  unlock(): void {
    if (this.unlocked) return;
    if (!this.ctx) {
      const Ctor = (globalThis as { AudioContext?: Ctor }).AudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        this.ctx = null;
        return;
      }
    }
    this.unlocked = true;
    try {
      void this.ctx.resume();
    } catch {
      // ignore
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.persistMuted();
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(name: SoundName): void {
    if (!this.unlocked || this.muted) return;
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      // simple per-sound envelopes
      const freqs: Record<SoundName, number> = {
        coin: 880,
        jump: 440,
        roll: 220,
        crash: 110,
        powerup: 660,
        click: 520,
      };
      const dur: Record<SoundName, number> = {
        coin: 0.08,
        jump: 0.12,
        roll: 0.15,
        crash: 0.3,
        powerup: 0.18,
        click: 0.05,
      };
      osc.frequency.value = freqs[name];
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur[name]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur[name]);
    } catch {
      // ignore
    }
  }
}