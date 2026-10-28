'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatWithDeveloper } from './ChatWithDeveloper';
import { getReferral } from '../../lib/analytics/referral';

/**
 * Chat button that follows the visitor down every property page, whatever
 * the template. Each template has its own chat button in the hero, so this
 * appears only once that has scrolled away — never two at once on screen.
 */
export function FloatingChat({ propertySlug, always = false }: { propertySlug: string; always?: boolean }) {
  const [show, setShow] = useState(always);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    // The agent referral bar sits bottom-centre and spans a phone's width.
    setLifted(!!getReferral());
    if (always) return;
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [always]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          className={`fixed right-4 z-40 sm:right-6 ${lifted ? 'bottom-24 sm:bottom-6' : 'bottom-5 sm:bottom-6'}`}
        >
          <div className="rounded-full shadow-[0_6px_24px_rgba(0,0,0,0.18)]">
            <ChatWithDeveloper propertySlug={propertySlug} label="Chat with the developer" className="hidden sm:block" />
            <ChatWithDeveloper propertySlug={propertySlug} variant="icon" label="Chat with the developer" className="sm:hidden" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
