'use client';

import { useQuery } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { adminApi } from '../../../../lib/api/admin';

export default function AdminAuditLog() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => adminApi.audit(50),
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Audit log</h1>
        <p className="text-[14px] text-[#5f6368]">
          Every administrative action, with who performed it.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MaterialIcon name="history" size={28} className="text-[#80868b]" />
            <p className="mt-2 text-[15px] text-[#5f6368]">No administrative actions recorded yet.</p>
            <p className="text-[13px] text-[#80868b]">
              Entries appear here as admins change prices, users and properties.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-[#dadce0] bg-[#f8f9fa]">
              <tr className="text-[12px] uppercase tracking-wide text-[#5f6368]">
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Admin</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f3f4]">
              {rows.map((r) => (
                <tr key={r.id} className="text-[14px] text-[#202124]">
                  <td className="whitespace-nowrap px-5 py-3 text-[#5f6368]">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    {r.actor ? `${r.actor.firstName ?? ''} ${r.actor.lastName ?? ''}`.trim() || r.actor.email : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[12px] font-medium text-[#1967d2]">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#5f6368]">
                    {r.targetType ? `${r.targetType}${r.targetId ? ` · ${r.targetId.slice(0, 8)}` : ''}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-[#5f6368]">{r.summary ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
