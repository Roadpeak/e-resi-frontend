'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Upload, Loader2, X } from 'lucide-react';
import { cn, formatDate } from '../../../../lib/utils';
import { documentsApi } from '../../../../lib/api/documents';
import { uploadFile } from '../../../../lib/api/media';
import { useMyProperties } from '../../../../lib/api/queries';

/**
 * The developer's document library, one shelf per property.
 *
 * Approvals, title deeds, brochures, NEMA certificates — everything a
 * development accumulates lives against that property, uploadable here and
 * downloadable any time. Purchase paperwork shared with individual buyers
 * lives on the reservation instead (see /dashboard/reservations).
 */

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function DashboardDocuments() {
  const { data: props, isLoading: propsLoading } = useMyProperties();
  const properties = props?.items ?? [];
  const [propertyId, setPropertyId] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  // First property auto-selected the moment the list arrives.
  useEffect(() => {
    if (!propertyId && properties.length > 0) setPropertyId(properties[0].id);
  }, [propertyId, properties]);

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', 'property', propertyId],
    queryFn: () => documentsApi.listForProperty(propertyId),
    enabled: !!propertyId,
  });

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadFile(file, 'properties');
      await documentsApi.create({
        name: file.name.replace(/\.[^.]+$/, ''),
        url: uploaded.url,
        type: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        propertyId,
      });
      qc.invalidateQueries({ queryKey: ['documents', 'property', propertyId] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const remove = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', 'property', propertyId] }),
    onError: (e: Error) => setError(e.message),
  });

  if (propsLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-[#1a73e8]" />
      </div>
    );
  }

  const docs = documents ?? [];

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">Documents</h2>
        <p className="mt-0.5 text-base text-[#5f6368]">
          Each property&apos;s own library — approvals, deeds, brochures — downloadable any time.
          Buyer paperwork lives on its reservation.
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center text-base text-[#5f6368]">
          Add a property first — its document library appears here.
        </div>
      ) : (
        <>
          {/* Property shelves */}
          <div className="flex flex-wrap items-center gap-2">
            {properties.map((p: { id: string; name: string }) => (
              <button
                key={p.id}
                onClick={() => setPropertyId(p.id)}
                className={cn(
                  'cursor-pointer rounded-full px-4 py-2 text-[14px] font-medium transition-colors',
                  propertyId === p.id
                    ? 'bg-[#e8f0fe] text-[#1a73e8]'
                    : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]',
                )}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy || !propertyId}
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload document
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = '';
              }}
            />
          </div>

          {error && <p className="text-[13px] text-[#d93025]">{error}</p>}

          {docsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={20} className="animate-spin text-[#1a73e8]" />
            </div>
          ) : docs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white px-6 py-16 text-center">
              <FileText size={28} className="mx-auto mb-3 text-[#dadce0]" />
              <p className="text-[15px] font-medium text-[#202124]">Nothing here yet</p>
              <p className="mt-1 text-[13px] text-[#5f6368]">
                PDF, DOC, XLS, JPG or PNG — everything this property needs on file.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
              <ul className="divide-y divide-[#f1f3f4]">
                {docs.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-4">
                    <FileText size={17} className="shrink-0 text-[#5f6368]" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-[#202124]">{d.name}</p>
                      <p className="text-[12px] text-[#80868b]">
                        {formatBytes(d.sizeBytes)} · {formatDate(d.createdAt)}
                      </p>
                    </div>
                    <span className="ml-auto flex items-center gap-3">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8] hover:underline"
                      >
                        <Download size={14} /> Download
                      </a>
                      <button
                        onClick={() => remove.mutate(d.id)}
                        disabled={remove.isPending}
                        aria-label="Delete document"
                        className="cursor-pointer text-[#80868b] transition-colors hover:text-[#d93025] disabled:opacity-50"
                      >
                        <X size={15} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
