'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, Copy, Globe, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { fmtMoney, propertiesApi, type DomainStatus } from '../../lib/api/properties';
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
    // Always on: before a domain is added it still supplies the price.
    staleTime: 60_000,
    // While waiting on the developer's DNS change, keep the page current.
    refetchInterval: (q) => (q.state.data?.live ? false : 60_000),
  });

  const domain = cleanDomain(value);
  const valid = isValidDomain(domain);
  const [checking, setChecking] = useState(false);

  async function checkNow() {
    setChecking(true);
    setError('');
    try {
      const fresh = await propertiesApi.domainCheck(slug);
      queryClient.setQueryData(['domain-status', slug, current], fresh);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not check the domain');
    } finally {
      setChecking(false);
    }
  }

  async function save(next: string) {
    setSaving(true);
    setError('');
    try {
      await propertiesApi.updateBranding(slug, { customDomain: next });
      await queryClient.invalidateQueries({ queryKey: ['domain-status', slug] });
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
          <PriceNote status={status.data} />
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
            <StateChip status={status.data} loading={status.isLoading || checking} published={published} />
            <div className="ml-auto flex flex-wrap gap-2">
              {!live && status.data?.state !== 'AWAITING_PAYMENT' && status.data?.state !== 'SUSPENDED' && (
                <button
                  type="button"
                  onClick={checkNow}
                  disabled={checking}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
                  {status.data?.state === 'ERROR' ? 'Try again' : 'Check now'}
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
                onClick={() => {
                  if (window.confirm(`Disconnect ${current}? It will stop opening this development.`)) save('');
                }}
                disabled={saving}
                className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] text-[#c5221f] hover:bg-[#fce8e6] disabled:opacity-50 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>

          {!live && status.data && <NextSteps domain={current!} status={status.data} published={published} />}
          {status.data?.billing?.mode === 'MONTHLY' && status.data.billing.paidThrough && status.data.state !== 'AWAITING_PAYMENT' && (
            <p className="text-[13px] text-[#5f6368]">
              {fmtMoney(status.data.billing.fee ?? 0, status.data.prices?.currency ?? 'KES')}/month · paid until{' '}
              {new Date(status.data.billing.paidThrough).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
              We invoice the next month a few days before.
            </p>
          )}
          {status.data?.checkedAt && !live && (
            <p className="text-[12px] text-[#80868b]">
              Checked {timeAgo(status.data.checkedAt)}. We keep checking every 10 minutes and email you once it&apos;s live.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-[#c5221f]">{error}</p>}
    </div>
  );
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} h ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function StateChip({ status, loading, published }: { status?: DomainStatus; loading: boolean; published: boolean }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium';
  if (loading) {
    return <span className={`${base} bg-[#f1f3f4] font-normal text-[#5f6368]`}><Loader2 size={12} className="animate-spin" /> Checking</span>;
  }
  if (status?.live) {
    return <span className={`${base} bg-[#e6f4ea] text-[#188038]`}><CheckCircle2 size={12} /> Live</span>;
  }
  if (status?.state === 'AWAITING_PAYMENT') {
    return <span className={`${base} bg-[#fef7e0] text-[#b06000]`}><Clock size={12} /> Awaiting payment</span>;
  }
  if (status?.state === 'SUSPENDED') {
    return <span className={`${base} bg-[#fce8e6] text-[#c5221f]`}><AlertCircle size={12} /> Paused — unpaid</span>;
  }
  if (status?.state === 'ERROR') {
    return <span className={`${base} bg-[#fce8e6] text-[#c5221f]`}><AlertCircle size={12} /> Needs attention</span>;
  }
  if (status?.state === 'ACTIVE' && !published) {
    return <span className={`${base} bg-[#fef7e0] text-[#b06000]`}><Clock size={12} /> Connected — opens when approved</span>;
  }
  if (status?.state === 'ACTIVE') {
    return <span className={`${base} bg-[#e8f0fe] text-[#1967d2]`}><Clock size={12} /> Connected — finishing setup</span>;
  }
  if (status?.state === 'PENDING') {
    return <span className={`${base} bg-[#fef7e0] text-[#b06000]`}><Clock size={12} /> Waiting for your DNS change</span>;
  }
  return <span className={`${base} bg-[#fef7e0] text-[#b06000]`}><Clock size={12} /> Being connected</span>;
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dadce0] bg-white px-4 py-2.5">
      <code className="truncate text-[14px] text-[#202124]">{value}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch { /* copy by hand */ }
        }}
        className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-[#1a73e8] cursor-pointer"
      >
        <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

/** What the developer has to do now, for whichever way the domain is connected. */
function NextSteps({ domain, status, published }: { domain: string; status: DomainStatus; published: boolean }) {
  const box = 'rounded-2xl bg-[#f8f9fa] p-4 text-[14px] leading-relaxed text-[#3c4043]';

  if (status.state === 'AWAITING_PAYMENT' || status.state === 'SUSPENDED') {
    const inv = status.billing?.invoice;
    const monthly = status.billing?.mode === 'MONTHLY';
    return (
      <div className={box}>
        <p className="font-medium text-[#202124]">
          {status.state === 'SUSPENDED' ? `${domain} is paused until the monthly fee is paid` : `Pay to connect ${domain}`}
        </p>
        <p className="mt-1">
          {inv ? (
            <>Invoice {inv.number} for <b>{fmtMoney(inv.total, inv.currency)}</b> (incl. VAT){monthly ? ', billed monthly' : ', one-time'}. </>
          ) : null}
          {status.state === 'SUSPENDED'
            ? 'It comes back the moment it is paid.'
            : 'As soon as it is paid we set the domain up and show you the next step here.'}
        </p>
        <Link
          href="/dashboard/billing"
          className="mt-3 inline-flex items-center rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc]"
        >
          Pay now
        </Link>
      </div>
    );
  }

  if (status.state === 'ERROR') {
    return (
      <div className="rounded-2xl border border-[#f5c6c4] bg-[#fef7f6] p-4 text-[14px] leading-relaxed text-[#3c4043]">
        <p className="font-medium text-[#202124]">We couldn&apos;t set up {domain}</p>
        {status.error && <p className="mt-1 text-[13px] text-[#5f6368]">{status.error}</p>}
        <p className="mt-2">Check the spelling and that you own the domain, then press Try again. Our team has been notified.</p>
      </div>
    );
  }

  if (status.state === 'ACTIVE') {
    return (
      <div className={box}>
        Your DNS change is through and the secure certificate is being issued — usually a few minutes.
        {!published && ' The address opens once your development is approved.'}
      </div>
    );
  }

  if (status.method === 'nameservers' && status.nameservers?.length) {
    return (
      <div className={box}>
        <p className="font-medium text-[#202124]">One step left: switch your nameservers</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Sign in where you bought {domain} (your registrar or hosting provider).</li>
          <li>Find <b>Nameservers</b> (sometimes under DNS or Domain settings) and choose custom nameservers.</li>
          <li>Replace the existing ones with these two, exactly:</li>
        </ol>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {status.nameservers.map((ns) => <CopyValue key={ns} value={ns} />)}
        </div>
        <p className="mt-3 text-[13px] text-[#5f6368]">
          We copied the domain&apos;s existing records, so email on {domain} should keep working. The change usually
          takes under an hour, occasionally up to 24.
        </p>
      </div>
    );
  }

  if (status.method === 'cname' && status.cnameTarget) {
    return (
      <div className={box}>
        <p className="font-medium text-[#202124]">One step left: add this DNS record</p>
        <p className="mt-1">Where {domain.split('.').slice(1).join('.')}&apos;s DNS is managed, add:</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div><p className="mb-1 text-[12px] text-[#80868b]">Type</p><CopyValue value="CNAME" /></div>
          <div><p className="mb-1 text-[12px] text-[#80868b]">Name</p><CopyValue value={domain.split('.')[0]} /></div>
          <div><p className="mb-1 text-[12px] text-[#80868b]">Target</p><CopyValue value={status.cnameTarget} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className={box}>
      <p className="font-medium text-[#202124]">What happens next</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5">
        <li>Our team sets {domain} up on e-resi — usually within one business day.</li>
        {isApexDomain(domain) ? (
          <li>We&apos;ll send you two <b>nameservers</b> to set at your domain registrar.</li>
        ) : (
          <li>We&apos;ll send you one <b>DNS record</b> to add wherever your domain&apos;s DNS is managed.</li>
        )}
        <li>Once the change spreads, this shows <b>Live</b>.</li>
      </ol>
    </div>
  );
}

/** What connecting a domain costs, shown before the developer commits. */
function PriceNote({ status }: { status?: DomainStatus }) {
  const price = status?.prices?.custom;
  if (!price || !status?.prices) return null;
  const b = status.billing;
  const entitled = !!b && !b.invoice && status.state !== 'AWAITING_PAYMENT' && (
    (b.mode === 'ONE_TIME' && b.fee !== null)
    || (b.mode === 'MONTHLY' && !!b.paidThrough && new Date(b.paidThrough) > new Date()));
  if (entitled) return <p className="text-[13px] text-[#188038]">Already paid for this development — no new charge.</p>;
  if (price.amount <= 0) return <p className="text-[13px] text-[#188038]">Free — no charge.</p>;
  return (
    <p className="text-[13px] text-[#3c4043]">
      <b>{fmtMoney(price.amount, status.prices.currency)}</b>
      {price.mode === 'MONTHLY' ? ' per month' : ' one-time'} + VAT. We invoice you when you connect, and the domain
      goes live once it&apos;s paid.
    </p>
  );
}
