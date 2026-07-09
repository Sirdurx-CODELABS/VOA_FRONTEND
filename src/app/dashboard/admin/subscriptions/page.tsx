'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import { CreditCard, Search, Edit3, CheckCircle, XCircle, Calendar, DollarSign, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface Subscription {
  _id: string; planName: string; entityType: string; entityName: string;
  status: string; startDate: string; endDate: string; amount: number;
  billingCycle: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    superAdminService.getSubscriptions().then(r => setSubscriptions(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggleStatus = async (id: string, current: string) => {
    try {
      await superAdminService.updateSubscription(id, { status: current === 'active' ? 'cancelled' : 'active' });
      setSubscriptions(prev => prev.map(s => s._id === id ? { ...s, status: s.status === 'active' ? 'cancelled' : 'active' } : s));
    } catch {}
  };

  const stats = {
    active: subscriptions.filter(s => s.status === 'active').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    total: subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0),
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading subscriptions...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Subscriptions</h1>
          <p className="text-sm text-slate-400 mt-1">{subscriptions.length} subscription(s)</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Active</p>
          <p className="text-2xl font-extrabold text-green-600 mt-0.5">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Cancelled</p>
          <p className="text-2xl font-extrabold text-red-500 mt-0.5">{stats.cancelled}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Total Revenue</p>
          <p className="text-2xl font-extrabold text-[#1E3A8A] mt-0.5">${stats.total.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search subscriptions..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Entity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Cycle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">End Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No subscriptions</td></tr>}
            {subscriptions.map(s => (
              <tr key={s._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{s.entityName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.planName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {s.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-800">${s.amount?.toLocaleString() || 0}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{s.billingCycle}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{s.endDate ? format(new Date(s.endDate), 'MMM d, yyyy') : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleToggleStatus(s._id, s.status)}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-${s.status === 'active' ? 'red' : 'green'}-600 hover:bg-${s.status === 'active' ? 'red' : 'green'}-50 transition-colors`}
                    title={s.status === 'active' ? 'Cancel' : 'Activate'}
                  >
                    {s.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
