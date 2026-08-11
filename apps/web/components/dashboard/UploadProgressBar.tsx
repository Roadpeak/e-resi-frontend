'use client';

import { Loader2, X } from 'lucide-react';
import type { UploadProgress } from '../../lib/api/media';

/** "734 MB", "2.1 GB" — sized so long uploads read sensibly. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/**
 * Upload progress for a single file.
 *
 * Shows bytes as well as a percentage: on a slow connection the percentage
 * can sit still for a long time, and "42 MB of 780 MB" is the difference
 * between "it is working" and "it has hung".
 *
 * When the browser cannot determine the total the bar goes indeterminate
 * rather than showing a fake 0%.
 */
export function UploadProgressBar({
  progress,
  fileName,
  onCancel,
  label = 'Uploading',
}: {
  progress: UploadProgress | null;
  fileName?: string;
  onCancel?: () => void;
  label?: string;
}) {
  if (!progress) return null;

  const known = progress.total > 0;
  const done = known && progress.percent >= 100;

  return (
    <div className="rounded-2xl border border-[#dadce0] bg-[#f8f9fa] p-3.5">
      <div className="flex items-center gap-3">
        <Loader2 size={16} className="shrink-0 animate-spin text-[#1a73e8]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-[#202124]">
            {/* Once the bytes are all sent the server is still writing the
                file, so saying "uploading" would be misleading. */}
            {done ? 'Processing…' : label}
            {fileName ? ` · ${fileName}` : ''}
          </p>
          <p className="text-[12px] text-[#5f6368]">
            {known
              ? `${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}${done ? '' : ` · ${progress.percent}%`}`
              : `${formatBytes(progress.loaded)} sent`}
          </p>
        </div>
        {onCancel && !done && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel upload"
            className="shrink-0 rounded-full p-1 text-[#5f6368] transition-colors hover:bg-[#e8eaed] hover:text-[#202124] cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#e8eaed]"
        role="progressbar"
        aria-valuenow={known ? progress.percent : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {known ? (
          <div
            className="h-full rounded-full bg-[#1a73e8] transition-[width] duration-200"
            style={{ width: `${progress.percent}%` }}
          />
        ) : (
          // Indeterminate: movement without implying a position we do not know.
          <div className="h-full w-1/3 animate-[progress-slide_1.4s_ease-in-out_infinite] rounded-full bg-[#1a73e8]" />
        )}
      </div>
    </div>
  );
}
