'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Copy, Link2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { fmtMoney, propertiesApi } from '../../lib/api/properties';
import { ApiError } from '../../lib/api/client';

const RESERVED = new Set([
  'www', 'app', 'api', 'admin', 'dashboard', 'mail', 'email', 'smtp', 'imap', 'pop', 'ftp', 'cdn',
  'media', 'static', 'assets', 'img', 'images', 'files', 'docs', 'help', 'support', 'status', 'blog',
  'news', 'staging', 'dev', 'test', 'qa', 'preview', 'beta', 'demo', 'auth', 'login', 'account',
  'accounts', 'billing', 'pay', 'payments', 'secure', 'domains', 'domain', 'e-resi', 'eresi',
  'agent', 'agents', 'developer', 'developers', 'm', 'ns1', 'ns2',
]);

/** Mirrors the API's rule so mistakes show before saving. */
function labelProblem(label: string) {
  if (!label) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(label)) {
    return 'Use 3–63 letters, numbers or hyphens, not starting or ending with a hyphen.';
  }
  if (RESERVED.has(label)) return 'That address is reserved.';
  return null;
}

/**
 * The free <name>.e-resi.com address every development gets. Works without
 * any DNS on the developer's side, so it is the link to share until (or
 * instead of) their own domain.
 */
export function EresiAddressCard({
  slug,
  current,
  published,
}: {
  slug: string;
  current?: string | null;
  published: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(!current);
  const [value, setValue] = useState(current ?? slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const status = useQuery({
    queryKey: ['domain-status', slug, 'sub', current],
    queryFn: () => propertiesApi.domainStatus(slug),
    enabled: !!current,
    staleTime: 60_000,
  });

  const label = value.trim().toLowerCase().replace(/\.e-resi\.com\.?$/, '');
  const problem = labelProblem(label);
  const host = current ? `${current}.e-resi.com` : null;

  async function save() {
    setSaving(true);
    setError('');
    try {
      await propertiesApi.updateBranding(slug, { subdomain: label });
      await queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
      setEditing(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save the address');
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    if (!host) return;
    try {
      await navigator.clipboard.writeText(`https://${host}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the link is still visible to copy by hand */
    }
  }

  const live = status.data?.subdomainLive;
  const active = status.data?.subdomainActive;
  const openInvoice = status.data?.subdomainInvoice;
  const fee = status.data?.prices?.subdomain.amount ?? 0;
  const currency = status.data?.prices?.currency ?? 'KES';
  const [activating, setActivating] = useState(false);

  async function activate() {
    setActivating(true);
    setError('');
    try {
      await propertiesApi.activateSubdomain(slug);
      await queryClient.invalidateQueries({ queryKey: ['domain-status', slug] });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not activate the address');
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <div className="flex items-start gap-3">
        <Link2 size={18} className="mt-1 shrink-0 text-[#5f6368]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-normal text-[#202124]">e-resi address</h3>
          <p className="text-sm text-[#5f6368]">
            A short address for this development on e-resi — easy to share with buyers and agents.
          </p>
        </div>
      </div>

      {editing ? (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="flex h-11 min-w-[260px] flex-1 items-center overflow-hidden rounded-xl border border-[#dadce0] focus-within:border-[#1a73e8]">
              <span className="pl-4 text-[15px] text-[#80868b]">https://</span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-full min-w-0 flex-1 px-1 text-[15px] text-[#202124] outline-none"
                placeholder="yourdevelopment"
                spellCheck={false}
              />
              <span className="pr-4 text-[15px] text-[#80868b]">.e-resi.com</span>
            </div>
            <button
              type="button"
              onClick={save}
              disabled={!label || !!problem || saving || label === current}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1a73e8] px-6 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Save address
            </button>
            {current && (
              <button
                type="button"
                onClick={() => { setEditing(false); setValue(current); setError(''); }}
                className="h-11 rounded-full border border-[#dadce0] px-5 text-[14px] text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          {problem && <p className="text-[13px] text-[#c5221f]">{problem}</p>}
          {current && (
            <p className="text-[13px] text-[#5f6368]">
              Changing it stops the old address working, so update any links you have already shared.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a href={`https://${host}`} target="_blank" rel="noreferrer" className="text-[16px] font-medium text-[#1a73e8] hover:underline">
            {host}
          </a>
          {status.data && !active ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f4] px-3 py-1 text-[12px] font-medium text-[#5f6368]">
              {openInvoice ? 'Awaiting payment' : 'Not active'}
            </span>
          ) : !published ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef7e0] px-3 py-1 text-[12px] font-medium text-[#b06000]">
              <Clock size={12} /> Opens once approved
            </span>
          ) : status.isLoading || status.isFetching ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f4] px-3 py-1 text-[12px] text-[#5f6368]">
              <Loader2 size={12} className="animate-spin" /> Checking
            </span>
          ) : live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1 text-[12px] font-medium text-[#188038]">
              <CheckCircle2 size={12} /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef7e0] px-3 py-1 text-[12px] font-medium text-[#b06000]">
              <Clock size={12} /> Not reachable yet
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
            >
              <Copy size={13} /> {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {!editing && current && status.data && !active && (
        <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-4 text-[14px] leading-relaxed text-[#3c4043]">
          {openInvoice ? (
            <>
              <p>
                Invoice {openInvoice.number} for <b>{fmtMoney(openInvoice.total, openInvoice.currency)}</b> (incl. VAT)
                is waiting. {host} switches on as soon as it&apos;s paid.
              </p>
              <Link href="/dashboard/billing" className="mt-3 inline-flex rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]">
                Pay now
              </Link>
            </>
          ) : (
            <>
              <p>
                Get {host} for this development
                {fee > 0 ? <> — <b>{fmtMoney(fee, currency)}</b> one-time + VAT.</> : ' — free.'}
              </p>
              <button
                type="button"
                onClick={activate}
                disabled={activating}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50 cursor-pointer"
              >
                {activating && <Loader2 size={14} className="animate-spin" />}
                {fee > 0 ? 'Get this address' : 'Activate address'}
              </button>
            </>
          )}
        </div>
      )}

      <p className="mt-4 text-[13px] text-[#80868b]">
        The standard link <span className="text-[#5f6368]">e-resi.com/{slug}</span> keeps working too.
      </p>
      {error && <p className="mt-3 text-[13px] text-[#c5221f]">{error}</p>}
    </div>
  );
}
