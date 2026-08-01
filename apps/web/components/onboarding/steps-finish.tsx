'use client';

import Link from 'next/link';
import {
  BadgeCheck, Building2, CheckCircle2, ChevronRight, FileCheck2, Pencil, PlusCircle,
} from 'lucide-react';
import { LISTING_FEE_MONTHLY, fmtUsd } from '../../lib/onboarding/catalog';
import { useOnboardingStore } from '../../lib/stores/onboarding.store';
import { PrimaryButton, SectionCard } from './ui';

// ── Billing: fixed listing fee per development ────────────────────────────────
//
// Production/marketing services (photography, video, VR…) are priced per
// development inside the development-creation flow — the only recurring
// platform cost is the flat listing fee for each development you list.

export function StepBilling() {
  return (
    <div className="grid gap-6">
      <SectionCard
        title="Simple, per-development pricing"
        subtitle="No subscription for your account — you only pay for what you list."
      >
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Listing fee</p>
              <p className="mt-1 text-xs text-gray-500">per development, per month — starts when it goes live</p>
            </div>
            <p className="text-3xl font-semibold text-gray-900 tabular-nums">
              {fmtUsd(LISTING_FEE_MONTHLY)}
              <span className="text-sm font-normal text-gray-500"> /mo</span>
            </p>
          </div>
          <div className="mt-5 border-t border-gray-200 pt-4 grid gap-2.5">
            {[
              'Dedicated branded page for each development',
              'Hosting, analytics, inquiry & booking management',
              'Unlimited units and floor plans per development',
              'Cancel a listing any time — billing stops immediately',
            ].map((line) => (
              <div key={line} className="flex items-start gap-2.5">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                <span className="text-[13px] leading-relaxed text-gray-600">{line}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-100 p-4">
          <Building2 size={16} className="mt-0.5 shrink-0 text-brand-600" />
          <p className="text-[13px] leading-relaxed text-gray-600">
            You&apos;ll add developments from your dashboard after verification. Each development
            you list adds one {fmtUsd(LISTING_FEE_MONTHLY)}/month listing fee — list two developments,
            pay {fmtUsd(LISTING_FEE_MONTHLY * 2)}/month. Media production services (photography,
            cinematic video, 3D & VR tours) are optional one-time costs chosen per development
            when you create it.
          </p>
        </div>

        <p className="text-[13px] leading-relaxed text-gray-500">
          Nothing is charged today. The listing fee for a development starts only when it is
          approved and published. All prices exclude VAT.
        </p>
      </SectionCard>
    </div>
  );
}

// ── Review ────────────────────────────────────────────────────────────────────

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
          className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
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
  const { company, verificationDocs, preferences: prefs } = useOnboardingStore();
  const docCount = Object.values(verificationDocs).filter(Boolean).length;

  return (
    <div className="grid gap-4">
      <ReviewBlock
        title="Company information"
        step={2}
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
        step={3}
        items={[['Documents uploaded', docCount ? `${docCount} of 6` : '']]}
      />
      <ReviewBlock
        title="Listing preferences"
        step={4}
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
        step={5}
        items={[
          ['Listing fee', `${fmtUsd(LISTING_FEE_MONTHLY)} / month per development`],
          ['Charged today', 'Nothing'],
        ]}
      />
    </div>
  );
}

// ── Submitted ─────────────────────────────────────────────────────────────────

export function StepSubmitted() {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F7EF]">
        <CheckCircle2 size={32} className="text-[#37B978]" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900">Your developer account is under review</h2>
      <p className="mx-auto mt-3 max-w-md text-gray-500">
        Thank you — we&apos;ve received everything. Here&apos;s what happens next.
      </p>

      <div className="mt-10 grid gap-4 text-left">
        {[
          {
            icon: FileCheck2,
            title: 'Verification — 1 to 2 business days',
            body: "Our compliance team reviews your business documents. You'll get an email once your company is verified.",
          },
          {
            icon: PlusCircle,
            title: 'Add your developments',
            body: 'Create your first development from the dashboard — details, media, and any production services you need, priced per development.',
          },
          {
            icon: BadgeCheck,
            title: 'Listings go live',
            body: 'Each approved development gets its own branded page and starts its monthly listing fee only when published.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
            <Icon size={20} className="mt-0.5 shrink-0 text-brand-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/dashboard/developments/new">
          <PrimaryButton type="button">
            Add your first development <ChevronRight size={15} />
          </PrimaryButton>
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
