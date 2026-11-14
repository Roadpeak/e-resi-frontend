import type { Metadata } from 'next';

/** A buyer's private shortlist, opened by its token. Never in search results. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
