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
  Brochure: 'text-brand-700 bg-brand-50 border-brand-200',
  'Floor Plans': 'text-violet-700 bg-violet-50 border-violet-200',
  Legal: 'text-gold-700 bg-gold-50 border-gold-200',
  Technical: 'text-emerald-700 bg-emerald-50 border-emerald-200',
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
          <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-500 mt-0.5">{documents.length} file{documents.length !== 1 ? 's' : ''} across all properties</p>
        </div>
        <Button icon={<Upload size={14} />} variant="secondary">Upload Document</Button>
      </div>

      {/* Upload zone */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-all">
        <Upload size={28} className="mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">Drag & drop files here or click to browse</p>
        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG — max 50MB per file</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">File</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Size</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
                          <FileText size={15} className="text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-900 truncate max-w-64">{doc.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {doc.reservation?.unit.property.name ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[doc.type] ?? 'text-gray-500 bg-gray-100 border-gray-200'}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatBytes(doc.sizeBytes)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          <Eye size={14} />
                        </a>
                        <a
                          href={doc.url}
                          download={doc.name}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
