import { AnimatePresence, motion, type MotionValue } from 'motion/react';
import type { Ref } from 'react';
import { profile } from '../content';
import { easeOutExpo, rise } from '../motion';
import type { Phase } from '../useUnlock';
import { Shimmer } from './Shimmer';
import { Terminal } from './Terminal';
import { UnlockButton } from './UnlockButton';

type Props = {
  phase: Phase;
  progress: MotionValue<number>;
  onUnlock: () => void;
  buttonRef: Ref<HTMLButtonElement>;
};

export function LockedPanel({ phase, progress, onUnlock, buttonRef }: Props) {
  const gone = phase === 'unlocked';

  return (
    <motion.div
      className="panel"
      // `inert` already removes it from focus and the a11y tree; avoiding Motion-driven
      // `visibility` keeps the unlock button focusable in the same commit it returns.
      inert={gone}
      style={{ pointerEvents: gone ? 'none' : undefined }}
      initial={false}
      animate={gone ? { opacity: 0, y: -16 } : { opacity: 1, y: 0 }}
      transition={{ opacity: { duration: 0.45, ease: 'easeOut' }, y: { duration: 0.6, ease: easeOutExpo } }}
    >
      <motion.p className="eyebrow" {...rise(350)}>
        {profile.role}
      </motion.p>
      <motion.h1 className="headline" {...rise(450)}>
        Hire me to unlock my <em className="serif">full potential</em>.
      </motion.h1>

      <motion.div className="status" {...rise(550)}>
        <AnimatePresence initial={false}>
          {phase === 'locked' ? (
            <motion.div
              key="skeleton"
              className="status__skeleton"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Shimmer width="100%" />
              <Shimmer width="88%" />
              <Shimmer width="64%" />
            </motion.div>
          ) : (
            <Terminal key="terminal" live={phase === 'loading'} progress={progress} />
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div className="cta-row" {...rise(650)}>
        <UnlockButton ref={buttonRef} loading={phase === 'loading'} progress={progress} onUnlock={onUnlock} />
        <span className="note">Free. No sign-up.</span>
      </motion.div>
    </motion.div>
  );
}
