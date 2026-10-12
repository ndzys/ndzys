import { motion, useReducedMotion } from 'motion/react';

export function Shimmer({ width }: { width: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      className="shimmer"
      style={{ width }}
      animate={reduceMotion ? undefined : { backgroundPosition: ['150% 0%', '-50% 0%'] }}
      transition={{ duration: 1.8, ease: 'linear', repeat: Infinity }}
    />
  );
}
