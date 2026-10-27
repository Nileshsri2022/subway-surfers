import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from '../src/game/audio';

describe('AudioEngine', () => {
  let mockCtx: any;
  let store: Record<string, string> = {};
  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    });
    mockCtx = {
      createOscillator: vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { value: 0 } })),
      createGain: vi.fn(() => ({ connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } })),
      destination: {},
      currentTime: 0,
      resume: vi.fn(),
    };
    vi.stubGlobal('AudioContext', function () { return mockCtx; });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('play before unlock creates no oscillator', () => {
    const eng = new AudioEngine();
    eng.play('coin');
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('after unlock creates an oscillator', () => {
    const eng = new AudioEngine();
    eng.unlock();
    eng.play('coin');
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('mute persists and isMuted returns it', () => {
    const eng = new AudioEngine();
    eng.setMuted(true);
    expect(eng.isMuted()).toBe(true);
    const eng2 = new AudioEngine();
    expect(eng2.isMuted()).toBe(true);
  });
});