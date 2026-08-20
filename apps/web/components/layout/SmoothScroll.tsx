'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * The element the proxy is registered against. It must also be the default
 * scroller, because none of the pinned sections pass `scroller` themselves —
 * without the default they would keep measuring the real viewport and ignore
 * the proxy entirely.
 *
 * Set at module scope rather than inside the effect: SmoothScroll wraps the
 * pages, so React runs the pinned sections' effects BEFORE this component's.
 * A trigger built during that earlier pass would otherwise be created against
 * the unproxied viewport and never corrected.
 */
if (typeof document !== 'undefined') {
  ScrollTrigger.defaults({ scroller: document.body });
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Own scroll restoration here rather than in the pinned section. A restored
    // mid-page offset is measured by every pin built during mount, and Lenis
    // keeps its own scroll position — so resetting the window alone leaves the
    // two disagreeing. Disable the browser's restore before Lenis reads it.
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (window.scrollY > 0) window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Start Lenis at the top too, immediately and without animating, so its
    // internal position matches the window we just reset.
    lenis.scrollTo(0, { immediate: true });

    // Teach ScrollTrigger to read and write scroll position THROUGH Lenis.
    //
    // Without this, ScrollTrigger and Lenis each believe they own the scroll.
    // Subscribing to Lenis's scroll event (as this did before) only tells
    // ScrollTrigger *when* to update, never how to read or set the position —
    // so as soon as a pin engages, ScrollTrigger writes a scroll value Lenis
    // does not know about, Lenis carries on animating toward its own target,
    // and the two disagree by however far Lenis had left to travel. That
    // disagreement is what tore the pinned sections: the pin releases at a
    // position the page is not actually at, so the section below slides up
    // mid-animation.
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length && typeof value === 'number') {
          // ScrollTrigger is setting position (snapping, or restoring around a
          // refresh) — route it through Lenis so its internal target moves too.
          lenis.scrollTo(value, { immediate: true });
          return;
        }
        // Report the animated position, which is what is actually painted this
        // frame. Reporting the target instead would run pins ahead of the view.
        return lenis.animatedScroll;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      },
      // Lenis transforms the page rather than using native scrolling, so pinned
      // elements must be positioned fixed rather than transformed.
      pinType: 'fixed',
    });

    // Hook Lenis into GSAP's ticker so ScrollTrigger syncs perfectly
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Keep Lenis's own measurements in step with ScrollTrigger's. A pin changes
    // document height as it engages and releases; if Lenis does not re-measure,
    // its scroll limit is stale and it clamps against the wrong page height.
    const onRefresh = () => lenis.resize();
    ScrollTrigger.addEventListener('refresh', onRefresh);

    // Lenis is created in an effect, so any ScrollTrigger built during a child's
    // mount (the hero, when its video is cached) measured the page before smooth
    // scrolling existed. Re-measure once Lenis is driving, so pin distances are
    // computed against the scroller that actually moves the page.
    ScrollTrigger.refresh();

    // A pinned, scrub-driven hero also has to be re-measured whenever the
    // viewport changes — a phone's URL bar collapsing counts, and it otherwise
    // leaves the pin sized for a viewport that no longer exists.
    let resizeId: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener('resize', onResize);

    // Late-arriving fonts and images change the height of everything below the
    // pin, which shifts where it should end.
    const onLoad = () => ScrollTrigger.refresh();
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      // must remove the same reference we added, or the ticker keeps driving a dead Lenis
      clearTimeout(resizeId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onLoad);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      gsap.ticker.remove(raf);
      // Drop the proxy before destroying Lenis, or ScrollTrigger keeps reading
      // scroll position from an instance that no longer exists.
      ScrollTrigger.scrollerProxy(document.body, undefined);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
