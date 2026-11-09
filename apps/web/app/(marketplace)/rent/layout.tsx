import { Inter_Tight } from 'next/font/google';

/**
 * The rent marketplace's typeface: Inter Tight, medium weight, for every
 * label, price and heading; the greeting uses Plus Jakarta Sans, which the
 * root layout already loads as --font-jakarta.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${interTight.variable} rent-type`}>{children}</div>;
}
