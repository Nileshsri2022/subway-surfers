import { describe, expect, it } from 'vitest';
import { InputBuffer } from '../src/game/input';

describe('InputBuffer', () => {
  it('returns the newest buffered action within 150 ms', () => {
    const b = new InputBuffer();
    b.push('left', 1000);
    expect(b.consume(1100)).toBe('left');
    expect(b.consume(1200)).toBeNull();
  });
  it('drops stale actions', () => {
    const b = new InputBuffer();
    b.push('jump', 0);
    expect(b.consume(151)).toBeNull();
  });
});