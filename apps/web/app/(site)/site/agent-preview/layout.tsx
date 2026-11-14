import type { Metadata } from 'next';

/** An agent's own preview of their website. Never in search results. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
