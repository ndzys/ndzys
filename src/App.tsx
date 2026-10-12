import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useEffect, useRef } from 'react';
import { LockedPanel } from './components/LockedPanel';
import { Portrait } from './components/Portrait';
import { UnlockedPanel } from './components/UnlockedPanel';
import { profile } from './content';
import { rise } from './motion';
import { useUnlock, type Phase } from './useUnlock';

export function App() {
  const { phase, progress, unlock, reveal, lock } = useUnlock();
  const unlockRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const prevPhase = useRef<Phase>(phase);

  // `/#unlocked` opens the page with the profile already revealed. Read after hydration
  // so the prerendered HTML and the first client render match.
  useEffect(() => {
    if (window.location.hash === '#unlocked') reveal();
  }, [reveal]);

  // The control that had focus goes inert on each transition, so hand focus to the new view.
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = phase;
    if (prev === 'loading' && phase === 'unlocked') nameRef.current?.focus({ preventScroll: true });
    if (prev === 'unlocked' && phase === 'locked') unlockRef.current?.focus({ preventScroll: true });
  }, [phase]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="page" data-phase={phase}>
        <motion.header className="header" {...rise(100)}>
          <span className="header__name">{profile.name}</span>
          <div className="header__actions">
            <AnimatePresence>
              {phase === 'unlocked' && (
                <motion.button
                  key="lock"
                  type="button"
                  className="header__lock"
                  onClick={lock}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.6, duration: 0.5 } }}
                  exit={{ opacity: 0, x: 8, transition: { duration: 0.2 } }}
                >
                  ↺ Lock again
                </motion.button>
              )}
            </AnimatePresence>
            {profile.cvUrl && (
              <a className="header__cv" href={profile.cvUrl} download>
                Download CV ↓
              </a>
            )}
          </div>
        </motion.header>

        <main className="main">
          <div className="hero">
            <Portrait phase={phase} progress={progress} />
            <div className="panels">
              <LockedPanel phase={phase} progress={progress} onUnlock={unlock} buttonRef={unlockRef} />
              <UnlockedPanel shown={phase === 'unlocked'} headingRef={nameRef} />
            </div>
          </div>
        </main>

        <p className="sr-only" aria-live="polite">
          {phase === 'unlocked' ? 'Profile unlocked' : ''}
        </p>
      </div>
    </MotionConfig>
  );
}
