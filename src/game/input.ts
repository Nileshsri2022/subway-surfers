export type Action = 'left' | 'right' | 'jump' | 'roll';

const BUFFER_MS = 150;
const SWIPE_THRESHOLD = 24;

interface Buffered {
  action: Action;
  time: number;
}

export class InputBuffer {
  private current: Buffered | null = null;

  push(action: Action, now: number): void {
    this.current = { action, time: now };
  }

  consume(now: number): Action | null {
    if (!this.current) return null;
    const { action, time } = this.current;
    this.current = null;
    if (now - time > BUFFER_MS) return null;
    return action;
  }
}

const KEY_MAP: Record<string, Action> = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowUp: 'jump',
  w: 'jump',
  W: 'jump',
  ' ': 'jump',
  Space: 'jump',
  ArrowDown: 'roll',
  s: 'roll',
  S: 'roll',
  Shift: 'roll',
};

export function attachInput(element: HTMLElement, buffer: InputBuffer, now: () => number): () => void {
  element.style.touchAction = 'none';

  const keydown = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key];
    if (!action) return;
    e.preventDefault();
    buffer.push(action, now());
  };

  let startX = 0;
  let startY = 0;
  let tracking = false;

  const onPointerDown = (e: PointerEvent) => {
    tracking = true;
    startX = e.clientX;
    startY = e.clientY;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      buffer.push(dx > 0 ? 'right' : 'left', now());
    } else {
      buffer.push(dy < 0 ? 'jump' : 'roll', now());
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    tracking = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!tracking) return;
    tracking = false;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      buffer.push(dx > 0 ? 'right' : 'left', now());
    } else {
      buffer.push(dy < 0 ? 'jump' : 'roll', now());
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
  };

  window.addEventListener('keydown', keydown);
  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('touchstart', onTouchStart, { passive: false });
  element.addEventListener('touchend', onTouchEnd, { passive: false });
  element.addEventListener('touchmove', onTouchMove, { passive: false });

  return () => {
    window.removeEventListener('keydown', keydown);
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchmove', onTouchMove);
  };
}