import { describe, expect, it } from 'vitest';
import { APP_NAME } from '../src/app-info';

describe('scaffold', () => {
  it('exposes the app name', () => {
    expect(APP_NAME).toBe('Subway Runner');
  });
});
