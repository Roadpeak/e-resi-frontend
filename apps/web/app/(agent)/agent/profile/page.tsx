'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Trash2, Upload } from 'lucide-react';
import {
  ALL_SPECIALTIES,
  COMPANY_DOCUMENT_TYPES,
  INDIVIDUAL_DOCUMENT_TYPES,
  SPECIALTY_LABELS,
  agentsApi,
  type AgentDocument,
  type AgentSpecialty,
} from '../../../../lib/api/agents';
import { uploadFile } from '../../../../lib/api/media';
import { ApiError } from '../../../../lib/api/client';
import { AgentStatusBanner } from '../../../../components/agent/AgentStatusBanner';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-6';
const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[15px] text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';

export default function AgentProfilePage() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useQuery({
    queryKey: ['agent', 'me'],
    queryFn: () => agentsApi.me(),
  });

  const [form, setForm] = useState({
    displayName: '', bio: '', yearsExperience: '', website: '',
    phone: '', whatsapp: '', email: '', officeAddress: '', location: '',
  });
  const [specialties, setSpecialties] = useState<AgentSpecialty[]>([]);
  const [areas, setAreas] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!me) return;
    setForm({
      displayName: me.displayName ?? '',
      bio: me.bio ?? '',
      yearsExperience: me.yearsExperience ? String(me.yearsExperience) : '',
      website: me.website ?? '',
      phone: me.phone ?? '',
      whatsapp: me.whatsapp ?? '',
      email: me.email ?? '',
      officeAddress: me.officeAddress ?? '',
      location: me.location ?? '',
    });
    setSpecialties(me.specialties ?? []);
    setAreas((me.serviceAreas ?? []).join(', '));
  }, [me]);

  const save = useMutation({
    mutationFn: () => {
      const years = Number.parseInt(form.yearsExperience, 10);
      return agentsApi.updateMe({
        displayName: form.displayName.trim() || undefined,
        bio: form.bio.trim() || undefined,
        yearsExperience: Number.isFinite(years) ? years : undefined,
        website: form.website.trim() || undefined,
        phone: form.phone.trim() || undefined,
        // wa.me needs bare digits, so strip anything the agent typed.
        whatsapp: form.whatsapp.replace(/\D/g, '') || undefined,
        email: form.email.trim() || undefined,
        officeAddress: form.officeAddress.trim() || undefined,
        location: form.location.trim() || undefined,
        specialties: specialties.length ? specialties : undefined,
        serviceAreas: areas.split(',').map((a) => a.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'me'] });
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save your profile'),
  });

  if (isLoading || !me) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={26} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  const isCompany = me.kind === 'COMPANY';

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">My profile</h1>
        <p className="text-[14px] text-[#5f6368]">
          This is what buyers and tenants see in the agent directory.
        </p>
      </div>

      <AgentStatusBanner />

      <AvatarCard me={me} isCompany={isCompany} />

      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className={cn(cardCls, 'space-y-4')}
      >
        <h2 className="text-[18px] font-normal text-[#202124]">Details</h2>

        <Field label={isCompany ? 'Company name' : 'Professional name'} required>
          <input
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className={inputCls}
            required
          />
        </Field>

        <Field label="About" hint="What you do, the areas you know, how you work">
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={4}
            maxLength={2000}
            className={inputCls}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Years of experience">
            <input
              type="number"
              min={0}
              max={80}
              value={form.yearsExperience}
              onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Website">
            <input
              type="url"
              placeholder="https://"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="What you handle" required hint="You appear in searches for these only">
          <div className="flex flex-wrap gap-2">
            {ALL_SPECIALTIES.map((s) => {
              const on = specialties.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecialties((prev) =>
                    on ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors cursor-pointer',
                    on
                      ? 'bg-[#0b57d0] text-white'
                      : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]',
                  )}
                >
                  {SPECIALTY_LABELS[s]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Areas you cover" hint="Comma separated — Kilimani, Westlands, Karen">
          <input
            value={areas}
            onChange={(e) => setAreas(e.target.value)}
            className={inputCls}
          />
        </Field>

        <h2 className="pt-2 text-[18px] font-normal text-[#202124]">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+254712345678"
              className={inputCls}
            />
          </Field>
          <Field label="WhatsApp" hint="Digits only — used for the WhatsApp button">
            <input
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              placeholder="254712345678"
              className={inputCls}
            />
          </Field>
          <Field label="Public email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Location" hint="Shown on your card">
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Nairobi, Kilimani"
              className={inputCls}
            />
          </Field>
        </div>

        {isCompany && (
          <Field label="Office address">
            <input
              value={form.officeAddress}
              onChange={(e) => setForm((f) => ({ ...f, officeAddress: e.target.value }))}
              className={inputCls}
            />
          </Field>
        )}

        {error && (
          <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[13px] text-[#c5221f]">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-[#f1f3f4] pt-4">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#188038]">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-50"
          >
            {save.isPending && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </form>

      <VerificationCard me={me} isCompany={isCompany} />
    </div>
  );
}

function Field({
  label, hint, required, children,
}: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">
        {label}{required && <span className="text-[#c5221f]"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-[#80868b]">{hint}</p>}
    </div>
  );
}

/** Logo for companies, passport photo for individuals. */
function AvatarCard({ me, isCompany }: { me: { logoUrl: string | null; photoUrl: string | null }; isCompany: boolean }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const current = isCompany ? me.logoUrl : me.photoUrl;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await uploadFile(file, isCompany ? 'logos' : 'avatars');
      await agentsApi.updateMe(isCompany ? { logoUrl: uploaded.url } : { photoUrl: uploaded.url });
      queryClient.invalidateQueries({ queryKey: ['agent', 'me'] });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cn(cardCls, 'flex items-center gap-4')}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <span className={cn(
        'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#f1f3f4]',
        isCompany ? 'rounded-2xl' : 'rounded-full',
      )}>
        {current
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={current} alt="" className="h-full w-full object-cover" />
          : <Upload size={20} className="text-[#80868b]" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[#202124]">
          {isCompany ? 'Company logo' : 'Your photo'}
        </p>
        <p className="text-[13px] text-[#5f6368]">
          {isCompany
            ? 'Shown on your card and profile.'
            : 'A passport-style photo — buyers pick a person, so this matters.'}
        </p>
      </div>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="shrink-0 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer disabled:opacity-50"
      >
        {busy ? 'Uploading…' : current ? 'Replace' : 'Upload'}
      </button>
    </div>
  );
}

/**
 * KYC submission. What is required differs by kind, and the form says so
 * up front rather than letting the agent submit and be rejected.
 */
function VerificationCard({
  me, isCompany,
}: {
  me: { kybStatus: string; kybDocuments: AgentDocument[] | null; registrationNumber: string | null; officeAddress: string | null; photoUrl: string | null };
  isCompany: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const types = isCompany ? COMPANY_DOCUMENT_TYPES : INDIVIDUAL_DOCUMENT_TYPES;

  const [docs, setDocs] = useState<AgentDocument[]>([]);
  const [docType, setDocType] = useState<string>(types[0].value);
  const [registrationNumber, setRegistrationNumber] = useState(me.registrationNumber ?? '');
  const [officeAddress, setOfficeAddress] = useState(me.officeAddress ?? '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const locked = me.kybStatus === 'PENDING' || me.kybStatus === 'APPROVED';

  const submit = useMutation({
    mutationFn: () => agentsApi.submitKyc({
      documents: docs,
      registrationNumber: registrationNumber.trim() || undefined,
      officeAddress: officeAddress.trim() || undefined,
      photoUrl: me.photoUrl ?? undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', 'me'] });
      setDocs([]);
      setError('');
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not submit your documents'),
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadFile(file, 'documents');
      setDocs((prev) => [...prev, { type: docType, url: uploaded.url, label: file.name }]);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cardCls} id="verification">
      <h2 className="text-[18px] font-normal text-[#202124]">Verification</h2>
      <p className="mt-0.5 text-[14px] text-[#5f6368]">
        {isCompany
          ? 'Companies verify with a registration document, registration number and physical office address.'
          : 'Individual agents verify with a national ID and a passport-style photo.'}
      </p>

      {locked ? (
        <p className="mt-4 rounded-2xl bg-[#f1f3f4] px-4 py-3 text-[14px] text-[#5f6368]">
          {me.kybStatus === 'APPROVED'
            ? 'Your account is verified. Contact support if your details change.'
            : 'Your documents are under review — nothing further is needed right now.'}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {isCompany && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Registration number" required>
                <input
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Physical office address" required>
                <input
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {!isCompany && !me.photoUrl && (
            <p className="rounded-2xl bg-[#fef7e0] px-4 py-3 text-[13px] text-[#b06000]">
              Upload your passport-style photo above before submitting — it is required.
            </p>
          )}

          <Field label="Add a document">
            <div className="flex flex-wrap gap-2">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className={cn(inputCls, 'w-auto flex-1 min-w-[200px] cursor-pointer')}
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}{'required' in t && t.required ? ' (required)' : ''}
                  </option>
                ))}
              </select>
              <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={onFile} />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload file'}
              </button>
            </div>
          </Field>

          {docs.length > 0 && (
            <ul className="space-y-1.5">
              {docs.map((d, i) => (
                <li key={`${d.url}-${i}`} className="flex items-center gap-3 rounded-xl bg-[#f8f9fa] px-3.5 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-[14px] text-[#202124]">
                    {d.label ?? d.url}
                  </span>
                  <span className="shrink-0 text-[12px] text-[#5f6368]">
                    {types.find((t) => t.value === d.type)?.label ?? d.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocs((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Remove"
                    className="shrink-0 text-[#80868b] hover:text-[#c5221f] cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[13px] text-[#c5221f]">{error}</p>
          )}

          <button
            onClick={() => submit.mutate()}
            disabled={docs.length === 0 || submit.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-40"
          >
            {submit.isPending && <Loader2 size={14} className="animate-spin" />}
            Submit for verification
          </button>
        </div>
      )}

      {me.kybDocuments && me.kybDocuments.length > 0 && (
        <div className="mt-5 border-t border-[#f1f3f4] pt-4">
          <p className="mb-2 text-[13px] font-medium text-[#5f6368]">Submitted documents</p>
          <ul className="space-y-1">
            {me.kybDocuments.map((d, i) => (
              <li key={`${d.url}-${i}`} className="truncate text-[13px] text-[#5f6368]">
                {d.label ?? d.type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
