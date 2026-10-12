import { motion, useMotionValueEvent, useReducedMotion, type MotionValue } from 'motion/react';
import { useState } from 'react';
import { unlockLog } from '../content';
import { easeOutExpo } from '../motion';

const linesAt = (v: number) => unlockLog.filter((l) => v >= l.at).length;

type Props = { live: boolean; progress: MotionValue<number> };

/** Fake build log that prints a line each time progress crosses a threshold. */
export function Terminal({ live, progress }: Props) {
  const reduceMotion = useReducedMotion();
  const [count, setCount] = useState(() => linesAt(progress.get()));

  // Only follow progress while unlocking, so the log stays frozen while it fades out.
  useMotionValueEvent(progress, 'change', (v) => {
    if (live) setCount(linesAt(v));
  });

  return (
    <motion.div
      className="terminal"
      role="log"
      aria-label="Unlock progress"
      initial={{ opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
    >
      <div className="terminal__cmd">$ npm run unlock -- --candidate=nazar</div>
      {unlockLog.slice(0, count).map((line) => (
        <motion.div
          key={line.at}
          className="terminal__line"
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: easeOutExpo }}
        >
          <span className="terminal__ok">✓</span> {line.text}
        </motion.div>
      ))}
      <motion.span
        className="terminal__caret"
        aria-hidden="true"
        animate={reduceMotion ? undefined : { opacity: [1, 1, 0, 0] }}
        transition={{ duration: 1, times: [0, 0.5, 0.5, 1], ease: 'linear', repeat: Infinity }}
      />
    </motion.div>
  );
}
