// Keyboard and pointer input. Number keys 1-8 add ingredients, Space serves,
// Backspace (or 0) takes the last ingredient off, P pauses, Enter starts.
// Clicks land on bins, the plate, the serve and trash buttons, and the start
// and restart buttons. One-shot presses are queued as events and taken once
// by the loop, so a press between two frames is never lost or counted twice.

import { FIELD, INGREDIENTS, LAYOUT, binRect } from './config.js';

export const EVENT_CONFIRM = 'confirm';
export const EVENT_PAUSE = 'pause';
export const EVENT_SERVE = 'serve';
export const EVENT_TRASH = 'trash';

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Map a click in logical 1280x720 coordinates to a game event, or null. */
export function clickEvent(x, y, screen) {
  if (screen === 'title' && inside(LAYOUT.startButton, x, y)) return { type: EVENT_CONFIRM };
  if (screen === 'over' && inside(LAYOUT.restartButton, x, y)) return { type: EVENT_CONFIRM };
  if (screen !== 'play') return null;
  for (let index = 0; index < INGREDIENTS.length; index += 1) {
    if (inside(binRect(index), x, y)) return { type: 'add', id: INGREDIENTS[index].id };
  }
  if (inside(LAYOUT.serveButton, x, y)) return { type: EVENT_SERVE };
  if (inside(LAYOUT.trashButton, x, y)) return { type: EVENT_TRASH };
  if (inside(LAYOUT.plate, x, y)) return { type: 'plate' };
  return null;
}

export function createInput(canvas, getScreen) {
  let events = [];

  function push(event) {
    events.push(event);
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const digit = Number.parseInt(event.key, 10);
    if (digit >= 1 && digit <= 8) {
      push({ type: 'add', id: INGREDIENTS[digit - 1].id });
    } else if (event.code === 'Space') {
      const screen = getScreen();
      if (screen === 'title' || screen === 'over') push({ type: EVENT_CONFIRM });
      else if (screen === 'play') push({ type: EVENT_SERVE });
      event.preventDefault();
    } else if (event.code === 'Enter') {
      push({ type: EVENT_CONFIRM });
    } else if (event.code === 'Backspace' || event.key === '0') {
      push({ type: EVENT_TRASH });
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      push({ type: EVENT_PAUSE });
    } else {
      return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
    const y = ((event.clientY - rect.top) / rect.height) * FIELD.height;
    const found = clickEvent(x, y, getScreen());
    if (found) push(found);
  });

  return {
    /** The queued events since the last call, in order. */
    takeEvents() {
      const taken = events;
      events = [];
      return taken;
    },
  };
}
