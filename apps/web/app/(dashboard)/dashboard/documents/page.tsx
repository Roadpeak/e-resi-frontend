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
  Brochure: 'bg-[#e8f0fe] text-[#1967d2]',
  'Floor Plans': 'bg-[#e8f0fe] text-[#1967d2]',
  Legal: 'bg-[#fef7e0] text-[#b06000]',
  Technical: 'bg-[#e6f4ea] text-[#188038]',
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
          <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Documents</h2>
          <p className="text-base text-[#5f6368] mt-1">{documents.length} file{documents.length !== 1 ? 's' : ''} across all properties</p>
        </div>
        <Button
          icon={<Upload size={14} />}
          variant="secondary"
          className="rounded-full border border-[#dadce0] bg-white hover:bg-[#f8fbff] text-[15px] font-medium text-[#1a73e8] h-10 px-5"
        >
          Upload Document
        </Button>
      </div>

      {/* Upload zone */}
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#dadce0] bg-white p-10 text-center cursor-pointer hover:border-[#1a73e8] hover:bg-[#f8fbff] transition-all">
        <Upload size={28} className="mb-3 text-[#dadce0]" />
        <p className="text-[15px] font-medium text-[#202124]">Drag & drop files here or click to browse</p>
        <p className="text-[13px] text-[#5f6368] mt-1">PDF, DOC, DOCX, JPG, PNG — max 50MB per file</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#80868b]" />
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-[#dadce0] bg-white px-6 py-16 text-center text-base text-[#5f6368]">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f1f3f4]">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">File</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Size</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.08em] text-[#5f6368]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1f3f4]">
                          <FileText size={15} className="text-[#5f6368]" />
                        </div>
                        <p className="text-[15px] font-medium text-[#202124] truncate max-w-64">{doc.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[15px] text-[#5f6368] whitespace-nowrap">
                      {doc.reservation?.unit.property.name ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-medium ${typeColors[doc.type] ?? 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[15px] text-[#5f6368]">{formatBytes(doc.sizeBytes)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f1f3f4] transition-colors"
                        >
                          <Eye size={14} />
                        </a>
                        <a
                          href={doc.url}
                          download={doc.name}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f1f3f4] transition-colors"
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
