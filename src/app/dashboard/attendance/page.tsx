'use client';
import { useEffect, useState, useCallback } from 'react';
import { attendanceService, programService } from '@/services/api.service';
import { Attendance, Program } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ClipboardCheck, UserCheck, UserX, Percent } from 'lucide-react';

export default function AttendancePage() {
  const { user: me } = useAuthStore();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [summary, setSummary] = useState<{ total: number; present: number; absent: number; attendanceRate: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    programService.getAll({ limit: 100 }).then((res) => setPrograms(res.data.data));
  }, []);

  const load = useCallback(async () => {
    if (!selectedProgram) return;
    setLoading(true);
    try {
      const [recRes, sumRes] = await Promise.all([
        attendanceService.getByProgram(selectedProgram, { page, limit: 15 }),
        attendanceService.getSummary(selectedProgram),
      ]);
      setRecords(recRes.data.data);
      setTotalPages(recRes.data.pagination.totalPages);
      setSummary(sumRes.data.data);
    } finally { setLoading(false); }
  }, [selectedProgram, page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'userId', header: 'Member', render: (a: Attendance) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{a.userId?.fullName}</p>
        <p className="text-xs text-gray-400">{a.userId?.email}</p>
      </div>
    )},
    { key: 'status', header: 'Status', render: (a: Attendance) => <Badge variant={statusBadge(a.status)}>{a.status}</Badge> },
    { key: 'notes', header: 'Notes', render: (a: Attendance) => <span className="text-sm text-gray-500">{a.notes || '—'}</span> },
    { key: 'timestamp', header: 'Recorded', render: (a: Attendance) => <span className="text-sm text-gray-500">{formatDateTime(a.timestamp)}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Track member attendance per program</p>
      </div>

      <Card>
        <CardHeader>
          <select value={selectedProgram} onChange={(e) => { setSelectedProgram(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72">
            <option value="">Select a program...</option>
            {programs.map((p) => <option key={p._id} value={p._id}>{p.title} — {formatDate(p.date)}</option>)}
          </select>
        </CardHeader>
      </Card>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total" value={summary.total} icon={ClipboardCheck} color="indigo" />
          <StatCard title="Present" value={summary.present} icon={UserCheck} color="green" />
          <StatCard title="Absent" value={summary.absent} icon={UserX} color="red" />
          <StatCard title="Rate" value={`${summary.attendanceRate}%`} icon={Percent} color="blue" />
        </div>
      )}

      {selectedProgram && (
        <Card>
          <Table columns={columns} data={records} loading={loading} emptyMessage="No attendance records for this program" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}

      {!selectedProgram && (
        <div className="text-center py-16 text-gray-400">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Select a program to view attendance</p>
        </div>
      )}
    </div>
  );
}
