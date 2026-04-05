'use client';
import { useState, useCallback, useEffect } from 'react';
import { superAdminService } from '@/services/api.service';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { ClipboardList, RefreshCw } from 'lucide-react';

interface AuditEntry {
  _id: string;
  actor: { fullName: string; email: string; role: string };
  action: string;
  entity: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

const actionColor = (action: string) => {
  if (action.startsWith('DELETE')) return 'danger';
  if (action.startsWith('CREATE')) return 'success';
  if (action.startsWith('UPDATE') || action.startsWith('TOGGLE') || action.startsWith('RESET')) return 'warning';
  return 'default';
};

export function AuditTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getAuditLogs({ page, limit: 15 });
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'actor', header: 'Actor', render: (l: AuditEntry) => (
      <div><p className="text-sm font-semibold text-slate-800 dark:text-white">{l.actor?.fullName}</p><p className="text-xs text-slate-400 capitalize">{l.actor?.role?.replace(/_/g, ' ')}</p></div>
    )},
    { key: 'action', header: 'Action', render: (l: AuditEntry) => <Badge variant={actionColor(l.action) as never}>{l.action.replace(/_/g, ' ')}</Badge> },
    { key: 'entity', header: 'Entity', render: (l: AuditEntry) => <span className="text-xs text-slate-600 dark:text-slate-400">{l.entity}</span> },
    { key: 'ip', header: 'IP', render: (l: AuditEntry) => <span className="text-xs text-slate-400 font-mono">{l.ip}</span> },
    { key: 'createdAt', header: 'Time', render: (l: AuditEntry) => <span className="text-xs text-slate-400">{formatDateTime(l.createdAt)}</span> },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-[#1E3A8A]" /> Audit Log</CardTitle>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </CardHeader>
      <Table columns={columns} data={logs} loading={loading} emptyMessage="No audit logs yet" />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </Card>
  );
}
