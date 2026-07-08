'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, CheckCircle, TrendingUp, UserCheck, ArrowRight, Loader2, ClipboardList, Home } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { caseService } from '@/services/clinicalApi.service';

const QUICK_ACTIONS = [
  { label: 'Open Case', href: '/dashboard/doctor/patients', icon: ClipboardList, color: 'bg-blue-500/10 text-blue-600' },
  { label: 'My Cases', href: '/dashboard/doctor/referrals', icon: Users, color: 'bg-green-500/10 text-green-600' },
  { label: 'Create Referral', href: '/dashboard/doctor/referrals', icon: ArrowRight, color: 'bg-purple-500/10 text-purple-600' },
  { label: 'High Risk List', href: '/dashboard/doctor/queue', icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-600' },
];

export default function CaseManagerDashboardPage() {
  const { user } = useAuthStore();
  const [highRisk, setHighRisk] = useState(0);
  const [myCases, setMyCases] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [riskRes, casesRes] = await Promise.allSettled([
          caseService.getHighRisk(),
          caseService.getMyCases(),
        ]);
        if (riskRes.status === 'fulfilled') setHighRisk(riskRes.value.data.data?.length || 0);
        if (casesRes.status === 'fulfilled') setMyCases(casesRes.value.data.data?.length || 0);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const stats = [
    { label: 'High Risk Patients', value: highRisk, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', trend: 'Needs attention', trendUp: false },
    { label: 'My Active Cases', value: myCases, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Referrals Sent', value: 0, icon: ArrowRight, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Interventions', value: 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Case Manager Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome, {user?.fullName || 'Case Manager'}</p>
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
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">High Risk Patients</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : highRisk === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No high risk patients</p>
          ) : (
            <p className="text-sm text-slate-600">{highRisk} patient(s) requiring urgent case management</p>
          )}
        </div>

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
      </div>
    </div>
  );
}
