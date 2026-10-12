import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { LockedPanel } from './components/LockedPanel';
import { Portrait } from './components/Portrait';
import { UnlockedPanel } from './components/UnlockedPanel';
import { profile } from './content';
import { loadGame } from './game/load';
import { rise } from './motion';
import { useKonami } from './useKonami';
import { useUnlock, type Phase } from './useUnlock';

const ShipIt = lazy(loadGame);
const UNLOCKED_HASH = '#unlocked';

export function App() {
  const { phase, progress, unlock, reveal, lock } = useUnlock();
  const unlockRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const prevPhase = useRef<Phase>(phase);
  const [playing, setPlaying] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const openGame = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setPlaying(true);
  }, []);

  const closeGame = useCallback(() => {
    setPlaying(false);
    returnFocus.current?.focus({ preventScroll: true });
  }, []);

  useKonami(openGame);

  useEffect(() => {
    const syncFromUrl = () => {
      if (window.location.hash === UNLOCKED_HASH) reveal();
    };
    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    return () => window.removeEventListener('hashchange', syncFromUrl);
  }, [reveal]);

  useEffect(() => {
    const { hash, pathname, search } = window.location;
    if (phase === 'unlocked' && hash !== UNLOCKED_HASH) window.history.replaceState(null, '', UNLOCKED_HASH);
    if (phase === 'locked' && hash === UNLOCKED_HASH) window.history.replaceState(null, '', pathname + search);
  }, [phase]);

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
              <UnlockedPanel shown={phase === 'unlocked'} headingRef={nameRef} onPlay={openGame} />
            </div>
          </div>
        </main>

        <motion.footer className="footer" {...rise(800)}>
          <span suppressHydrationWarning>© {new Date().getFullYear()} {profile.name}</span>
          <span>Built with React, TypeScript & Motion</span>
        </motion.footer>

        <AnimatePresence>
          {playing && (
            <Suspense key="game" fallback={null}>
              <ShipIt onClose={closeGame} />
            </Suspense>
          )}
        </AnimatePresence>

        <p className="sr-only" aria-live="polite">
          {phase === 'unlocked' ? 'Profile unlocked' : ''}
        </p>
      </div>
    </MotionConfig>
  );
}
