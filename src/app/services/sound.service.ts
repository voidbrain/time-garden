import { Injectable, signal } from '@angular/core';

/** Tiny 8-bit sound synthesizer (WebAudio) — no assets, safe on the server. */
@Injectable({ providedIn: 'root' })
export class SoundService {
  readonly muted = signal(false);

  private ctx: AudioContext | null = null;

  toggleMute(): void {
    this.muted.set(!this.muted());
  }

  play(kind: 'step' | 'blip' | 'water' | 'magic' | 'dead' | 'win'): void {
    if (this.muted() || typeof window === 'undefined') return;
    try {
      this.ctx ??= new AudioContext();
      const now = this.ctx.currentTime;
      const notes: Record<typeof kind, number[]> = {
        step: [220],
        blip: [440],
        water: [660, 520],
        magic: [523, 659, 784, 1047],
        dead: [200, 150, 100],
        win: [523, 659, 784, 1047, 1319],
      };
      notes[kind].forEach((f, i) => this.beep(f, now + i * 0.09));
    } catch {
      /* audio unavailable — ignore */
    }
  }

  private beep(freq: number, at: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.13);
  }
}
