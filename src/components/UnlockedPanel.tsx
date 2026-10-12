import { motion, type Variants } from 'motion/react';
import type { Ref } from 'react';
import { profile } from '../content';
import { easeOutExpo } from '../motion';

/** Hides instantly, reveals with a per-item delay (ms) passed through `custom`. */
const item: Variants = {
  hidden: { opacity: 0, y: 16, transition: { duration: 0 } },
  shown: (delayMs: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easeOutExpo, delay: delayMs / 1000 },
  }),
};

const nameLine: Variants = {
  hidden: { opacity: 0, y: 28, transition: { duration: 0 } },
  shown: (delayMs: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: easeOutExpo, delay: delayMs / 1000 },
  }),
};

const lift = { y: -2, transition: { duration: 0.25, ease: 'easeOut' } } as const;

type Props = { shown: boolean; headingRef: Ref<HTMLHeadingElement> };

export function UnlockedPanel({ shown, headingRef }: Props) {
  return (
    <motion.div
      className="panel"
      inert={!shown}
      style={{ visibility: shown ? 'visible' : 'hidden' }}
      initial="hidden"
      animate={shown ? 'shown' : 'hidden'}
    >
      <motion.p className="eyebrow" variants={item} custom={500}>
        {profile.role} · {profile.stack}
      </motion.p>

      <h1 className="name" ref={headingRef} tabIndex={-1}>
        <motion.span className="name__line" variants={nameLine} custom={600}>
          {profile.firstName}
        </motion.span>
        <motion.span className="name__line serif" variants={nameLine} custom={700}>
          {profile.lastName}
        </motion.span>
      </h1>

      <motion.p className="bio" variants={item} custom={750}>
        {profile.bio}
      </motion.p>
      <motion.p className="location" variants={item} custom={820}>
        {profile.location}
      </motion.p>

      <motion.div className="actions" variants={item} custom={900}>
        {profile.cvUrl && (
          <motion.a className="btn btn--primary" href={profile.cvUrl} download whileHover={lift} whileTap={{ scale: 0.97 }}>
            Download CV ↓
          </motion.a>
        )}
        <motion.a className="btn btn--outline" href={`mailto:${profile.email}`} whileHover={lift} whileTap={{ scale: 0.97 }}>
          {profile.email}
        </motion.a>
      </motion.div>

      <motion.ul className="contacts" variants={item} custom={980}>
        <li>
          <a href={profile.phone.href}>{profile.phone.label}</a>
        </li>
        <li>
          <a href={profile.github} target="_blank" rel="noopener noreferrer">
            GitHub ↗
          </a>
        </li>
      </motion.ul>
    </motion.div>
  );
}
