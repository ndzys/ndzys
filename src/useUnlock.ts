import { animate, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { easeInOutQuint } from './motion';

export type Phase = 'locked' | 'loading' | 'unlocked';

const UNLOCK_DURATION = 2.6;
const SETTLE_MS = 450;

export const wobble = (p: number) => p + Math.sin(p * Math.PI * 3) * 0.035 * (1 - p);

export function useUnlock() {
  const [phase, setPhase] = useState<Phase>('locked');
  const progress = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const settle = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    controls.current?.stop();
    window.clearTimeout(settle.current);
  }, []);

  useEffect(() => stop, [stop]);

  const unlock = useCallback(() => {
    if (phase !== 'locked') return;
    stop();
    if (reduceMotion) {
      progress.set(100);
      setPhase('unlocked');
      return;
    }
    progress.set(0);
    setPhase('loading');
    controls.current = animate(0, 1, {
      duration: UNLOCK_DURATION,
      ease: 'linear',
      onUpdate: (p) => progress.set(Math.min(100, Math.max(0, wobble(p) * 100))),
      onComplete: () => {
        settle.current = window.setTimeout(() => setPhase('unlocked'), SETTLE_MS);
      },
    });
  }, [phase, progress, reduceMotion, stop]);

  const reveal = useCallback(() => {
    stop();
    progress.set(100);
    setPhase('unlocked');
  }, [progress, stop]);

  const lock = useCallback(() => {
    stop();
    setPhase('locked');
    controls.current = animate(progress, 0, {
      duration: reduceMotion ? 0 : 0.9,
      ease: easeInOutQuint,
    });
  }, [progress, reduceMotion, stop]);

  return { phase, progress, unlock, reveal, lock };
}
