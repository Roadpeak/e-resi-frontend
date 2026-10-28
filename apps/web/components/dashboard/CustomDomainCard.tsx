'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Globe, Loader2, RefreshCw } from 'lucide-react';
import { propertiesApi } from '../../lib/api/properties';
import { ApiError } from '../../lib/api/client';

/** Cleans what someone pastes ("https://www.Heris.co.ke/") down to the stored form. */
export function cleanDomain(input: string) {
  return input.trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, '').replace(/[/?#].*$/, '').replace(/:\d+$/, '')
    .replace(/\.$/, '').replace(/^www\./, '');
}

/**
 * A whole domain (herisresidence.co.ke) rather than a subdomain of one
 * (tours.dev.co.ke). Kenyan second-level zones (.co.ke, .or.ke…) count as
 * part of the suffix.
 */
export function isApexDomain(domain: string) {
  return domain.split('.').length <= (/\.(co|or|ac|go|ne|sc|me|info|mobi)\.ke$/.test(domain) ? 3 : 2);
}

export function isValidDomain(domain: string) {
  return /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) && !/(^|\.)e-resi\.com$/.test(domain);
}

/**
 * Developer-side custom domain: attach a domain they own, see whether it is
 * connected yet. Connecting happens on e-resi's side (Cloudflare), so the
 * card says what the developer must do and what we do, and checks live.
 */
export function CustomDomainCard({
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
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const status = useQuery({
    queryKey: ['domain-status', slug, current],
    queryFn: () => propertiesApi.domainStatus(slug),
    enabled: !!current && !editing,
    staleTime: 60_000,
  });

  const domain = cleanDomain(value);
  const valid = isValidDomain(domain);

  async function save(next: string) {
    setSaving(true);
    setError('');
    try {
      await propertiesApi.updateBranding(slug, { customDomain: next });
      await queryClient.invalidateQueries({ queryKey: ['property', slug] });
      await queryClient.invalidateQueries({ queryKey: ['dash-property', slug] });
      setEditing(!next);
      if (!next) setValue('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save the domain');
    } finally {
      setSaving(false);
    }
  }

  const live = status.data?.live;

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <div className="flex items-start gap-3">
        <Globe size={18} className="mt-1 shrink-0 text-[#5f6368]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-normal text-[#202124]">Custom domain</h3>
          <p className="text-sm text-[#5f6368]">
            Show this development on your own web address, e.g. <span className="text-[#202124]">herisresidence.co.ke</span>,
            with its tours, units and booking — no e-resi link needed.
          </p>
        </div>
      </div>

      {editing ? (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="yourdevelopment.co.ke"
              className="h-11 min-w-[240px] flex-1 rounded-xl border border-[#dadce0] px-4 text-[15px] outline-none focus:border-[#1a73e8]"
            />
            <button
              type="button"
              onClick={() => save(domain)}
              disabled={!valid || saving}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1a73e8] px-6 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 size={14} className="animate-spin" />} Connect domain
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
          {value && !valid && (
            <p className="text-[13px] text-[#c5221f]">Enter just the domain, like yourdevelopment.co.ke</p>
          )}
          <p className="text-[13px] leading-relaxed text-[#5f6368]">
            Use a domain you already own. Don&apos;t have one yet? Buy it from any registrar
            (for .co.ke, a KENIC-accredited one) first, then add it here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://${current}`}
              target="_blank"
              rel="noreferrer"
              className="text-[16px] font-medium text-[#1a73e8] hover:underline"
            >
              {current}
            </a>
            {status.isLoading || status.isFetching ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f4] px-3 py-1 text-[12px] text-[#5f6368]">
                <Loader2 size={12} className="animate-spin" /> Checking
              </span>
            ) : live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-1 text-[12px] font-medium text-[#188038]">
                <CheckCircle2 size={12} /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef7e0] px-3 py-1 text-[12px] font-medium text-[#b06000]">
                <Clock size={12} /> {published ? 'Being connected' : 'Goes live when approved'}
              </span>
            )}
            <div className="ml-auto flex gap-2">
              {!live && (
                <button
                  type="button"
                  onClick={() => status.refetch()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
                >
                  <RefreshCw size={13} /> Check again
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4] cursor-pointer"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => save('')}
                disabled={saving}
                className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#c5221f] hover:bg-[#fce8e6] disabled:opacity-50 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>

          {!live && current && (
            <div className="rounded-2xl bg-[#f8f9fa] p-4 text-[14px] leading-relaxed text-[#3c4043]">
              <p className="font-medium text-[#202124]">What happens next</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>Our team sets {current} up on e-resi — usually within one business day.</li>
                {isApexDomain(current) ? (
                  <li>
                    We&apos;ll send you two <b>nameservers</b>. Replace the current ones with them in your
                    domain registrar&apos;s dashboard. If you use this domain for email, tell us first so
                    your email keeps working.
                  </li>
                ) : (
                  <li>We&apos;ll send you one <b>DNS record</b> to add wherever your domain&apos;s DNS is managed.</li>
                )}
                <li>Once the change spreads (often under an hour), this shows <b>Live</b> and the address opens your development.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-[#c5221f]">{error}</p>}
    </div>
  );
}
