'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Users, TrendingUp, AlertTriangle, Calendar, CheckCircle, Loader2, Heart, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { counselingService, adherenceService, reminderService } from '@/services/clinicalApi.service';

export default function CounselorDashboardPage() {
  const { user } = useAuthStore();
  const [poorAdherence, setPoorAdherence] = useState(0);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [adherenceRes, overviewRes] = await Promise.allSettled([
          counselingService.getPoorAdherencePatients(),
          adherenceService.getOverview(),
        ]);
        if (adherenceRes.status === 'fulfilled') setPoorAdherence(adherenceRes.value.data.data?.length || 0);
        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data.data);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const stats = [
    { label: 'Poor Adherence', value: poorAdherence, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    { label: 'Adherence Rate', value: overview ? `${overview.adherenceRate}%` : '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Active Patients', value: overview?.activePatients || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Missed Reminders', value: overview?.missed || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Adherence Counselor Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome, {user?.fullName || 'Counselor'}</p>
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
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Patients Needing Attention</h2>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : poorAdherence === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">All patients are on track</p>
          ) : (
            <p className="text-sm text-slate-600">{poorAdherence} patient(s) with poor adherence</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/dashboard/doctor/consultations" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
              <Heart className="w-4 h-4 text-primary" /> Conduct Counseling Session
            </Link>
            <Link href="/dashboard/doctor/patients" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
              <Calendar className="w-4 h-4 text-primary" /> Schedule Follow-up
            </Link>
            <Link href="/dashboard/doctor/notifications" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
              <MessageSquare className="w-4 h-4 text-primary" /> View Escalations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
