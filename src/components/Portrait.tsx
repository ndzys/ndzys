import { motion, useTransform, type MotionValue } from 'motion/react';
import portrait760 from '../assets/portrait-760.webp';
import portrait1254 from '../assets/portrait-1254.webp';
import portraitTiny from '../assets/portrait-tiny.webp';
import { LOCKED_CLIP, rise } from '../motion';
import type { Phase } from '../useUnlock';
import { Shimmer } from './Shimmer';

type Props = { phase: Phase; progress: MotionValue<number> };

/** Hidden share of the photo (in %) for a given progress. */
const clipAt = (v: number) => LOCKED_CLIP * (1 - v / 100);

export function Portrait({ phase, progress }: Props) {
  const clipPath = useTransform(progress, (v) => `inset(0 0 ${clipAt(v).toFixed(2)}% 0)`);
  const scanY = useTransform(progress, (v) => `${(100 - clipAt(v)).toFixed(2)}%`);
  const badge = useTransform(progress, (v) => `portrait.png · ${Math.round(46 + v * 0.54)}%`);
  const loading = phase === 'loading';

  return (
    <motion.div className="portrait" {...rise(200)}>
      <div className="portrait__frame">
        <motion.div
          className="portrait__pending"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: phase === 'locked' ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Shimmer width="60%" />
          <Shimmer width="82%" />
          <Shimmer width="45%" />
          <span className="portrait__file">portrait.png · 46% loaded</span>
        </motion.div>

        <motion.img
          className="portrait__backdrop"
          src={portraitTiny}
          alt=""
          aria-hidden="true"
          initial={false}
          animate={{ opacity: loading ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />

        <motion.img
          className="portrait__photo"
          src={portrait760}
          srcSet={`${portrait760} 760w, ${portrait1254} 1254w`}
          sizes="(max-width: 640px) 70vw, 380px"
          alt="Portrait of Nazar Dzys"
          width={1254}
          height={1254}
          fetchPriority="high"
          style={{ clipPath }}
        />

        <motion.div
          className="portrait__scan-track"
          aria-hidden="true"
          style={{ y: scanY }}
          initial={false}
          animate={{ opacity: loading ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="portrait__scan" />
        </motion.div>

        <motion.span
          className="portrait__badge"
          aria-hidden="true"
          initial={false}
          animate={{ opacity: loading ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {badge}
        </motion.span>
      </div>
    </motion.div>
  );
}
