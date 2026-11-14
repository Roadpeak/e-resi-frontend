import { interTight } from '../../../lib/fonts';

/**
 * The rent marketplace's typeface: Inter Tight, medium weight, for every
 * label, price and heading; the greeting uses Plus Jakarta Sans, which the
 * root layout already loads as --font-jakarta.
 */

export default function RentLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${interTight.variable} rent-type`}>{children}</div>;
}
