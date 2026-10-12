import { motion, useTransform, type MotionValue } from 'motion/react';
import type { Ref } from 'react';
import { easeOutExpo } from '../motion';

type Props = {
  loading: boolean;
  progress: MotionValue<number>;
  onUnlock: () => void;
  ref?: Ref<HTMLButtonElement>;
};

const labelSwap = { duration: 0.35, ease: easeOutExpo };

export function UnlockButton({ loading, progress, onUnlock, ref }: Props) {
  const fill = useTransform(progress, (v) => v / 100);
  const counter = useTransform(progress, (v) => `Unlocking… ${Math.round(v)}%`);

  return (
    <motion.button
      ref={ref}
      type="button"
      className="btn btn--primary btn--unlock"
      onClick={onUnlock}
      disabled={loading}
      aria-busy={loading}
      whileHover={loading ? undefined : { y: -2 }}
      whileTap={loading ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <motion.span
        className="btn__fill"
        aria-hidden="true"
        style={{ scaleX: fill }}
        initial={false}
        animate={{ opacity: loading ? 1 : 0 }}
        transition={{ duration: loading ? 0 : 0.3 }}
      />
      <span className="btn__labels">
        <motion.span
          aria-hidden={loading}
          initial={false}
          animate={loading ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
          transition={labelSwap}
        >
          Unlock full potential →
        </motion.span>
        <motion.span
          className="btn__counter"
          aria-hidden={!loading}
          initial={false}
          animate={loading ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={labelSwap}
        >
          {counter}
        </motion.span>
      </span>
    </motion.button>
  );
}
