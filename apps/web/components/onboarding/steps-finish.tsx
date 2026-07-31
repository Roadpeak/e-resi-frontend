'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, CalendarClock, CheckCircle2, ChevronRight, ClipboardList,
  FileCheck2, Pencil, Trash2,
} from 'lucide-react';
import { computeBilling, fmtUsd, serviceById } from '../../lib/onboarding/catalog';
import { useOnboardingStore } from '../../lib/stores/onboarding.store';
import { PrimaryButton, SectionCard } from './ui';

// ── Step 7: Subscription & Billing (dynamic, no packages) ────────────────────

export function StepBilling() {
  const { media, toggleService, setStep } = useOnboardingStore();
  const billing = computeBilling(Object.keys(media.services));
  const [showBreakdown, setShowBreakdown] = useState(true);

  const Row = ({ label, amount, onRemove }: { label: string; amount: string; onRemove?: () => void }) => (
    <div className="flex items-center justify-between py-2.5">
      <span className="flex items-center gap-2 text-sm text-gray-700">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-gray-300 hover:text-[#F0594C] transition-colors"
            aria-label={`Remove ${label}`}
          >
            <Trash2 size={14} />
          </button>
        )}
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900 tabular-nums">{amount}</span>
    </div>
  );

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Your estimate"
        subtitle="Calculated from the services you selected — nothing is charged until your listing is approved."
      >
        <div className="divide-y divide-gray-100">
          <Row label="Listing fee" amount={`${fmtUsd(billing.listingFeeMonthly)} / month`} />

          {billing.production.length > 0 && (
            <div className="py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-1 pb-1">
                Production services
              </p>
              {billing.production.map((s) => (
                <Row key={s.id} label={s.label} amount={fmtUsd(s.price)} onRemove={() => toggleService(s.id)} />
              ))}
            </div>
          )}

          {billing.marketing.length > 0 && (
            <div className="py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 pt-1 pb-1">
                Marketing & design services
              </p>
              {billing.marketing.map((s) => (
                <Row key={s.id} label={s.label} amount={fmtUsd(s.price)} onRemove={() => toggleService(s.id)} />
              ))}
            </div>
          )}

          {billing.production.length === 0 && billing.marketing.length === 0 && (
            <p className="py-4 text-sm text-gray-400">
              No production services selected — your listing will use the media you upload yourself.
            </p>
          )}

          <div className="flex items-center justify-between pt-4">
            <span className="text-base font-semibold text-gray-900">Estimated total</span>
            <span className="text-right">
              <span className="block text-xl font-semibold text-gray-900 tabular-nums">
                {fmtUsd(billing.oneTimeTotal)} <span className="text-sm font-normal text-gray-500">one-time</span>
              </span>
              <span className="block text-sm text-gray-500 tabular-nums">
                + {fmtUsd(billing.listingFeeMonthly)} / month listing
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep(4)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={13} /> Add or change services
          </button>
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <ClipboardList size={13} /> {showBreakdown ? 'Hide' : 'View'} pricing notes
          </button>
        </div>

        {showBreakdown && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-[13px] leading-relaxed text-gray-500">
            Production fees are one-time and payable 50% before the shoot, 50% on delivery.
            The monthly listing fee starts only when your development goes live and covers hosting,
            analytics, inquiry management and support. All prices exclude VAT.
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Step 8: Review ───────────────────────────────────────────────────────────

function ReviewBlock({
  title, step, items,
}: {
  title: string;
  step: number;
  items: [string, string][];
}) {
  const setStep = useOnboardingStore((s) => s.setStep);
  const filled = items.filter(([, v]) => v);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => setStep(step)}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#4A80F5] hover:text-[#3457E0]"
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      {filled.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing provided yet.</p>
      ) : (
        <dl className="grid gap-2 sm:grid-cols-2">
          {filled.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-gray-400">{k}</dt>
              <dd className="text-sm text-gray-800 break-words">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function StepReview() {
  const { company, verificationDocs, development: dev, media, preferences: prefs } = useOnboardingStore();
  const billing = computeBilling(Object.keys(media.services));
  const docCount = Object.values(verificationDocs).filter(Boolean).length;
  const uploadCount = Object.values(media.uploads).reduce((n, files) => n + files.length, 0);

  return (
    <div className="grid gap-4">
      <ReviewBlock
        title="Developer information"
        step={1}
        items={[
          ['Company', company.companyName],
          ['Registration no.', company.registrationNumber],
          ['Tax PIN', company.taxPin],
          ['Type', company.companyType],
          ['Contact', [company.contactName, company.contactTitle].filter(Boolean).join(' — ')],
          ['Email', company.contactEmail],
          ['Phone', company.contactPhone],
          ['Office', [company.address, company.city, company.country].filter(Boolean).join(', ')],
        ]}
      />
      <ReviewBlock
        title="Verification documents"
        step={2}
        items={[['Documents uploaded', docCount ? `${docCount} of 6` : '']]}
      />
      <ReviewBlock
        title="Development information"
        step={3}
        items={[
          ['Name', dev.name],
          ['Type', [dev.type, dev.category].filter(Boolean).join(' · ')],
          ['Status', dev.status],
          ['Location', [dev.area, dev.city, dev.county].filter(Boolean).join(', ')],
          ['Units', dev.numberOfUnits],
          ['Unit types', dev.unitTypes.join(', ')],
          ['Starting price', dev.startingPrice],
          ['Payment plans', dev.paymentPlans.join(', ')],
        ]}
      />
      <ReviewBlock
        title="Media"
        step={4}
        items={[
          ['Own media', media.hasOwnMedia ? `Yes — ${uploadCount} file${uploadCount === 1 ? '' : 's'}` : 'No'],
        ]}
      />
      <ReviewBlock
        title="Selected services"
        step={4}
        items={Object.keys(media.services).map((id) => {
          const s = serviceById(id);
          return [s?.label ?? id, s ? fmtUsd(s.price) : ''] as [string, string];
        })}
      />
      <ReviewBlock
        title="Listing preferences"
        step={5}
        items={[
          ['Visibility', prefs.visibility.replace('_', ' ')],
          ['Leads via', prefs.leadChannels.join(', ')],
          ['Appointments', prefs.appointments.replace('_', ' ')],
          ['Viewing days', prefs.workingDays.join(', ')],
          ['Hours', `${prefs.workingHoursStart} – ${prefs.workingHoursEnd}`],
        ]}
      />
      <ReviewBlock
        title="Billing"
        step={6}
        items={[
          ['One-time services', fmtUsd(billing.oneTimeTotal)],
          ['Monthly listing fee', `${fmtUsd(billing.listingFeeMonthly)} / month`],
        ]}
      />
    </div>
  );
}

// ── Step 9: Submitted ────────────────────────────────────────────────────────

export function StepSubmitted() {
  const hasServices = useOnboardingStore((s) => Object.keys(s.media.services).length > 0);
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F7EF]">
        <CheckCircle2 size={32} className="text-[#37B978]" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900">Your development is now under review</h2>
      <p className="mx-auto mt-3 max-w-md text-gray-500">
        Thank you — we've received everything. Here's what happens next.
      </p>

      <div className="mt-10 grid gap-4 text-left">
        {[
          {
            icon: FileCheck2,
            title: 'Verification — 1 to 2 business days',
            body: "Our compliance team reviews your business documents. You'll get an email once your company is verified.",
          },
          ...(hasServices
            ? [{
                icon: CalendarClock,
                title: 'Media production scheduling',
                body: 'A producer will contact you within 48 hours of verification to confirm shoot dates for your selected services.',
              }]
            : []),
          {
            icon: BadgeCheck,
            title: 'Listing goes live',
            body: 'Once verification (and any production) is complete and approved, your development is published to buyers.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
            <Icon size={20} className="mt-0.5 shrink-0 text-[#4A80F5]" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-gray-500">
        You can track review progress, respond to questions and manage your listing from your dashboard.
      </p>
      <Link href="/dashboard" className="mt-4 inline-block">
        <PrimaryButton type="button">
          Go to Dashboard <ChevronRight size={15} />
        </PrimaryButton>
      </Link>
    </div>
  );
}
