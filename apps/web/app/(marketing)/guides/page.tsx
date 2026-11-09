import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentShell } from '../../../components/seo/ContentShell';
import { JsonLd, breadcrumbs, itemList } from '../../../components/seo/JsonLd';
import { GUIDES } from '../../../lib/guides';

export const metadata: Metadata = {
  title: 'Property Guides — Buying and Renting in Kenya',
  description: 'Practical guides to buying off-plan, renting in Nairobi and buying property in Kenya from abroad.',
  alternates: { canonical: '/guides' },
  openGraph: { siteName: 'E-resi', title: 'Property Guides — E-resi', description: 'Buying and renting property in Kenya, step by step.', url: '/guides', type: 'website' },
};

export default function Guides() {
  return (
    <ContentShell trail={[{ name: 'Home', path: '/' }, { name: 'Guides' }]}>
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }])} />
      <JsonLd data={itemList('Property guides', GUIDES.map((g) => ({ url: `/guides/${g.slug}`, name: g.title })))} />
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-[#18181b] sm:text-[40px]">Property guides</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-[#52525b]">
        What to check, what to ask and what it costs — for buying and renting property in Kenya.
      </p>
      <ul className="mt-10 divide-y divide-[#ececec] border-y border-[#ececec]">
        {GUIDES.map((g) => (
          <li key={g.slug} className="py-6">
            <h2 className="text-[20px] font-medium text-[#18181b]">
              <Link href={`/guides/${g.slug}`} className="hover:underline">{g.title}</Link>
            </h2>
            <p className="mt-1.5 text-[16px] text-[#52525b]">{g.summary}</p>
          </li>
        ))}
      </ul>
    </ContentShell>
  );
}
