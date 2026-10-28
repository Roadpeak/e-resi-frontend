'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { BROWSE_RETURN_KEY } from '../marketplace/BrowseBreadcrumbs';

/**
 * "Back to all properties", shown only when the visitor actually came through
 * a browse page. The listing pages record their URL in sessionStorage as they
 * render; a property opened from a shared link lands in a tab with no such
 * record, so the control stays away and the page reads as its own front door.
 *
 * Kept out of the template's way: glass over the hero photograph, a plain
 * white pill once past it (the same pair of treatments as the floating chat
 * button), tucked away while scrolling down and back on scrolling up. On a
 * phone it is the arrow alone; the label shows on wider screens and on hover.
 */
export function BackToBrowse() {
  const [href, setHref] = useState<string | null>(null);
  const [overHero, setOverHero] = useState(true);
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    try {
      setHref(sessionStorage.getItem(BROWSE_RETURN_KEY));
    } catch {
      // No storage, no control.
    }
  }, []);

  useEffect(() => {
    if (!href) return;
    const onScroll = () => {
      const y = window.scrollY;
      setOverHero(y < window.innerHeight * 0.6);
      // Small movements are not intent; only hide on a real scroll down.
      if (Math.abs(y - lastY.current) > 8) {
        setVisible(y < lastY.current || y < 120);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [href]);

  if (!href) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-4 top-[84px] z-40 sm:left-6"
        >
          <Link
            href={href}
            aria-label="Back to all properties"
            title="Back to all properties"
            className={`group inline-flex h-10 items-center gap-2 rounded-full border pl-3 pr-3 text-[13.5px] font-medium backdrop-blur-md transition-all duration-300 sm:pr-4 ${
              overHero
                ? 'border-white/30 bg-black/30 text-white hover:border-white/60 hover:bg-black/45'
                : 'border-black/10 bg-white/95 text-[#202124] shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:bg-white'
            }`}
          >
            <ArrowLeft size={16} className="shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="hidden max-w-0 overflow-hidden whitespace-nowrap transition-[max-width] duration-300 group-hover:max-w-[160px] sm:inline sm:max-w-[160px]">
              All properties
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
