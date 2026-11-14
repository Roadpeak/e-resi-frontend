import type { Metadata } from 'next';

/** A one-to-one chat with an agent. Never in search results. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
