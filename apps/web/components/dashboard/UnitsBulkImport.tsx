'use client';

import { useRef, useState } from 'react';
import { Download, FileUp, Loader2, X } from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api/client';
import { formatPrice } from '../../lib/utils';

/**
 * Bulk unit import for a development: download a CSV template, fill it in
 * Excel / Google Sheets / Numbers, upload it, check the preview, import.
 *
 * Every row is checked here first, with the problem named against its row
 * number, and the server import is all-or-nothing — so a developer never
 * ends up with half a sheet imported and duplicates on the retry.
 */

interface Plan { id: string; name: string; bedrooms?: number | null }

const COLUMNS = ['Unit name', 'Floor', 'Bedrooms', 'Bathrooms', 'Size (m2)', 'Price', 'Status', 'Floor plan', 'Features'] as const;
const STATUSES = ['AVAILABLE', 'RESERVED', 'SOLD'];
const EXAMPLE = '(example)';

interface ParsedRow {
  line: number;
  name: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqm?: number;
  price?: number;
  status: string;
  floorPlanId?: string;
  planName?: string;
  features: string[];
  errors: string[];
}

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Minimal RFC-4180 parser with delimiter sniffing (Excel uses ; in some locales). */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/)[0] ?? '';
  const delim = [',', ';', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

/** Header cell → field, tolerant of case, asterisks and wording. */
function fieldFor(header: string): keyof ParsedRow | null {
  const h = header.toLowerCase().replace(/[*()]/g, '').trim();
  if (/^(unit )?name|^unit$/.test(h)) return 'name';
  if (h.startsWith('floor plan') || h === 'plan' || h === 'layout') return 'planName';
  if (h.startsWith('floor') || h === 'level') return 'floor';
  if (h.startsWith('bed')) return 'bedrooms';
  if (h.startsWith('bath')) return 'bathrooms';
  if (h.startsWith('size') || h.includes('sqm') || h.includes('m2') || h.includes('area')) return 'sqm';
  if (h.startsWith('price') || h.includes('amount')) return 'price';
  if (h.startsWith('status')) return 'status';
  if (h.startsWith('feature')) return 'features';
  return null;
}

const num = (v: string) => {
  const n = Number(v.replace(/[,\s]/g, '').replace(/^[A-Za-z]{3}/, ''));
  return v.trim() === '' ? undefined : n;
};

export function UnitsBulkImport({
  slug, currency, plans, existingNames, onImported, children,
}: {
  /** Extra controls for the same button row (the "Add unit" button). */
  children?: React.ReactNode;
  slug: string;
  currency: string;
  plans: Plan[];
  existingNames: string[];
  onImported: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const plan = plans[0]?.name ?? '';
    const examples = [
      [`A-101 ${EXAMPLE}`, 1, 2, 2, 95, 12500000, 'AVAILABLE', plan, 'Balcony; Ensuite'],
      [`A-102 ${EXAMPLE}`, 1, 3, 2, 120, 15800000, 'AVAILABLE', plans[1]?.name ?? plan, 'Balcony; DSQ'],
      [`PH-01 ${EXAMPLE}`, 12, 4, 4, 240, 38000000, 'RESERVED', '', 'Rooftop terrace'],
    ];
    const csv = [COLUMNS.join(','), ...examples.map((r) => r.map(csvCell).join(','))].join('\r\n');
    // BOM so Excel reads it as UTF-8 (m², names with accents).
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}-units-template.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function onFile(file: File) {
    setError(''); setDone(''); setRows(null); setSkipped(0);
    setFileName(file.name);
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      setError('Upload the template saved as CSV. In Excel: File › Save As › CSV UTF-8.');
      return;
    }
    const table = parseCsv(await file.text());
    if (table.length < 2) { setError('The file has no unit rows under the header.'); return; }
    const fields = table[0].map(fieldFor);
    if (!fields.includes('name') || !fields.includes('price')) {
      setError('The first row must be the template header, with at least "Unit name" and "Price" columns.');
      return;
    }

    const planByName = new Map(plans.map((p) => [p.name.trim().toLowerCase(), p]));
    const existing = new Set(existingNames.map((n) => n.trim().toLowerCase()));
    const seen = new Map<string, number>();
    let examples = 0;
    const parsed: ParsedRow[] = [];

    table.slice(1).forEach((cells, i) => {
      const line = i + 2;
      const get = (f: keyof ParsedRow) => {
        const idx = fields.indexOf(f);
        return idx >= 0 ? (cells[idx] ?? '').trim() : '';
      };
      const name = get('name');
      if (name.toLowerCase().endsWith(EXAMPLE)) { examples++; return; }

      const errors: string[] = [];
      const r: ParsedRow = { line, name, status: 'AVAILABLE', features: [], errors };
      if (!name) errors.push('Unit name is missing');
      else if (name.length > 60) errors.push('Unit name is longer than 60 characters');
      const key = name.toLowerCase();
      if (name && seen.has(key)) errors.push(`Same name as row ${seen.get(key)}`);
      if (name && existing.has(key)) errors.push('A unit with this name already exists');
      if (name) seen.set(key, line);

      const intField = (f: 'floor' | 'bedrooms' | 'bathrooms', label: string, min?: number) => {
        const v = num(get(f));
        if (v === undefined) return;
        if (!Number.isInteger(v) || (min !== undefined && v < min)) errors.push(`${label} must be a whole number${min !== undefined ? ` of ${min} or more` : ''}`);
        else r[f] = v;
      };
      intField('floor', 'Floor');
      intField('bedrooms', 'Bedrooms', 0);
      intField('bathrooms', 'Bathrooms', 0);

      const sqm = num(get('sqm'));
      if (sqm !== undefined) { if (!Number.isFinite(sqm) || sqm < 1) errors.push('Size must be a number of 1 or more'); else r.sqm = sqm; }

      const price = num(get('price'));
      if (price === undefined) errors.push('Price is missing');
      else if (!Number.isFinite(price) || price < 0) errors.push('Price must be a number');
      else r.price = price;

      const status = get('status').toUpperCase();
      if (status) { if (STATUSES.includes(status)) r.status = status; else errors.push('Status must be AVAILABLE, RESERVED or SOLD'); }

      const planName = get('planName');
      if (planName) {
        const plan = planByName.get(planName.toLowerCase());
        if (plan) { r.floorPlanId = plan.id; r.planName = plan.name; }
        else errors.push(`No floor plan called "${planName}"`);
      }

      r.features = get('features').split(/[;|]/).map((f) => f.trim()).filter(Boolean);
      parsed.push(r);
    });

    setSkipped(examples);
    if (!parsed.length) { setError('Only example rows were found. Add your units below the header and upload again.'); return; }
    if (parsed.length > 500) { setError('Import up to 500 units at a time. Split the sheet and upload each part.'); return; }
    setRows(parsed);
  }

  const valid = rows?.filter((r) => !r.errors.length) ?? [];
  const invalid = rows?.filter((r) => r.errors.length) ?? [];

  async function runImport(list: ParsedRow[]) {
    setImporting(true); setError('');
    try {
      const res = await apiClient.post<{ created: number }>(`/properties/${slug}/units/bulk`, {
        units: list.map((r) => ({
          name: r.name, floor: r.floor, bedrooms: r.bedrooms, bathrooms: r.bathrooms, sqm: r.sqm,
          price: r.price, status: r.status, floorPlanId: r.floorPlanId, features: r.features,
        })),
      });
      setDone(`Imported ${res.created} unit${res.created === 1 ? '' : 's'}.`);
      setRows(null);
      onImported();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'The import failed. Nothing was saved; try again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={downloadTemplate}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#3c4043] transition-colors hover:bg-[#f1f3f4]">
          <Download size={14} /> Download template
        </button>
        <button type="button" onClick={() => inputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#3c4043] transition-colors hover:bg-[#f1f3f4]">
          <FileUp size={14} /> Import units
        </button>
        <input ref={inputRef} type="file" accept=".csv,.tsv,.txt,text/csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
        {children}
      </div>

      {(rows || error || done) && (
        <div className="-mx-6 -mb-4 mt-1 basis-full border-t border-[#f1f3f4] bg-[#f8f9fa] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[15px] font-medium text-[#202124]">{done ? 'Import complete' : `Importing from ${fileName || 'file'}`}</p>
              {rows && (
                <p className="mt-0.5 text-[13px] text-[#5f6368]">
                  {valid.length} ready{invalid.length ? ` · ${invalid.length} with problems` : ''}
                  {skipped ? ` · ${skipped} example row${skipped === 1 ? '' : 's'} skipped` : ''}
                </p>
              )}
            </div>
            <button type="button" aria-label="Close import" onClick={() => { setRows(null); setError(''); setDone(''); }}
              className="cursor-pointer rounded-full p-1 text-[#5f6368] hover:bg-[#e8eaed]"><X size={16} /></button>
          </div>

          {done && <p className="mt-3 rounded-xl bg-[#e6f4ea] px-4 py-2.5 text-[14px] text-[#188038]">{done}</p>}
          {error && <p className="mt-3 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[14px] text-[#c5221f]">{error}</p>}

          {rows && (
            <>
              <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-[#dadce0] bg-white">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead className="sticky top-0 bg-[#f8f9fa] text-[12px] text-[#5f6368]">
                    <tr>
                      {['Row', 'Unit', 'Floor', 'Beds', 'Baths', 'Size', 'Price', 'Status', 'Plan', ''].map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.line} className={`border-t border-[#f1f3f4] ${r.errors.length ? 'bg-[#fef7f6]' : ''}`}>
                        <td className="px-3 py-2 tabular-nums text-[#80868b]">{r.line}</td>
                        <td className="px-3 py-2 font-medium text-[#202124]">{r.name || '—'}</td>
                        <td className="px-3 py-2 tabular-nums">{r.floor ?? '—'}</td>
                        <td className="px-3 py-2 tabular-nums">{r.bedrooms ?? 1}</td>
                        <td className="px-3 py-2 tabular-nums">{r.bathrooms ?? 1}</td>
                        <td className="px-3 py-2 tabular-nums">{r.sqm ? `${r.sqm} m²` : '—'}</td>
                        <td className="px-3 py-2 tabular-nums">{r.price !== undefined ? formatPrice(r.price, currency) : '—'}</td>
                        <td className="px-3 py-2">{r.status}</td>
                        <td className="px-3 py-2 text-[#5f6368]">{r.planName ?? '—'}</td>
                        <td className="px-3 py-2 text-[12px] text-[#c5221f]">{r.errors.join(' · ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {invalid.length === 0 ? (
                  <button type="button" disabled={importing} onClick={() => runImport(valid)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
                    {importing && <Loader2 size={14} className="animate-spin" />} Import {valid.length} unit{valid.length === 1 ? '' : 's'}
                  </button>
                ) : (
                  <>
                    <p className="text-[13px] text-[#5f6368]">Fix the highlighted rows in your sheet and upload it again, or import only the rows without problems.</p>
                    {valid.length > 0 && (
                      <button type="button" disabled={importing} onClick={() => runImport(valid)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] disabled:opacity-50">
                        {importing && <Loader2 size={14} className="animate-spin" />} Import the {valid.length} valid row{valid.length === 1 ? '' : 's'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
