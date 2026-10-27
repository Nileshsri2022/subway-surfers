import { afterEach, describe, expect, it, vi } from 'vitest';
import { addCoin, createScoreState, loadBestScore, saveBestScore, tickScore, totalScore } from '../src/game/score';

afterEach(() => vi.unstubAllGlobals());

describe('score', () => {
  it('adds distance and coins with the multiplier', () => {
    const s = createScoreState();
    tickScore(s, 100);
    addCoin(s);
    addCoin(s);
    s.multiplier = 2;
    expect(totalScore(s)).toBe(240);
  });

  it('persists only a higher best score', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v)
    });
    saveBestScore(50);
    saveBestScore(10);
    expect(loadBestScore()).toBe(50);
  });

  it('degrades when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied'); },
      setItem: () => { throw new Error('denied'); }
    });
    expect(loadBestScore()).toBe(0);
    expect(() => saveBestScore(99)).not.toThrow();
  });

  it('degrades when localStorage is absent entirely', () => {
    Reflect.deleteProperty(globalThis, 'localStorage');
    expect(loadBestScore()).toBe(0);
    expect(() => saveBestScore(99)).not.toThrow();
    expect(loadBestScore()).toBe(0);
  });
});
