'use client';

/** Small drawn thumbnail per template: palette, type and layout at a glance. */
export function TemplateThumb({ k }: { k: string }) {
  const t: Record<string, { bg: string; ink: string; serif?: boolean; dark?: boolean; layout: 'classic' | 'framed' | 'full' | 'sidebar' | 'arch' | 'bento' | 'text' }> = {
    CLASSIC: { bg: '#ffffff', ink: '#111', layout: 'classic' },
    HAVEN: { bg: '#f6f4ef', ink: '#1d1c1a', layout: 'framed' },
    ATELIER: { bg: '#121211', ink: '#fff', dark: true, layout: 'full' },
    MERIDIAN: { bg: '#efe9df', ink: '#26231f', serif: true, layout: 'full' },
    TERRACE: { bg: '#efebe4', ink: '#1a1916', layout: 'full' },
    PORTAL: { bg: '#f4f4f2', ink: '#141414', layout: 'sidebar' },
    ARCADIA: { bg: '#f7f0e6', ink: '#2a2420', layout: 'arch' },
    CREST: { bg: '#ffffff', ink: '#0f1724', dark: true, layout: 'full' },
    NEST: { bg: '#ffffff', ink: '#111111', layout: 'bento' },
    LINEA: { bg: '#ececea', ink: '#151515', layout: 'text' },
    ROAM: { bg: '#ffffff', ink: '#0d0d0d', layout: 'text' },
    SUMMIT: { bg: '#ebebe8', ink: '#161616', layout: 'full' },
    METRO: { bg: '#f0f0ee', ink: '#101010', dark: true, layout: 'full' },
    RESIDENCE: { bg: '#f6f3ee', ink: '#1b1a18', layout: 'framed' },
  };
  const c = t[k] ?? t.CLASSIC;
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#e8eaed]" style={{ background: c.bg }}>
      {c.layout === 'classic' && (<>
        <div className="h-3 border-b border-black/5 bg-white" />
        <div className="mx-3 mt-2 h-14 rounded bg-[#d7dbe0]" />
        <div className="mx-3 mt-2 grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-8 rounded bg-[#eceef1]" />)}</div>
      </>)}
      {c.layout === 'framed' && (<>
        <div className="mx-auto mt-2 h-2.5 w-2/3 rounded-full bg-white" />
        <div className="mx-auto mt-3 h-2 w-1/2 rounded bg-black/70" />
        <div className="mx-auto mt-1 h-2 w-1/3 rounded bg-black/70" />
        <div className="mx-4 mt-3 h-12 rounded-xl bg-[#cfc6b8]" />
      </>)}
      {c.layout === 'sidebar' && (<>
        <div className="absolute inset-y-0 left-0 w-1/5 border-r border-black/5 bg-white" />
        <div className="absolute left-[24%] right-3 top-3 h-12 rounded-lg bg-[#c9c9c4]" />
        <div className="absolute bottom-3 left-[24%] right-3 grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-7 rounded bg-white" />)}</div>
      </>)}
      {c.layout === 'bento' && (
        <div className="absolute inset-2 grid grid-cols-[1fr_1.6fr_0.9fr] grid-rows-2 gap-1">
          <div className="rounded-md bg-[#111]" /><div className="row-span-2 rounded-md bg-[#c9c6c0]" /><div className="row-span-2 rounded-md bg-[#f1f1f3]" />
          <div className="grid grid-cols-2 gap-1"><div className="rounded-md bg-[#6d4aff]" /><div className="rounded-md bg-[#f1f1f3]" /></div>
        </div>
      )}
      {c.layout === 'text' && (<>
        <div className="mx-3 mt-4 h-2.5 w-4/5 rounded bg-black/80" />
        <div className="mx-3 mt-1.5 flex items-center gap-1"><div className="h-2.5 w-1/3 rounded bg-black/30" /><div className="h-3 w-3 rounded-full bg-[#c8a07a]" /><div className="h-2.5 w-1/4 rounded bg-black/80" /></div>
        <div className="mx-3 mt-3 grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-10 rounded bg-[#cfcfca]" />)}</div>
      </>)}
      {c.layout === 'arch' && (<>
        <div className="mx-auto mt-2 h-2.5 w-1/2 rounded-full bg-white" />
        <div className="mx-auto mt-2 h-2 w-2/5 rounded bg-black/70" />
        <div className="absolute bottom-0 left-1/2 h-[55%] w-1/4 -translate-x-1/2 rounded-t-full bg-[#cdb9a1]" />
        <div className="absolute bottom-0 right-[18%] h-1/3 w-[9%] rounded-t-full bg-[#c8643b]" />
        <div className="absolute right-[30%] top-[38%] h-4 w-4 rounded-full bg-[#e0a93b]" />
      </>)}
      {c.layout === 'full' && (<>
        <div className={`absolute inset-0 ${c.dark ? 'bg-[#3a3a38]' : 'bg-[#b9ad9a]'}`} />
        <div className="absolute inset-x-0 top-1/3 text-center text-[22px] leading-none text-white" style={{ fontFamily: c.serif ? 'var(--font-cormorant), Georgia, serif' : undefined, fontWeight: c.serif ? 400 : 600 }}>
          {c.serif ? 'Aa' : 'AA'}
        </div>
        <div className="absolute bottom-2 left-2 h-5 w-14 rounded bg-white/90" />
      </>)}
    </div>
  );
}
