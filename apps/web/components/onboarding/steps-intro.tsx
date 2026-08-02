'use client';

import { useEffect } from 'react';
import { Building2, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useOnboardingStore, type VerificationDocKey } from '../../lib/stores/onboarding.store';
import { apiClient } from '../../lib/api/client';
import {
  Field, FieldGrid, FilePicker, SectionCard, Select, TextArea, TextInput,
} from './ui';

// ── Step 1: Welcome ──────────────────────────────────────────────────────────

/**
 * What the flow will actually ask for. Someone who has clicked "become a
 * developer" has already decided — they need to know what is ahead, not why.
 */
const WHAT_TO_EXPECT = [
  { icon: Building2, title: 'Your company', body: 'Name, registration number and where you operate.' },
  { icon: ShieldCheck, title: 'Verification', body: 'Certificate of incorporation, KRA PIN and an ID.' },
  { icon: Sparkles, title: 'Production', body: 'Choose the photography, 3D and VR services you want.' },
];

export function StepWelcome() {
  return (
    <div className="mx-auto max-w-xl">
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
    if (!company.companyName) {
      apiClient
        .get<{ success: boolean; data: { companyName?: string } }>('/users/developers/me')
        .then((res) => {
          const name = res?.data?.companyName;
          if (name) patchCompany({ companyName: name });
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
          <Field label="Registration number" required>
            <TextInput value={company.registrationNumber} onChange={(e) => patchCompany({ registrationNumber: e.target.value })} placeholder="PVT-XXXXXXX" />
          </Field>
          <Field label="Tax PIN" required>
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
        <Field label="Company logo" hint="PNG or SVG, at least 512×512">
          <FilePicker accept="image/*" value={company.logoName} onChange={(logoName) => patchCompany({ logoName })} />
        </Field>
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

// ── Step 3: Verification ─────────────────────────────────────────────────────

const DOCS: { key: VerificationDocKey; label: string; hint: string; required?: boolean }[] = [
  { key: 'registrationCert', label: 'Business registration certificate', hint: 'Certificate of incorporation or equivalent', required: true },
  { key: 'taxCert', label: 'Tax compliance certificate', hint: 'Current KRA tax compliance certificate', required: true },
  { key: 'directorId', label: 'Director identification', hint: 'National ID or passport of a listed director', required: true },
  { key: 'proofOfAddress', label: 'Proof of address', hint: 'Utility bill or lease dated within 3 months' },
  { key: 'companyLogo', label: 'Company logo', hint: 'High-resolution PNG or vector' },
  { key: 'brandAssets', label: 'Brand assets', hint: 'Brand guidelines, fonts, or press kit (optional)' },
];

export function StepVerification() {
  const { verificationDocs, setVerificationDoc } = useOnboardingStore();
  return (
    <SectionCard
      title="Business verification"
      subtitle="These documents are reviewed by our compliance team and never shown publicly. Verified developers get a badge on every listing."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {DOCS.map((doc) => (
          <Field key={doc.key} label={doc.label} required={doc.required} hint={doc.hint}>
            <FilePicker
              accept=".pdf,image/*,.zip"
              value={verificationDocs[doc.key]}
              onChange={(name) => setVerificationDoc(doc.key, name)}
            />
          </Field>
        ))}
      </div>
    </SectionCard>
  );
}
