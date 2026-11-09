import Link from 'next/link';
import { PropertiesNavbar } from '../marketplace/PropertiesNavbar';
import { FooterLight } from '../layout/FooterLight';

/**
 * Plain reading layout for guides and the FAQ: the marketplace navbar, a
 * breadcrumb, a narrow measure for text, and the footer. No hero art — the
 * words are the point of these pages.
 */
export function ContentShell({ trail, children, wide }: {
  trail: { name: string; path?: string }[];
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white">
      <PropertiesNavbar />
      <main className={`mx-auto px-4 pb-20 pt-24 sm:px-6 ${wide ? 'max-w-[1100px]' : 'max-w-[760px]'}`}>
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[13.5px] text-[#6b6b70]">
          {trail.map((t, i) => (
            <span key={t.name} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {t.path ? <Link href={t.path} className="hover:text-[#111112]">{t.name}</Link> : <span className="text-[#111112]">{t.name}</span>}
            </span>
          ))}
        </nav>
        {children}
      </main>
      <FooterLight />
    </div>
  );
}

/** A question and its answer, open by default on the page — crawlable and scannable. */
export function Faq({ items }: { items: [string, string][] }) {
  return (
    <div className="divide-y divide-[#ececec] border-y border-[#ececec]">
      {items.map(([q, a]) => (
        <details key={q} className="group py-4" open>
          <summary className="cursor-pointer list-none text-[17px] font-medium text-[#18181b] marker:hidden">{q}</summary>
          <p className="mt-2 text-[16px] leading-relaxed text-[#52525b]">{a}</p>
        </details>
      ))}
    </div>
  );
}

export const faqSchema = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});
