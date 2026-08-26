/**
 * Throwaway harness for eyeballing the template preview cards.
 *
 * The real picker lives behind a developer login on the customise screen; this
 * renders the same component against every template so the drawings can be
 * checked side by side. Delete once verified.
 */
'use client';

import { MINI_SITE_TEMPLATES } from '../../../lib/branding/templates';
import { TemplatePreviewCard } from '../../../components/dashboard/TemplatePreviewCard';

export default function PreviewCards() {
  return (
    <main className="mx-auto max-w-[560px] px-6 py-16">
      <h1 className="mb-6 text-[18px] font-medium text-[#202124]">Template previews</h1>
      <div className="grid grid-cols-2 gap-2.5">
        {MINI_SITE_TEMPLATES.map((t) => (
          <div key={t.key} className="rounded-2xl border border-[#dadce0] p-2">
            <TemplatePreviewCard template={t} brandColor="#1a73e8" />
            <p className="mt-2 px-0.5 text-[13px] font-medium text-[#202124]">{t.label}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
