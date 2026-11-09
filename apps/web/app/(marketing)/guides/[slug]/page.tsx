import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentShell, Faq, faqSchema } from '../../../../components/seo/ContentShell';
import { JsonLd, SITE_URL, breadcrumbs } from '../../../../components/seo/JsonLd';
import { GUIDES, guideBySlug } from '../../../../lib/guides';

interface Props { params: Promise<{ slug: string }> }

export const dynamicParams = false;
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return { title: 'Guide' };
  return {
    title: { absolute: `${g.title} | E-resi` },
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { siteName: 'E-resi', title: g.title, description: g.description, url: `/guides/${g.slug}`, type: 'article', modifiedTime: g.updated },
  };
}

export default async function GuidePage({ params }: Props) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const path = `/guides/${g.slug}`;
  const updated = new Date(`${g.updated}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ContentShell trail={[{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }, { name: g.title }]}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: g.title,
        description: g.description,
        dateModified: g.updated,
        datePublished: g.updated,
        mainEntityOfPage: `${SITE_URL}${path}`,
        author: { '@type': 'Organization', name: 'E-resi', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'E-resi', url: SITE_URL },
      }} />
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' }, { name: g.title, path }])} />
      {g.faqs?.length ? <JsonLd data={faqSchema(g.faqs)} /> : null}

      <article>
        <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-[#18181b] sm:text-[38px]">{g.title}</h1>
        <p className="mt-3 text-[14px] text-[#71717a]">Updated {updated}</p>

        <div className="mt-8 space-y-5 text-[17px] leading-[1.7] text-[#3f3f46]">
          {g.intro.map((p) => <p key={p}>{p}</p>)}
        </div>

        {g.sections.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="text-[22px] font-medium tracking-[-0.01em] text-[#18181b]">{s.heading}</h2>
            <div className="mt-3 space-y-4 text-[17px] leading-[1.7] text-[#3f3f46]">
              {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
              {s.list && (
                <ul className="list-disc space-y-2 pl-6 marker:text-[#a1a1aa]">
                  {s.list.map((li) => <li key={li}>{li}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}

        {g.faqs?.length ? (
          <section className="mt-12">
            <h2 className="mb-4 text-[22px] font-medium text-[#18181b]">Common questions</h2>
            <Faq items={g.faqs} />
          </section>
        ) : null}

        <p className="mt-10 rounded-xl bg-[#f6f6f7] px-5 py-4 text-[14.5px] leading-relaxed text-[#52525b]">
          This guide is general information, not legal or financial advice. Fees, rates and procedures change;
          confirm the details for your purchase or tenancy with an advocate.
        </p>

        <section className="mt-10 border-t border-[#ececec] pt-8">
          <h2 className="text-[18px] font-medium text-[#18181b]">Next steps</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {g.next.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="inline-block rounded-full bg-[#18181b] px-4 py-2 text-[15px] text-white hover:bg-[#27272a]">{n.label}</Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[15px] text-[#52525b]">
            More guides:{' '}
            {GUIDES.filter((o) => o.slug !== g.slug).map((o, i) => (
              <span key={o.slug}>{i > 0 && ' · '}<Link href={`/guides/${o.slug}`} className="text-[#18181b] underline underline-offset-2">{o.title.split(':')[0]}</Link></span>
            ))}
          </p>
        </section>
      </article>
    </ContentShell>
  );
}
