'use client';

import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { uploadFile } from '../../lib/api/media';

/**
 * Google-style image uploader — click (or replace) to pick a file, uploads
 * immediately and hands back the hosted URL.
 */
export function ImageUpload({
  value,
  onChange,
  folder = 'properties',
  label = 'Cover photo',
  hint = 'JPG or PNG · used across the listing and its rentals',
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: 'properties' | 'rentals' | 'avatars' | 'logos';
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file (JPG, PNG or WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Images must be under 15 MB.');
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadFile(file, folder);
      onChange(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed — try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-[#5f6368]">{label}</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="group relative h-40 w-full overflow-hidden rounded-2xl bg-[#f1f3f4]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={busy}
              aria-label="Remove photo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#c5221f] hover:bg-[#fce8e6] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 size={22} className="animate-spin text-[#1a73e8]" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#dadce0] bg-[#f8f9fa] text-[#5f6368] hover:border-[#1a73e8] hover:bg-[#f8fbff] transition-colors cursor-pointer"
        >
          {busy ? (
            <Loader2 size={22} className="animate-spin text-[#1a73e8]" />
          ) : (
            <>
              <ImagePlus size={22} />
              <span className="text-[15px] font-medium text-[#1a73e8]">Upload photo</span>
              <span className="text-[13px] text-[#80868b]">{hint}</span>
            </>
          )}
        </button>
      )}
      {error && <p className="mt-2 rounded-xl bg-[#fce8e6] px-3 py-2 text-sm text-[#c5221f]">{error}</p>}
    </div>
  );
}
