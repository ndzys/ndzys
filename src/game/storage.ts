const KEY = 'ship-it:best';

export function readBest() {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function writeBest(value: number) {
  try {
    localStorage.setItem(KEY, String(value));
  } catch {
    // Storage can be unavailable (private mode); the record just won't persist.
  }
}
