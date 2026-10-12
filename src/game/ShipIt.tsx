import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import portraitUrl from '../assets/portrait-400.webp';
import { easeOutExpo } from '../motion';
import { HEIGHT, createGame, jump, releaseJump, restart, score, start, step } from './engine';
import { applyEvents, createFx, draw, updateFx } from './render';
import { readBest, writeBest } from './storage';

const JUMP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W']);

export default function ShipIt({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const image = new Image();
    image.src = portraitUrl;
    const game = createGame(720);
    const fx = createFx();
    let best = readBest();
    const touch = window.matchMedia('(pointer: coarse)').matches;
    let scale = 1;
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      scale = (height * dpr) / HEIGHT;
      game.width = (width / height) * HEIGHT;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const press = () => {
      if (game.status === 'ready') start(game);
      else if (game.status === 'running') jump(game);
      else if (game.time - game.overAt > 0.5) restart(game);
    };
    const release = () => releaseJump(game);

    const onKeyDown = (e: KeyboardEvent) => {
      if (!JUMP_KEYS.has(e.key) || (e.target instanceof Element && e.target.closest('button'))) return;
      e.preventDefault();
      if (!e.repeat) press();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (JUMP_KEYS.has(e.key)) release();
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      press();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(game, dt);
      if (game.events.length) {
        applyEvents(fx, game, game.events);
        if (game.events.some((e) => e.type === 'crash') && score(game) > best) {
          best = score(game);
          writeBest(best);
        }
        game.events.length = 0;
      }
      updateFx(fx, game, dt);
      draw(ctx, game, fx, { scale, image, best, touch });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', release);
    };
  }, []);

  return (
    <motion.div
      className="game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        className="game__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-title"
        tabIndex={-1}
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2 } }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
      >
        <div className="game__bar">
          <h2 id="game-title" className="game__title">
            Ship it!
          </h2>
          <span className="game__hint">space / tap to jump · esc to close</span>
          <button type="button" className="game__close" onClick={onClose} aria-label="Close game">
            ✕
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="game__canvas"
          role="img"
          aria-label="Runner game: jump over blockers and collect snacks to ship code"
        />
      </motion.div>
    </motion.div>
  );
}
