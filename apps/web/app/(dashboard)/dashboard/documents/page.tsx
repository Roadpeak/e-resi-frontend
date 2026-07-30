'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Eye, Upload, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { documentsApi } from '../../../../lib/api/documents';
import { useAuthStore } from '../../../../lib/stores/auth.store';

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

const typeColors: Record<string, string> = {
  Brochure: 'text-brand-300 bg-brand-500/10 border-brand-500/20',
  'Floor Plans': 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  Legal: 'text-gold-300 bg-gold-500/10 border-gold-500/20',
  Technical: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
};

export default function DashboardDocuments() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ['documents', 'mine'],
    queryFn: async () => {
      const res = await documentsApi.listMine({ limit: 50 });
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const documents = data ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Documents</h2>
          <p className="text-sm text-white/40 mt-0.5">{documents.length} file{documents.length !== 1 ? 's' : ''} across all properties</p>
        </div>
        <Button icon={<Upload size={14} />} variant="secondary">Upload Document</Button>
      </div>

      {/* Upload zone */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-surface-900/50 p-10 text-center cursor-pointer hover:border-brand-500/30 hover:bg-brand-500/5 transition-all">
        <Upload size={28} className="mb-3 text-white/20" />
        <p className="text-sm font-medium text-white/50">Drag & drop files here or click to browse</p>
        <p className="text-xs text-white/25 mt-1">PDF, DOC, DOCX, JPG, PNG — max 50MB per file</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-white/30" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-800 px-6 py-16 text-center text-sm text-white/30">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">File</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30">Size</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-surface-700">
                          <FileText size={15} className="text-white/40" />
                        </div>
                        <p className="text-sm text-white truncate max-w-64">{doc.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-white/50 whitespace-nowrap">
                      {doc.reservation?.unit.property.name ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[doc.type] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-white/40">{formatBytes(doc.sizeBytes)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Eye size={14} />
                        </a>
                        <a
                          href={doc.url}
                          download={doc.name}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
