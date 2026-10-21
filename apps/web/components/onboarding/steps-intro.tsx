'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Building2, CheckCircle2, Clock3, FileText, Globe, Link2, Loader2, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react';
import { useAuthStore } from '../../lib/stores/auth.store';
import {
  useOnboardingStore, type VerificationDocKey, type VerificationLinkKey, type VerificationMethod,
} from '../../lib/stores/onboarding.store';
import { onboardingApi } from '../../lib/api/onboarding';
import { uploadFile } from '../../lib/api/media';
import { cn } from '../../lib/utils';
import { apiClient } from '../../lib/api/client';
import {
  Field, FieldGrid, SectionCard, Select, TextArea, TextInput,
} from './ui';

// ── Step 1: Welcome ──────────────────────────────────────────────────────────

/**
 * What the flow will actually ask for. Someone who has clicked "become a
 * developer" has already decided — they need to know what is ahead, not why.
 */
const WHAT_TO_EXPECT = [
  { icon: Building2, title: 'Your company', body: 'Name, registration number and where you operate.' },
  { icon: ShieldCheck, title: 'Verification', body: 'Your website or social media links, or your company documents.' },
  { icon: Sparkles, title: 'Production', body: 'Choose the photography, 3D and VR services you want.' },
];

export function StepWelcome() {
  return (
    <div className="mx-auto max-w-xl">
      {/*
        One image, on the opening screen only. The later steps are long forms
        where a decorative panel would fight the scroll.
      */}
      <div className="relative mb-8 h-44 overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src="/images/prop3.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 100vw, 576px"
          className="object-cover"
        />
      </div>

      <h2 className="text-[32px] font-normal leading-tight text-gray-900" style={{ textWrap: 'balance' }}>
        Let&apos;s get your company set up
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
        Once you&apos;re verified you can list as many developments as you like from your
        dashboard.
      </p>

      <ol className="mt-10 space-y-6">
        {WHAT_TO_EXPECT.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Icon size={17} />
            </span>
            <span className="min-w-0 pt-1">
              <span className="block text-[15px] font-medium text-gray-900">{title}</span>
              <span className="mt-0.5 block text-[14px] leading-relaxed text-gray-500">{body}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-10 flex items-center gap-2 text-[13px] text-gray-500">
        <Clock3 size={14} />
        About 10 minutes. Your progress saves as you go.
      </p>
    </div>
  );
}

// ── Step 2: Developer / Company Information ──────────────────────────────────

const COMPANY_TYPES = [
  'Private Limited Company', 'Public Limited Company', 'Partnership',
  'Sole Proprietorship', 'Real Estate Investment Trust (REIT)', 'Other',
];

export function StepCompany() {
  const { company, patchCompany } = useOnboardingStore();
  const user = useAuthStore((s) => s.user);

  // No repeat data collection: company name comes from account creation and
  // contact details default to the account holder (still editable).
  useEffect(() => {
    if (!company.companyName || !company.logoUrl) {
      apiClient
        .get<{ success: boolean; data: { companyName?: string; logoUrl?: string | null } }>('/users/developers/me')
        .then((res) => {
          const { companyName: name, logoUrl } = res?.data ?? {};
          const now = useOnboardingStore.getState().company;
          if (name && !now.companyName) patchCompany({ companyName: name });
          // A logo saved earlier (here or from the dashboard) shows up again.
          if (logoUrl && !now.logoUrl) patchCompany({ logoUrl, logoName: '' });
        })
        .catch(() => {});
    }
    if (user) {
      patchCompany({
        ...(!company.contactName && { contactName: `${user.firstName} ${user.lastName}`.trim() }),
        ...(!company.contactEmail && { contactEmail: user.email }),
        ...(!company.contactPhone && user.phone && { contactPhone: user.phone }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Company details"
        subtitle={company.companyName ? `Registering: ${company.companyName} — set at account creation.` : undefined}
      >
        <FieldGrid>
          <Field label="Registration number" hint="Optional if you verify with links">
            <TextInput value={company.registrationNumber} onChange={(e) => patchCompany({ registrationNumber: e.target.value })} placeholder="PVT-XXXXXXX" />
          </Field>
          <Field label="Tax PIN" hint="Optional if you verify with links">
            <TextInput value={company.taxPin} onChange={(e) => patchCompany({ taxPin: e.target.value })} placeholder="P0XXXXXXXXX" />
          </Field>
          <Field label="Year established">
            <TextInput type="number" min={1900} max={2100} value={company.yearEstablished} onChange={(e) => patchCompany({ yearEstablished: e.target.value })} placeholder="2015" />
          </Field>
          <Field label="Company type">
            <Select options={COMPANY_TYPES} value={company.companyType} onChange={(e) => patchCompany({ companyType: e.target.value })} />
          </Field>
          <Field label="Website">
            <TextInput type="url" value={company.website} onChange={(e) => patchCompany({ website: e.target.value })} placeholder="https://" />
          </Field>
        </FieldGrid>
        <LogoUpload
          url={company.logoUrl}
          name={company.logoName}
          onChange={(logoUrl, logoName) => patchCompany({ logoUrl, logoName })}
        />
      </SectionCard>

      <SectionCard title="Primary contact" subtitle="Who should buyers and the e-resi team reach out to?">
        <FieldGrid>
          <Field label="Full name" required>
            <TextInput value={company.contactName} onChange={(e) => patchCompany({ contactName: e.target.value })} />
          </Field>
          <Field label="Job title">
            <TextInput value={company.contactTitle} onChange={(e) => patchCompany({ contactTitle: e.target.value })} placeholder="Sales Director" />
          </Field>
          <Field label="Email" required>
            <TextInput type="email" value={company.contactEmail} onChange={(e) => patchCompany({ contactEmail: e.target.value })} />
          </Field>
          <Field label="Phone number" required>
            <TextInput type="tel" value={company.contactPhone} onChange={(e) => patchCompany({ contactPhone: e.target.value })} placeholder="+254…" />
          </Field>
          <Field label="WhatsApp">
            <TextInput type="tel" value={company.contactWhatsapp} onChange={(e) => patchCompany({ contactWhatsapp: e.target.value })} placeholder="+254…" />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Office information">
        <FieldGrid>
          <Field label="Country" required>
            <TextInput value={company.country} onChange={(e) => patchCompany({ country: e.target.value })} />
          </Field>
          <Field label="City" required>
            <TextInput value={company.city} onChange={(e) => patchCompany({ city: e.target.value })} placeholder="Nairobi" />
          </Field>
        </FieldGrid>
        <Field label="Physical address">
          <TextInput value={company.address} onChange={(e) => patchCompany({ address: e.target.value })} placeholder="Building, street, floor" />
        </Field>
        <Field label="Google Maps location" hint="Paste a Google Maps share link">
          <TextInput type="url" value={company.mapsUrl} onChange={(e) => patchCompany({ mapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
        </Field>
      </SectionCard>

      <SectionCard title="Company profile">
        <Field label="Short description" hint="One or two sentences, shown on your public card">
          <TextInput maxLength={160} value={company.shortDescription} onChange={(e) => patchCompany({ shortDescription: e.target.value })} />
        </Field>
        <Field label="Long description">
          <TextArea value={company.longDescription} onChange={(e) => patchCompany({ longDescription: e.target.value })} placeholder="Your company story, track record, and what sets your developments apart…" />
        </Field>
        <FieldGrid>
          <Field label="Projects completed">
            <TextInput type="number" min={0} value={company.projectsCompleted} onChange={(e) => patchCompany({ projectsCompleted: e.target.value })} />
          </Field>
          <Field label="Currently under development">
            <TextInput type="number" min={0} value={company.projectsUnderDevelopment} onChange={(e) => patchCompany({ projectsUnderDevelopment: e.target.value })} />
          </Field>
        </FieldGrid>
        <Field label="Awards / certifications">
          <TextArea rows={2} value={company.awards} onChange={(e) => patchCompany({ awards: e.target.value })} placeholder="One per line" />
        </Field>
      </SectionCard>
    </div>
  );
}

/** The company logo — uploaded straight away and shown whole, never cropped. */
function LogoUpload({
  url, name, onChange,
}: { url: string; name: string; onChange: (url: string, name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose an image: PNG, JPG, SVG or WebP.');
    if (file.size > 10 * 1024 * 1024) return setError('Logos must be under 10 MB.');
    setError('');
    setBusy(true);
    try {
      const uploaded = await uploadFile(file, 'logos');
      onChange(uploaded.url, file.name);
      // Saved to the profile now, not only on final submit, so the logo is on
      // the dashboard even if the developer leaves the wizard part-way.
      await apiClient.patch('/users/developers/me', { logoUrl: uploaded.url }).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-gray-700">Company logo</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {busy ? (
            <Loader2 size={20} className="animate-spin text-[#4A80F5]" />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded host
            <img src={url} alt="Company logo" className="h-full w-full object-contain p-2" />
          ) : (
            <Building2 size={22} className="text-gray-300" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => ref.current?.click()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-wait"
            >
              <Upload size={14} /> {url ? 'Replace' : busy ? 'Uploading…' : 'Upload logo'}
            </button>
            {url && !busy && (
              <button
                type="button"
                onClick={() => onChange('', '')}
                className="cursor-pointer rounded-full px-3 py-2 text-[13px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6]"
              >
                Remove
              </button>
            )}
          </div>
          <p className={cn('mt-1.5 truncate text-xs', error ? 'text-[#F0594C]' : 'text-gray-400')}>
            {error || (url && name ? name : 'PNG or SVG, at least 512×512. Shown on your profile and listings.')}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Verification ─────────────────────────────────────────────────────

const DOCS: { key: VerificationDocKey; label: string; hint: string; required?: boolean }[] = [
  { key: 'registrationCert', label: 'Business registration certificate', hint: 'Certificate of incorporation or equivalent', required: true },
  { key: 'taxCert', label: 'Tax compliance certificate', hint: 'Current KRA tax compliance certificate', required: true },
  { key: 'directorId', label: 'Director identification', hint: 'National ID or passport of a listed director', required: true },
  { key: 'proofOfAddress', label: 'Proof of address', hint: 'Utility bill or lease dated within 3 months' },
  { key: 'companyLogo', label: 'Company logo', hint: 'High-resolution PNG or vector' },
  { key: 'brandAssets', label: 'Brand assets', hint: 'Brand guidelines, fonts, or press kit (optional)' },
];

const REQUIRED_DOCS = DOCS.filter((d) => d.required).map((d) => d.key);

const LINKS: { key: VerificationLinkKey; label: string; placeholder: string }[] = [
  { key: 'website', label: 'Company website', placeholder: 'https://yourcompany.co.ke' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourcompany' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourcompany' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/yourcompany' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourcompany' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourcompany' },
  { key: 'other', label: 'Other link', placeholder: 'A news article, project page or listing' },
];

function looksLikeUrl(v?: string) {
  if (!v?.trim()) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Whether the verification step has enough to submit, and if not, why. */
export function verificationStatus(state: {
  verificationMethod: VerificationMethod;
  verificationDocs: Partial<Record<VerificationDocKey, unknown>>;
  verificationLinks: Partial<Record<VerificationLinkKey, string>>;
}): { ready: boolean; message: string } {
  if (state.verificationMethod === 'links') {
    const count = Object.values(state.verificationLinks).filter(looksLikeUrl).length;
    return count
      ? { ready: true, message: `${count} link${count === 1 ? '' : 's'} added` }
      : { ready: false, message: 'Add at least one website or social media link to continue.' };
  }
  const missing = REQUIRED_DOCS.filter((k) => !state.verificationDocs[k]).length;
  const uploaded = Object.values(state.verificationDocs).filter(Boolean).length;
  return missing
    ? { ready: false, message: `Upload the ${missing} required document${missing === 1 ? '' : 's'} marked *, or verify with links instead.` }
    : { ready: true, message: `${uploaded} document${uploaded === 1 ? '' : 's'} uploaded` };
}

const METHODS: { value: VerificationMethod; title: string; body: string; icon: typeof FileText; badge?: string }[] = [
  {
    value: 'links',
    title: 'Share website & social links',
    body: 'The quickest way. Add your company website or social media pages and we\u2019ll confirm your company from them.',
    icon: Link2,
    badge: 'Fastest',
  },
  {
    value: 'documents',
    title: 'Upload legal documents',
    body: 'Registration certificate, tax compliance certificate and a director\u2019s ID. Stored privately for our compliance team.',
    icon: FileText,
  },
];

export function StepVerification() {
  const state = useOnboardingStore();
  const { verificationMethod, setVerificationMethod } = state;
  const status = verificationStatus(state);

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Verify your company"
        subtitle="Choose one way to show us your company is real. Verified developers get a badge on every listing."
      >
        <div role="radiogroup" aria-label="Verification method" className="grid gap-3 sm:grid-cols-2">
          {METHODS.map((m) => {
            const active = verificationMethod === m.value;
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setVerificationMethod(m.value)}
                className={cn(
                  'relative flex cursor-pointer flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors',
                  active ? 'border-[#4A80F5] bg-[#F6F9FF] ring-1 ring-[#4A80F5]' : 'border-gray-200 bg-white hover:border-gray-300',
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', active ? 'bg-[#4A80F5] text-white' : 'bg-gray-100 text-gray-600')}>
                    <Icon size={17} />
                  </span>
                  {m.badge && (
                    <span className="rounded-full bg-[#E6F4EA] px-2.5 py-0.5 text-[11px] font-semibold text-[#137333]">{m.badge}</span>
                  )}
                </span>
                <span className="text-[15px] font-semibold text-gray-900">{m.title}</span>
                <span className="text-[13px] leading-relaxed text-gray-500">{m.body}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {verificationMethod === 'links' ? <VerificationLinks /> : <VerificationDocuments />}

      <p className={cn('flex items-center gap-2 text-[13px]', status.ready ? 'text-[#137333]' : 'text-gray-500')}>
        {status.ready ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
        {status.message}
      </p>
    </div>
  );
}

function VerificationLinks() {
  const { verificationLinks, setVerificationLink } = useOnboardingStore();
  return (
    <SectionCard
      title="Website & social links"
      subtitle="Add at least one. The more you add, the faster we can confirm your company. A website is best."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {LINKS.map((l) => {
          const value = verificationLinks[l.key] ?? '';
          const invalid = value.trim() !== '' && !looksLikeUrl(value);
          return (
            <Field key={l.key} label={l.label} hint={invalid ? 'That doesn\u2019t look like a link' : undefined}>
              <div className="relative">
                <Globe size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <TextInput
                  type="url"
                  inputMode="url"
                  value={value}
                  onChange={(e) => setVerificationLink(l.key, e.target.value)}
                  placeholder={l.placeholder}
                  className={cn('pl-9', invalid && 'border-[#F0594C]')}
                />
              </div>
            </Field>
          );
        })}
      </div>
    </SectionCard>
  );
}

function VerificationDocuments() {
  return (
    <SectionCard
      title="Legal documents"
      subtitle="Stored privately and reviewed only by our compliance team. Never shown publicly. PDF, JPG, PNG or ZIP, up to 15 MB each."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {DOCS.map((doc) => (
          <DocUpload key={doc.key} doc={doc} />
        ))}
      </div>
    </SectionCard>
  );
}

function DocUpload({ doc }: { doc: (typeof DOCS)[number] }) {
  const { verificationDocs, setVerificationDoc } = useOnboardingStore();
  const value = verificationDocs[doc.key];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  async function onFile(file?: File) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError('That file is over 15 MB.');
      return;
    }
    setError('');
    setUploading(true);
    try {
      setVerificationDoc(doc.key, await onboardingApi.uploadDoc(doc.key, file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-gray-700">
        {doc.label}
        {doc.required && <span className="ml-0.5 text-[#F0594C]">*</span>}
      </span>
      <input ref={ref} type="file" accept=".pdf,image/*,.zip" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center justify-between rounded-xl border border-[#4A80F5]/40 bg-[#EAF1FE] px-3.5 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm text-[#2E5BD7]">
            <CheckCircle2 size={15} className="shrink-0" />
            <span className="truncate">{value.name}</span>
          </span>
          <button
            type="button"
            onClick={() => setVerificationDoc(doc.key, null)}
            aria-label={`Remove ${doc.label}`}
            className="ml-2 cursor-pointer text-[#2E5BD7]/60 hover:text-[#2E5BD7]"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => ref.current?.click()}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3.5 py-3 text-sm text-gray-500 transition-colors hover:border-[#4A80F5] hover:text-[#4A80F5] disabled:cursor-wait"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Uploading…' : 'Choose file'}
        </button>
      )}
      <span className={cn('mt-1 block text-xs', error ? 'text-[#F0594C]' : 'text-gray-400')}>{error || doc.hint}</span>
    </div>
  );
}
