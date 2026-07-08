'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Activity, ClipboardList, Users, AlertCircle, ChevronRight, Loader2, Thermometer, Syringe, Pill } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { triageService } from '@/services/clinicalApi.service';

const QUICK_ACTIONS = [
  { label: 'Triage Patient', href: '/dashboard/doctor/queue', icon: ClipboardList, color: 'bg-blue-500/10 text-blue-600' },
  { label: 'Record Vitals', href: '/dashboard/doctor/patients', icon: Thermometer, color: 'bg-green-500/10 text-green-600' },
  { label: 'Medication Admin', href: '/dashboard/doctor/prescriptions', icon: Syringe, color: 'bg-purple-500/10 text-purple-600' },
  { label: 'Triage Queue', href: '/dashboard/doctor/queue', icon: Users, color: 'bg-orange-500/10 text-orange-600' },
];

export default function NurseDashboardPage() {
  const { user } = useAuthStore();
  const [queueCount, setQueueCount] = useState(0);
  const [vitalsCount, setVitalsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const queueRes = await triageService.getQueue();
        setQueueCount(queueRes.data.data?.length || 0);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const stats = [
    { label: 'Triage Queue', value: queueCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Today Vital Signs', value: vitalsCount, icon: Activity, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Pending Med Admin', value: 0, icon: Pill, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Escalated Patients', value: 0, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nurse Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome, {user?.fullName || 'Nurse'}</p>
        </div>
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
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.label} href={a.href} className={`p-3 rounded-lg ${a.color} hover:opacity-80 transition-opacity`}>
                <a.icon className="w-5 h-5 mb-1" />
                <p className="text-xs font-medium">{a.label}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recent Activity</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
