'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { onboardingApi } from '../../lib/api/onboarding';
import { ApiError } from '../../lib/api/client';
import { TOTAL_STEPS, useOnboardingStore } from '../../lib/stores/onboarding.store';
import { GhostButton, PrimaryButton } from '../../components/onboarding/ui';
import { StepCompany, StepVerification, StepWelcome } from '../../components/onboarding/steps-intro';
import { StepDevelopment, StepPreferences, StepServices } from '../../components/onboarding/steps-middle';
import { StepBilling, StepReview, StepSubmitted } from '../../components/onboarding/steps-finish';

const STEPS = [
  { title: 'Welcome', component: StepWelcome },
  { title: 'Company', component: StepCompany },
  { title: 'Verification', component: StepVerification },
  { title: 'Development', component: StepDevelopment },
  { title: 'Media & Services', component: StepServices },
  { title: 'Preferences', component: StepPreferences },
  { title: 'Billing', component: StepBilling },
  { title: 'Review', component: StepReview },
  { title: 'Done', component: StepSubmitted },
];

export default function OnboardingPage() {
  const { step, setStep, next, back, submitted, markSubmitted } = useOnboardingStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Avoid hydration mismatch: the persisted store only exists client-side.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);
  if (!hydrated) return null;

  const isWelcome = step === 0;
  const isReview = step === 7;
  const isDone = step === 8;
  const Current = STEPS[step].component;

  async function handleContinue() {
    if (!isReview) {
      next();
      return;
    }
    // Review step: persist the wizard to the backend before completing
    setSubmitError('');
    setSubmitting(true);
    try {
      const { company, verificationDocs, development, media, preferences } =
        useOnboardingStore.getState();
      await onboardingApi.submit({ company, verificationDocs, development, media, preferences });
      markSubmitted();
      next();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : 'Submission failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Stepper */}
      {!isDone && (
        <nav aria-label="Onboarding progress" className="mb-10 overflow-x-auto">
          <ol className="flex items-center gap-1 min-w-max">
            {STEPS.slice(0, TOTAL_STEPS - 1).map((s, i) => {
              const complete = i < step || submitted;
              const active = i === step;
              return (
                <li key={s.title} className="flex items-center">
                  {i > 0 && <span className={cn('mx-1 h-px w-5 sm:w-8', i <= step ? 'bg-[#4A80F5]' : 'bg-gray-200')} />}
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                      active && 'bg-[#EAF1FE] text-[#2E5BD7]',
                      complete && !active && 'text-gray-600 hover:bg-gray-100',
                      !complete && !active && 'text-gray-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                        active && 'bg-[#4A80F5] text-white',
                        complete && !active && 'bg-[#4A80F5]/15 text-[#2E5BD7]',
                        !complete && !active && 'bg-gray-100 text-gray-400',
                      )}
                    >
                      {complete && !active ? <Check size={11} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="hidden md:inline">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Step heading */}
      {!isWelcome && !isDone && (
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4A80F5]">
            Step {step + 1} of {TOTAL_STEPS - 1}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{STEPS[step].title}</h1>
        </div>
      )}

      {/* Step body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <Current />
        </motion.div>
      </AnimatePresence>

      {/* Footer nav */}
      {!isDone && (
        <div className="mt-10 border-t border-gray-200 pt-6">
          {submitError && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </p>
          )}
          <div className="flex items-center justify-between">
            {step > 0 ? (
              <GhostButton type="button" onClick={back} disabled={submitting}>
                <ArrowLeft size={15} /> Back
              </GhostButton>
            ) : (
              <span />
            )}
            <PrimaryButton type="button" onClick={handleContinue} disabled={submitting}>
              {submitting ? (
                <>
                  Submitting <Loader2 size={15} className="animate-spin" />
                </>
              ) : (
                <>
                  {isWelcome ? 'Get started' : isReview ? 'Submit for review' : 'Continue'}
                  <ArrowRight size={15} />
                </>
              )}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
