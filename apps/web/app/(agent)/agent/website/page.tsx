'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentSiteApi, type AgentSiteSettings } from '../../../../lib/api/agent-site';
import { billingApi } from '../../../../lib/api/billing';
import { ApiError } from '../../../../lib/api/client';
import { ImageUpload } from '../../../../components/dashboard/ImageUpload';
import { AgentSiteView } from '../../../../components/agent-site/AgentSiteView';
import { cn } from '../../../../lib/utils';

const card = 'rounded-3xl border border-[#dadce0] bg-white p-6';
const input = 'w-full rounded-xl border border-[#dadce0] px-3 py-2.5 text-[15px] text-[#202124] outline-none focus:border-[#1a73e8]';
const btn = 'rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50';
const ghost = 'rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa] disabled:opacity-50';

const money = (n: number, c: string) => (n > 0 ? `${c} ${n.toLocaleString()}` : 'Free');

function PayInvoice({ invoice }: { invoice: NonNullable<AgentSiteSettings['invoice']> }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  async function pay() {
    setBusy(true); setMsg('');
    try {
      const r = await billingApi.payInvoice(invoice.id);
      if (r.paid) { setMsg('Paid'); qc.invalidateQueries({ queryKey: ['agent-site'] }); }
      else window.location.href = r.authorizationUrl;
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Payment could not be started');
    } finally { setBusy(false); }
  }
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[#fef7e0] px-4 py-3">
      <span className="text-[14px] text-[#b06000]">Invoice {invoice.number} · {invoice.currency} {invoice.total.toLocaleString()} due</span>
      <button type="button" onClick={pay} disabled={busy} className={btn}>{busy ? 'Starting…' : 'Pay by card'}</button>
      <Link href="/agent/billing" className={ghost}>M-Pesa / invoice</Link>
      {msg && <span className="text-[13px] text-[#3c4043]">{msg}</span>}
    </div>
  );
}

function Status({ tone, children }: { tone: 'green' | 'amber' | 'red' | 'grey'; children: React.ReactNode }) {
  const cls = { green: 'bg-[#e6f4ea] text-[#188038]', amber: 'bg-[#fef7e0] text-[#b06000]', red: 'bg-[#fce8e6] text-[#c5221f]', grey: 'bg-[#f1f3f4] text-[#5f6368]' }[tone];
  return <span className={cn('rounded-full px-3 py-1 text-[12.5px] font-medium', cls)}>{children}</span>;
}

export default function AgentWebsitePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['agent-site'], queryFn: agentSiteApi.mine });
  const [handle, setHandle] = useState('');
  const [domain, setDomain] = useState('');
  const [tagline, setTagline] = useState('');
  const [accent, setAccent] = useState('#1a73e8');
  const [hero, setHero] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!data) return;
    setHandle(data.handle ?? '');
    setDomain(data.customDomain ?? '');
    setTagline(data.tagline ?? '');
    setAccent(data.accent ?? '#1a73e8');
    setHero(data.heroUrl ?? '');
  }, [data]);

  const done = (msg: string) => (next: AgentSiteSettings) => {
    qc.setQueryData(['agent-site'], next);
    setError(''); setToast(msg); setTimeout(() => setToast(''), 5000);
  };
  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : 'Something went wrong');

  const claim = useMutation({ mutationFn: () => agentSiteApi.claim(handle), onSuccess: done('Address saved'), onError: fail });
  const saveDomain = useMutation({ mutationFn: (d: string | null) => agentSiteApi.setDomain(d), onSuccess: done('Domain saved'), onError: fail });
  const check = useMutation({ mutationFn: agentSiteApi.check, onSuccess: done('Checked'), onError: fail });
  const brand = useMutation({
    mutationFn: () => agentSiteApi.branding({ tagline: tagline || null, accent, heroUrl: hero || null }),
    onSuccess: done('Branding saved'), onError: fail,
  });
  const { data: previewData } = useQuery({ queryKey: ['agent-site-preview', data?.tagline, data?.accent, data?.heroUrl], queryFn: agentSiteApi.preview, enabled: preview });

  if (isLoading || !data) return <div className="p-8 text-[14px] text-[#5f6368]">Loading…</div>;
  const { prices } = data;
  const d = data.domain;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Your website</h1>
          <p className="mt-1 max-w-2xl text-[15px] text-[#5f6368]">
            A branded site of your listings and the developments you&apos;re partnered on, on your own e-resi
            address or your own domain. Share it like your own website.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPreview((v) => !v)} className={ghost}>{preview ? 'Hide preview' : 'Preview'}</button>
          {data.url && <a href={data.url} target="_blank" rel="noreferrer" className={btn}>Open site</a>}
        </div>
      </header>

      {!data.verified && (
        <p className="rounded-2xl bg-[#fef7e0] px-4 py-3 text-[14px] text-[#b06000]">
          Your site goes public once your agent profile is verified and listed. You can set it up now.
        </p>
      )}
      {(toast || error) && (
        <p className={cn('rounded-2xl px-4 py-3 text-[14px]', error ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#e6f4ea] text-[#188038]')}>{error || toast}</p>
      )}

      {/* e-resi address */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[18px] font-normal text-[#202124]">e-resi address</h2>
          {data.activatedAt ? <Status tone="green">Live</Status> : data.invoice ? <Status tone="amber">Awaiting payment</Status> : <Status tone="grey">Not set up</Status>}
        </div>
        <p className="mt-1 text-[14px] text-[#5f6368]">{money(prices.subdomain, prices.currency)}{prices.subdomain > 0 ? ', one-time' : ''}.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[260px] flex-1 items-center rounded-xl border border-[#dadce0] focus-within:border-[#1a73e8]">
            <span className="pl-3 text-[15px] text-[#5f6368]">https://</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              disabled={!!data.activatedAt}
              placeholder="yourname"
              aria-label="Address"
              className="w-full bg-transparent px-1 py-2.5 text-[15px] text-[#202124] outline-none disabled:text-[#5f6368]"
            />
            <span className="pr-3 text-[15px] text-[#5f6368]">.e-resi.com</span>
          </div>
          {!data.activatedAt && (
            <button type="button" onClick={() => claim.mutate()} disabled={claim.isPending || handle.length < 3} className={btn}>
              {claim.isPending ? 'Saving…' : prices.subdomain > 0 ? 'Claim and pay' : 'Activate'}
            </button>
          )}
        </div>
        {data.invoice && <PayInvoice invoice={data.invoice} />}
      </section>

      {/* Custom domain */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[18px] font-normal text-[#202124]">Your own domain</h2>
          {d.status === 'ACTIVE' && <Status tone="green">Live</Status>}
          {d.status === 'PENDING' && <Status tone="amber">Waiting for DNS</Status>}
          {d.status === 'AWAITING_PAYMENT' && <Status tone="amber">Awaiting payment</Status>}
          {d.status === 'ERROR' && <Status tone="red">Needs attention</Status>}
          {d.status === 'MANUAL' && <Status tone="amber">Being connected by e-resi</Status>}
        </div>
        <p className="mt-1 text-[14px] text-[#5f6368]">
          {money(prices.customDomain, prices.currency)}{prices.customDomain > 0 ? ', one-time' : ''}. Use a domain you own, like kellerwilliams.co.ke.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourdomain.co.ke" aria-label="Domain" className={cn(input, 'min-w-[260px] flex-1')} />
          <button type="button" onClick={() => saveDomain.mutate(domain.trim())} disabled={saveDomain.isPending || !domain.trim()} className={btn}>
            {saveDomain.isPending ? 'Saving…' : data.customDomain ? 'Update' : 'Connect'}
          </button>
          {data.customDomain && (
            <button type="button" onClick={() => saveDomain.mutate(null)} disabled={saveDomain.isPending} className={ghost}>Remove</button>
          )}
        </div>
        {d.invoice && <PayInvoice invoice={d.invoice} />}
        {d.status === 'PENDING' && (
          <div className="mt-4 rounded-2xl bg-[#f8f9fa] p-4 text-[14px] text-[#3c4043]">
            {d.provider === 'CLOUDFLARE_ZONE' && d.nameservers.length > 0 ? (
              <>
                <p>At your domain registrar, replace the nameservers for <strong>{data.customDomain}</strong> with:</p>
                <ul className="mt-2 space-y-1 font-mono text-[13px]">{d.nameservers.map((n) => <li key={n}>{n}</li>)}</ul>
              </>
            ) : d.cnameTarget ? (
              <p>Add a CNAME record for <strong>{data.customDomain}</strong> pointing to <code className="font-mono">{d.cnameTarget}</code>.</p>
            ) : (
              <p>We&apos;re connecting your domain. You&apos;ll get a notification when it&apos;s live.</p>
            )}
            <p className="mt-2 text-[13px] text-[#5f6368]">Changes can take up to a few hours. We check automatically every 10 minutes.</p>
            <button type="button" onClick={() => check.mutate()} disabled={check.isPending} className={cn(ghost, 'mt-3')}>{check.isPending ? 'Checking…' : 'Check now'}</button>
          </div>
        )}
        {d.status === 'ERROR' && d.error && <p className="mt-3 text-[13px] text-[#c5221f]">{d.error}</p>}
      </section>

      {/* Branding */}
      <section className={card}>
        <h2 className="text-[18px] font-normal text-[#202124]">Look and feel</h2>
        <p className="mt-1 text-[14px] text-[#5f6368]">Your name, logo, bio and contacts come from your profile.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-[13px] text-[#5f6368]">Headline</span>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={160} placeholder="Homes and developments across Nairobi" className={cn(input, 'mt-1')} />
          </label>
          <label className="block">
            <span className="text-[13px] text-[#5f6368]">Accent colour</span>
            <span className="mt-1 flex items-center gap-2">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-11 w-14 cursor-pointer rounded-xl border border-[#dadce0]" aria-label="Accent colour" />
              <span className="font-mono text-[13px] text-[#5f6368]">{accent}</span>
            </span>
          </label>
        </div>
        <div className="mt-4">
          <ImageUpload value={hero} onChange={setHero} folder="logos" label="Cover image" hint="Wide photo for the top of your site. Leave empty to use a listing photo." />
        </div>
        <button type="button" onClick={() => brand.mutate()} disabled={brand.isPending} className={cn(btn, 'mt-5')}>
          {brand.isPending ? 'Saving…' : 'Save look and feel'}
        </button>
      </section>

      {preview && (
        <section className="overflow-hidden rounded-3xl border border-[#dadce0]">
          <div className="border-b border-[#dadce0] bg-[#f8f9fa] px-4 py-2 text-[13px] text-[#5f6368]">
            Preview{data.url ? ` · ${data.url}` : ''}
          </div>
          <div className="max-h-[80vh] overflow-y-auto">
            {previewData ? <AgentSiteView data={previewData} /> : <p className="p-8 text-[14px] text-[#5f6368]">Loading preview…</p>}
          </div>
        </section>
      )}
    </div>
  );
}
