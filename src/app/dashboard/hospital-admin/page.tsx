'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Users, UserPlus, BarChart3, Settings, Calendar, Activity, Loader2, Stethoscope, Pill, FlaskConical } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { staffService, adherenceService } from '@/services/clinicalApi.service';

export default function HospitalAdminDashboardPage() {
  const { user, organization } = useAuthStore();
  const [staffCount, setStaffCount] = useState(0);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [staffRes, adherenceRes] = await Promise.allSettled([
          staffService.list(),
          adherenceService.getOverview(),
        ]);
        if (staffRes.status === 'fulfilled') setStaffCount(staffRes.value.data.data?.length || 0);
        if (adherenceRes.status === 'fulfilled') setOverview(adherenceRes.value.data.data);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const stats = [
    { label: 'Total Staff', value: staffCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Active Patients', value: overview?.activePatients || 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Adherence Rate', value: overview ? `${overview.adherenceRate}%` : '—', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Missed Reminders', value: overview?.missed || 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hospital Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {organization?.organizationName || 'Hospital'} — Welcome, {user?.fullName || 'Admin'}
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Staff by Department</h2>
          <p className="text-xs text-slate-400 text-center py-6">Staff distribution chart</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Clinical Staff</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm"><Stethoscope className="w-4 h-4 text-blue-500" /> Doctors</div>
            <div className="flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-green-500" /> Nurses</div>
            <div className="flex items-center gap-2 text-sm"><Pill className="w-4 h-4 text-purple-500" /> Pharmacists</div>
            <div className="flex items-center gap-2 text-sm"><FlaskConical className="w-4 h-4 text-amber-500" /> Lab Scientists</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/dashboard/doctor/services" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
              <UserPlus className="w-4 h-4 text-primary" /> Register Staff
            </Link>
            <Link href="/dashboard/doctor/settings" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
              <Settings className="w-4 h-4 text-primary" /> Hospital Settings
            </Link>
            <Link href="/dashboard/doctor/analytics" className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
              <BarChart3 className="w-4 h-4 text-primary" /> Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
