'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Loader2, Upload, CheckCircle2, PenLine, X } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { documentsApi, type Document } from '../../lib/api/documents';
import { uploadFile } from '../../lib/api/media';

/**
 * The paperwork half of a purchase, shared by both chairs.
 *
 * The developer uploads what the sale needs — optionally flagging a document
 * as needing the buyer's signature. The buyer downloads everything, and for
 * a flagged document answers with a signed copy that lands right under the
 * original, closing the loop for both sides.
 */

export function ReservationDocuments({
  reservationId,
  documents,
  role,
  queryKey,
}: {
  reservationId: string;
  documents: Document[];
  role: 'developer' | 'buyer';
  queryKey: unknown[];
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const signRef = useRef<HTMLInputElement>(null);
  const [signingFor, setSigningFor] = useState<string | null>(null);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey });

  async function uploadShared(file: File) {
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadFile(file, 'properties');
      await documentsApi.create({
        name: file.name.replace(/\.[^.]+$/, ''),
        url: uploaded.url,
        type: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        reservationId,
        requiresSignature,
      });
      setRequiresSignature(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadSigned(file: File, parentId: string) {
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadFile(file, 'properties');
      await documentsApi.create({
        name: `${file.name.replace(/\.[^.]+$/, '')} (signed)`,
        url: uploaded.url,
        type: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        parentId,
      });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setSigningFor(null);
    }
  }

  const remove = useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="mt-5 border-t border-[#f1f3f4] pt-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-[#202124]">Documents</p>
        {role === 'developer' && (
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[#5f6368]">
              <input
                type="checkbox"
                checked={requiresSignature}
                onChange={(e) => setRequiresSignature(e.target.checked)}
                className="accent-[#1a73e8]"
              />
              needs signature
            </label>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] disabled:opacity-60"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              Share document
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadShared(f);
                e.target.value = '';
              }}
            />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-[13px] text-[#d93025]">{error}</p>}

      {documents.length === 0 ? (
        <p className="mt-2 text-[13px] text-[#80868b]">
          {role === 'developer'
            ? 'Nothing shared yet — sale agreements, payment plans and title papers live here.'
            : 'No documents yet. The developer shares sale paperwork here as your purchase moves.'}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {documents.map((d) => {
            const signed = d.signedVersions?.[0];
            const awaiting = d.requiresSignature && !signed;
            return (
              <li key={d.id} className="rounded-2xl bg-[#f8f9fa] px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <FileText size={15} className="shrink-0 text-[#5f6368]" />
                  <span className="text-[14px] text-[#202124]">{d.name}</span>
                  {d.requiresSignature && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium',
                        signed ? 'bg-[#e6f4ea] text-[#188038]' : 'bg-[#fef7e0] text-[#b06000]',
                      )}
                    >
                      {signed ? <CheckCircle2 size={11} /> : <PenLine size={11} />}
                      {signed ? 'signed' : 'awaiting signature'}
                    </span>
                  )}
                  <span className="text-[12px] text-[#80868b]">{formatDate(d.createdAt)}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1a73e8] hover:underline"
                    >
                      <Download size={13} /> Download
                    </a>
                    {role === 'buyer' && awaiting && (
                      <button
                        onClick={() => {
                          setSigningFor(d.id);
                          signRef.current?.click();
                        }}
                        disabled={busy}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-[#1a73e8] px-3 py-1 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
                      >
                        {busy && signingFor === d.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        Upload signed copy
                      </button>
                    )}
                    {role === 'developer' && !signed && (
                      <button
                        onClick={() => remove.mutate(d.id)}
                        disabled={remove.isPending}
                        aria-label="Remove document"
                        className="cursor-pointer text-[#80868b] transition-colors hover:text-[#d93025] disabled:opacity-50"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                </div>
                {signed && (
                  <a
                    href={signed.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="mt-1.5 flex items-center gap-1.5 pl-7 text-[13px] text-[#188038] hover:underline"
                  >
                    <CheckCircle2 size={12} /> {signed.name} — {formatDate(signed.createdAt)}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* One hidden input serves every "upload signed copy" button. */}
      <input
        ref={signRef}
        type="file"
        hidden
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && signingFor) void uploadSigned(f, signingFor);
          e.target.value = '';
        }}
      />
    </div>
  );
}
