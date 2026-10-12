import type { Transition } from 'motion/react';

export const easeOutExpo = [0.19, 1, 0.22, 1] as const;
export const easeInOutQuint = [0.77, 0, 0.18, 1] as const;

/** Page-load rise used by every block on first paint. */
export const rise = (delayMs: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: easeOutExpo, delay: delayMs / 1000 } satisfies Transition,
});

/** Share of the portrait hidden while locked; the reveal runs from here to 0. */
export const LOCKED_CLIP = 54;
