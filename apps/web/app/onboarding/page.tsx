'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { onboardingApi } from '../../lib/api/onboarding';
import { ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';
import { TOTAL_STEPS, useOnboardingStore } from '../../lib/stores/onboarding.store';
import { StepAccount } from '../../components/onboarding/step-account';
import { StepCompany, StepVerification, StepWelcome } from '../../components/onboarding/steps-intro';
import { StepPreferences } from '../../components/onboarding/steps-middle';
import { StepBilling, StepReview, StepSubmitted } from '../../components/onboarding/steps-finish';

// Welcome and Account are open to visitors — account creation IS developer
// signup. Everything after Account requires a signed-in developer.
const STEPS = [
  { title: 'Welcome' },
  { title: 'Account' },
  { title: 'Company' },
  { title: 'Verification' },
  { title: 'Preferences' },
  { title: 'Billing' },
  { title: 'Review' },
  { title: 'Done' },
];

export default function OnboardingPage() {
  const { step, setStep, next, back, submitted, markSubmitted } = useOnboardingStore();
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Avoid hydration mismatch: the persisted stores only exist client-side.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const isDeveloper = isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'ADMIN');
  // token present but /me still in flight — don't make auth decisions yet
  const authPending = !!accessToken && !isAuthenticated;

  // Steps beyond Account require a signed-in developer
  useEffect(() => {
    if (!hydrated || authPending) return;
    if (!isDeveloper && step > 1) setStep(1);
  }, [hydrated, authPending, isDeveloper, step, setStep]);

  if (!hydrated) return null;

  const isWelcome = step === 0;
  const isAccount = step === 1;
  const isReview = step === 6;
  const isDone = step === 7;

  async function handleContinue() {
    if (!isReview) {
      next();
      return;
    }
    // Review step: persist the wizard to the backend before completing
    setSubmitError('');
    setSubmitting(true);
    try {
      const { company, verificationDocs, preferences } = useOnboardingStore.getState();
      await onboardingApi.submit({ company, verificationDocs, preferences });
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

  // Continue is blocked on the Account step until the visitor is a developer
  const continueDisabled = submitting || (isAccount && !isDeveloper);

  function renderStep() {
    switch (step) {
      case 0: return <StepWelcome />;
      case 1: return <StepAccount onCompleted={next} />;
      case 2: return <StepCompany />;
      case 3: return <StepVerification />;
      case 4: return <StepPreferences />;
      case 5: return <StepBilling />;
      case 6: return <StepReview />;
      default: return <StepSubmitted />;
    }
  }

  return (
    <div className="flex gap-12">
      {/* ── Step rail ── */}
      {!isDone && (
        <nav aria-label="Onboarding progress" className="hidden w-44 shrink-0 lg:block pt-1.5">
          <ol className="space-y-5">
            {STEPS.slice(0, TOTAL_STEPS - 1).map((s, i) => {
              const done = i < step || submitted;
              const current = i === step;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    className={cn(
                      'flex items-center gap-3 text-left',
                      i < step ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >
                    <span className="flex w-4 items-center justify-center">
                      {done && !current ? (
                        <Check size={15} strokeWidth={3} className="text-emerald-500" />
                      ) : (
                        <span className={cn('h-0.5 w-4 rounded-full', current ? 'bg-brand-600' : 'bg-gray-300')} />
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-[13px] transition-colors',
                        done && !current && 'text-gray-700 hover:text-gray-900',
                        current && 'font-medium text-gray-900',
                        !done && !current && 'text-gray-400',
                      )}
                    >
                      {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* ── Content ── */}
      <div className="min-w-0 flex-1">
        {/* Mobile progress */}
        {!isDone && (
          <div className="mb-8 lg:hidden">
            <p className="mb-2 text-xs font-medium text-gray-500">
              Step {step + 1} of {TOTAL_STEPS - 1} · {STEPS[step].title}
            </p>
            <div className="h-1 w-full rounded-full bg-gray-100">
              <div
                className="h-1 rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${((step + 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step heading */}
        {!isWelcome && !isDone && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Step {step + 1} of {TOTAL_STEPS - 1}
            </p>
            <h1 className="mt-1 text-[1.75rem] font-semibold leading-snug text-gray-900 sm:text-3xl">
              {STEPS[step].title === 'Account' ? 'Developer account' : STEPS[step].title}
            </h1>
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
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* ── Footer actions ── */}
        {!isDone && (
          <div className="mt-10 border-t border-gray-200 pt-6">
            {submitError && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {submitError}
              </p>
            )}
            <div className="flex items-center justify-between">
              <Link
                href={isDeveloper ? '/dashboard' : '/'}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Save & exit
              </Link>
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={continueDisabled}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  {submitting ? (
                    <>Submitting <Loader2 size={15} className="animate-spin" /></>
                  ) : (
                    <>
                      {isWelcome ? 'Get started' : isReview ? 'Submit for review' : 'Continue'}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
