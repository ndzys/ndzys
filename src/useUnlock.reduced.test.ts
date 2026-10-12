import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUnlock } from './useUnlock';

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => true,
}));

describe('useUnlock with reduced motion', () => {
  it('skips the loading sequence', () => {
    const { result } = renderHook(() => useUnlock());
    act(() => result.current.unlock());
    expect(result.current.phase).toBe('unlocked');
    expect(result.current.progress.get()).toBe(100);
  });
});
