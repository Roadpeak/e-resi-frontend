'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { apiClient, ApiError } from '../../../../../lib/api/client';
import { DEV_TOTAL_STEPS, useDevelopmentStore } from '../../../../../lib/stores/development.store';
import { StepDevelopment, StepServices } from '../../../../../components/development/steps';
import { LISTING_FEE_MONTHLY, computeBilling, fmtUsd } from '../../../../../lib/onboarding/catalog';
import { useCatalog } from '../../../../../lib/onboarding/useCatalog';

const STEPS = ['Development details', 'Media & services', 'Review & costs'];

// Wizard type → backend PropertyCategory enum
function toCategory(type: string): string {
  const map: Record<string, string> = {
    Apartments: 'APARTMENT',
    Townhouses: 'TOWNHOUSE',
    Villas: 'VILLA',
    'Mixed-use': 'COMMERCIAL',
    'Gated community': 'VILLA',
    Commercial: 'COMMERCIAL',
    Land: 'LAND',
  };
  return map[type] ?? 'APARTMENT';
}

function parsePrice(v: string): number | undefined {
  const digits = v.replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(digits);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Accepts "-1.2673, 36.8065"; ignores anything that isn't a valid pair. */
function parseCoordinates(raw?: string): { latitude?: number; longitude?: number } {
  if (!raw) return {};
  const [lat, lng] = raw.split(',').map((v) => Number.parseFloat(v.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return {};
  return { latitude: lat, longitude: lng };
}

export default function NewDevelopmentPage() {
  // Hydrates the catalogue with admin-managed pricing.
  useCatalog();
  const { step, setStep, next, back, development, media, reset } = useDevelopmentStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const billing = computeBilling(Object.keys(media.services));
  const isReview = step === 2;

  async function handleContinue() {
    setError('');
    if (step === 0 && !development.name.trim()) {
      setError('Give the development a name before continuing.');
      return;
    }
    if (!isReview) {
      next();
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: { slug: string } }>('/properties', {
        name: development.name.trim(),
        heroImageUrl: development.heroImageUrl || undefined,
        tagline: development.shortDescription || undefined,
        description: development.fullDescription || undefined,
        category: toCategory(development.type),
        neighborhood: development.area || undefined,
        city: development.city || undefined,
        county: development.county || undefined,
        // Parsed from the "lat, lng" field — without these the property can't
        // be plotted on the marketplace map.
        ...parseCoordinates(development.gpsCoordinates),
        priceFrom: parsePrice(development.startingPrice),
        currency: development.currency || 'KES',
        tags: development.unitTypes,
        completionDate: development.expectedCompletion
          ? `${development.expectedCompletion}-01T00:00:00.000Z`
          : undefined,
        // full wizard payload for the review & production teams
        submissionData: {
          development,
          media,
          listingFeeMonthly: LISTING_FEE_MONTHLY,
          servicesOneTimeTotal: billing.oneTimeTotal,
        },
      });
      setCreatedSlug(res.data?.slug ?? '');
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──
  if (createdSlug !== null) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f4ea]">
          <CheckCircle2 size={32} className="text-[#188038]" />
        </div>
        <h1 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Development submitted</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-[#5f6368]">
          It&apos;s saved as a draft while our team reviews the details{billing.oneTimeTotal > 0 ? ' and schedules your production services' : ''}.
          The {fmtUsd(LISTING_FEE_MONTHLY)}/month listing fee starts only when it goes live.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors"
          >
            View my developments <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            onClick={() => setCreatedSlug(null)}
            className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer"
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Heading + stepper */}
      <div className="mb-8">
        <h1 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Add a development</h1>
        <p className="mt-1 text-base text-[#5f6368]">
          Each development gets its own branded page — listing costs {fmtUsd(LISTING_FEE_MONTHLY)}/month once live.
        </p>
        <ol className="mt-6 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label} className="flex items-center gap-2">
                {i > 0 && <span className={cn('h-px w-6', i <= step ? 'bg-[#1a73e8]' : 'bg-[#dadce0]')} />}
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                    current && 'bg-[#e8f0fe] text-[#1967d2]',
                    done && 'text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer',
                    !done && !current && 'text-[#80868b]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                      current && 'bg-[#1a73e8] text-white',
                      done && 'bg-[#e6f4ea] text-[#188038]',
                      !done && !current && 'bg-[#f1f3f4] text-[#80868b]',
                    )}
                  >
                    {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step body */}
      <AnimatePresence initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && <StepDevelopment />}
          {step === 1 && <StepServices />}
          {step === 2 && <ReviewAndCosts />}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-10 border-t border-[#dadce0] pt-6">
        {error && (
          <p className="mb-4 rounded-2xl border border-transparent bg-[#fce8e6] px-4 py-3 text-[15px] text-[#c5221f]">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors">
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? (
                <>Submitting <Loader2 size={15} className="animate-spin" /></>
              ) : (
                <>{isReview ? 'Submit development' : 'Continue'} <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Review & costs ────────────────────────────────────────────────────

function ReviewAndCosts() {
  const { development: dev, media, setStep, toggleService } = useDevelopmentStore();
  const billing = computeBilling(Object.keys(media.services));
  const uploadCount = Object.values(media.uploads).reduce((n, files) => n + files.length, 0);

  const Block = ({ title, step, items }: { title: string; step: number; items: [string, string][] }) => {
    const filled = items.filter(([, v]) => v);
    return (
      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-normal text-[#202124]">{title}</h3>
          <button
            type="button"
            onClick={() => setStep(step)}
            className="inline-flex items-center gap-1 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc]"
          >
            <Pencil size={12} /> Edit
          </button>
        </div>
        {filled.length === 0 ? (
          <p className="text-[15px] text-[#80868b]">Nothing provided yet.</p>
        ) : (
          <dl className="grid gap-2 sm:grid-cols-2">
            {filled.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[13px] text-[#80868b]">{k}</dt>
                <dd className="text-[15px] text-[#202124] break-words">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-4">
      <Block
        title="Development"
        step={0}
        items={[
          ['Name', dev.name],
          ['Type', [dev.type, dev.category].filter(Boolean).join(' · ')],
          ['Status', dev.status],
          ['Location', [dev.area, dev.city, dev.county].filter(Boolean).join(', ')],
          ['Units', dev.numberOfUnits],
          ['Unit types', dev.unitTypes.join(', ')],
          ['Currency', dev.currency],
          ['Starting price', dev.startingPrice],
          ['Payment plans', dev.paymentPlans.join(', ')],
        ]}
      />
      <Block
        title="Media"
        step={1}
        items={[['Own media', media.hasOwnMedia ? `Yes — ${uploadCount} file${uploadCount === 1 ? '' : 's'}` : 'No']]}
      />

      {/* Costs */}
      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-normal text-[#202124]">Costs for this development</h3>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-1 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc]"
          >
            <Pencil size={12} /> Change services
          </button>
        </div>
        <div className="divide-y divide-[#f1f3f4]">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[15px] text-[#5f6368]">Listing fee</span>
            <span className="text-[15px] font-medium text-[#202124] tabular-nums">
              {fmtUsd(billing.listingFeeMonthly)} / month
            </span>
          </div>
          {[...billing.production, ...billing.marketing].map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-[15px] text-[#5f6368]">
                <button
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className="text-[#bdc1c6] hover:text-[#c5221f] transition-colors"
                  aria-label={`Remove ${s.label}`}
                >
                  ×
                </button>
                {s.label}
              </span>
              <span className="text-[15px] font-medium text-[#202124] tabular-nums">{fmtUsd(s.price)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4">
            <span className="text-base font-medium text-[#202124]">Total</span>
            <span className="text-right">
              <span className="block text-[22px] font-normal text-[#202124] tabular-nums">
                {fmtUsd(billing.oneTimeTotal)} <span className="text-[15px] text-[#5f6368]">one-time</span>
              </span>
              <span className="block text-[15px] text-[#5f6368] tabular-nums">
                + {fmtUsd(billing.listingFeeMonthly)} / month when live
              </span>
            </span>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-[#f8f9fa] border border-transparent p-4 text-sm leading-relaxed text-[#5f6368]">
          Production fees are one-time and payable 50% before the shoot, 50% on delivery.
          The monthly listing fee starts only when this development goes live. All prices exclude VAT.
        </p>
      </div>
    </div>
  );
}
