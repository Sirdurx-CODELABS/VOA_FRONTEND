'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import { ClipboardList, Search, Download, Trash2, FileText, Calendar, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Report {
  _id: string; title: string; type: string; generatedBy: string;
  createdAt: string; status: string; format: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    superAdminService.getPlatformReports().then(r => setReports(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await superAdminService.deleteReport(id);
      setReports(prev => prev.filter(r => r._id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Platform Reports</h1>
          <p className="text-sm text-slate-400 mt-1">Generated reports and exports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 transition-colors shadow-sm">
          <FileText className="w-4 h-4" /> Generate Report
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">No reports yet</td></tr>}
            {reports.map(r => (
              <tr key={r._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#1E3A8A]" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{r.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-500">{r.type}</span></td>
                <td className="px-4 py-3.5 text-sm text-slate-500">{r.createdAt ? format(new Date(r.createdAt), 'MMM d, yyyy') : '—'}</td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
