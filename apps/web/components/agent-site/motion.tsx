'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  animate, motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue,
} from 'framer-motion';

/**
 * Motion building blocks for agent-site templates. Every piece respects
 * prefers-reduced-motion: content still appears, it just doesn't move.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise + un-blur as it enters the viewport. */
export function Reveal({
  children, delay = 0, y = 24, blur = true, className, as = 'div',
}: { children: ReactNode; delay?: number; y?: number; blur?: boolean; className?: string; as?: 'div' | 'section' | 'li' }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  if (reduce) return <M className={className}>{children}</M>;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}

/** Reveals each child in turn. */
export function Stagger({ children, className, step = 0.08 }: { children: ReactNode; className?: string; step?: number }) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <Reveal key={i} delay={Math.min(i, 8) * step}>{child}</Reveal>
      ))}
    </div>
  );
}

function Word({ word, progress, range, dim }: { word: string; progress: MotionValue<number>; range: [number, number]; dim: number }) {
  const opacity = useTransform(progress, range, [dim, 1]);
  return <motion.span style={{ opacity }} className="inline-block whitespace-pre">{word} </motion.span>;
}

/** A statement that fills in word by word as it scrolls through the screen. */
export function WordReveal({ text, className, dim = 0.18 }: { text: string; className?: string; dim?: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(/\s+/).filter(Boolean);
  if (reduce) return <p ref={ref} className={className}>{text}</p>;
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} dim={dim} />
      ))}
    </p>
  );
}

/** Counts up from zero the first time it is seen. */
export function CountUp({ value, decimals = 0, suffix = '', prefix = '', duration = 1.6, className }: {
  value: number; decimals?: number; suffix?: string; prefix?: string; duration?: number; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView || reduce) { if (reduce) setN(value); return; }
    const c = animate(0, value, { duration, ease: EASE, onUpdate: setN });
    return () => c.stop();
  }, [inView, value, duration, reduce]);
  return (
    <span ref={ref} className={className}>
      {prefix}{n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

/** An endless horizontal strip. Pauses on hover; static when motion is reduced. */
export function Marquee({ children, speed = 40, reverse = false, className }: {
  children: ReactNode; speed?: number; reverse?: boolean; className?: string;
}) {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  if (reduce) return <div className={`flex flex-wrap gap-6 ${className ?? ''}`}>{children}</div>;
  return (
    <div
      className={`relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className ?? ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="flex w-max gap-10"
        animate={paused ? undefined : { x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
      >
        <div className="flex shrink-0 gap-10">{children}</div>
        <div className="flex shrink-0 gap-10" aria-hidden>{children}</div>
      </motion.div>
    </div>
  );
}

/** Advances an index on a timer, with pause/resume. */
export function useAutoplay(length: number, ms = 5000) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  useEffect(() => {
    if (!playing || length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % length), ms);
    return () => clearTimeout(t);
  }, [index, playing, length, ms]);
  return {
    index,
    playing,
    go: (i: number) => setIndex(((i % length) + length) % length),
    next: () => setIndex((i) => (i + 1) % length),
    prev: () => setIndex((i) => (i - 1 + length) % length),
    toggle: () => setPlaying((p) => !p),
  };
}

/** Local time in the agent's city, ticking. Renders nothing until mounted (no hydration mismatch). */
export function LiveClock({ timeZone = 'Africa/Nairobi', className }: { timeZone?: string; className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <span className={className}>&nbsp;</span>;
  return (
    <span className={className}>
      {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone })}
    </span>
  );
}

/** Slow zoom-out on load, for full-bleed hero photos. */
export function KenBurns({ src, className }: { src: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.img
      src={src}
      alt=""
      className={className}
      initial={reduce ? false : { scale: 1.12 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.4, ease: EASE }}
    />
  );
}

export { motion, EASE };
