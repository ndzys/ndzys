import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKonami } from './useKonami';

const press = (...keys: string[]) => keys.forEach((key) => window.dispatchEvent(new KeyboardEvent('keydown', { key })));
const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

describe('useKonami', () => {
  it('fires on the full sequence, even after extra keys', () => {
    const onMatch = vi.fn();
    renderHook(() => useKonami(onMatch));
    press('ArrowUp', ...CODE.slice(0, -1), 'A');
    expect(onMatch).toHaveBeenCalledTimes(1);
  });

  it('ignores partial or wrong sequences', () => {
    const onMatch = vi.fn();
    renderHook(() => useKonami(onMatch));
    press(...CODE.slice(0, -1), 'x');
    expect(onMatch).not.toHaveBeenCalled();
  });
});
