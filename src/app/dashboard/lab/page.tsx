'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FlaskConical, ClipboardList, AlertTriangle, CheckCircle, Loader2, Microscope, Beaker, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { labService } from '@/services/clinicalApi.service';

export default function LabDashboardPage() {
  const { user } = useAuthStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pendingRes, criticalRes] = await Promise.all([
          labService.getRequests({ status: 'requested' }),
          labService.getCritical(),
        ]);
        setPendingCount(pendingRes.data.data?.length || 0);
        setCriticalCount(criticalRes.data.data?.length || 0);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const stats = [
    { label: 'Pending Samples', value: pendingCount, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Critical Results', value: criticalCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    { label: 'Today Processed', value: 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Awaiting Collection', value: 0, icon: Microscope, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Laboratory Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome, {user?.fullName || 'Lab Scientist'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`p-4 rounded-xl ${s.bg} border border-slate-200 dark:border-slate-700`}>
            <div className="flex items-center justify-between">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Pending Lab Requests</h2>
            <Link href="/dashboard/doctor/lab-requests" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : pendingCount === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No pending lab requests</p>
          ) : (
            <p className="text-sm text-slate-600">{pendingCount} sample(s) awaiting processing</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/dashboard/doctor/lab-requests" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
              <FlaskConical className="w-4 h-4 text-primary" /> Process Lab Requests
            </Link>
            <Link href="/dashboard/doctor/patients" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
              <Beaker className="w-4 h-4 text-primary" /> Upload Results
            </Link>
            <Link href="/dashboard/doctor/history" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
              <FileText className="w-4 h-4 text-primary" /> View Patient History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
