import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUnlock, wobble } from './useUnlock';

describe('wobble', () => {
  it('starts at 0 and lands exactly on 1', () => {
    expect(wobble(0)).toBe(0);
    expect(wobble(1)).toBe(1);
  });

  it('stays close to linear progress', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      expect(Math.abs(wobble(p) - p)).toBeLessThanOrEqual(0.035);
    }
  });
});

describe('useUnlock', () => {
  it('starts locked with no progress', () => {
    const { result } = renderHook(() => useUnlock());
    expect(result.current.phase).toBe('locked');
    expect(result.current.progress.get()).toBe(0);
  });

  it('goes locked → loading → unlocked', async () => {
    const { result } = renderHook(() => useUnlock());

    act(() => result.current.unlock());
    expect(result.current.phase).toBe('loading');

    await waitFor(() => expect(result.current.phase).toBe('unlocked'));
    expect(result.current.progress.get()).toBe(100);
  });

  it('ignores unlock while already loading', () => {
    const { result } = renderHook(() => useUnlock());
    act(() => result.current.unlock());
    const progressDuringLoad = result.current.progress;
    act(() => result.current.unlock());
    expect(result.current.phase).toBe('loading');
    expect(result.current.progress).toBe(progressDuringLoad);
  });

  it('reveal jumps straight to unlocked', () => {
    const { result } = renderHook(() => useUnlock());
    act(() => result.current.reveal());
    expect(result.current.phase).toBe('unlocked');
    expect(result.current.progress.get()).toBe(100);
  });

  it('lock rewinds progress back to 0', async () => {
    const { result } = renderHook(() => useUnlock());
    act(() => result.current.reveal());
    act(() => result.current.lock());

    expect(result.current.phase).toBe('locked');
    await waitFor(() => expect(result.current.progress.get()).toBe(0));
  });
});
