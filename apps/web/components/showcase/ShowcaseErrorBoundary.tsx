'use client';

import { Component, type ReactNode } from 'react';

/** Keeps a failing 3D view inside its own box instead of crashing the page around it. */
export class ShowcaseErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(err: unknown) { console.warn('[3D] viewer error:', err); }
  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full items-center justify-center px-6 text-center font-google text-[14px] text-white/70">
        This 3D model couldn’t be loaded.
      </div>
    );
  }
}
