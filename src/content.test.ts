import { describe, expect, it } from 'vitest';
import { logLinesAt, profile, unlockLog } from './content';

describe('unlock log', () => {
  it('is ordered by threshold and ends at full unlock', () => {
    const thresholds = unlockLog.map((l) => l.at);
    expect(thresholds).toEqual([...thresholds].sort((a, b) => a - b));
    expect(thresholds.at(-1)).toBeLessThanOrEqual(100);
  });

  it.each([
    [0, 0],
    [3.9, 0],
    [4, 1],
    [51, 3],
    [52, 4],
    [100, unlockLog.length],
  ])('shows the right number of lines at %s%%', (progress, lines) => {
    expect(logLinesAt(progress)).toBe(lines);
  });
});

describe('profile', () => {
  it('links to the real contact channels', () => {
    expect(profile.email).toBe('nazardzys@gmail.com');
    expect(profile.github).toBe('https://github.com/ndzys');
    expect(profile.phone.href).toMatch(/^tel:\+48\d{9}$/);
  });

  it('ships the CV from the site root', () => {
    expect(profile.cvUrl).toBe('/nazar-dzys-cv.pdf');
  });
});
