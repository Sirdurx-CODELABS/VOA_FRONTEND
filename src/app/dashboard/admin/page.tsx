'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import { User } from '@/types';
import { UsersTab } from './_users';
import { AuditTab } from './_audit';
import { cn } from '@/lib/utils';
import {
  ShieldCheck, Users, Calendar, DollarSign, Heart,
  AlertTriangle, ClipboardList, TrendingUp, Activity,
} from 'lucide-react';

type TabId = 'overview' | 'users' | 'programs' | 'transactions' | 'welfare' | 'audit';

function Tab({ label, icon: Icon, active, badge, onClick }: {
  label: string; icon: React.ElementType; active: boolean; badge?: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={cn(
      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap',
      active ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
    )}>
      <Icon className="w-4 h-4" />
      {label}
      {!!badge && <span className="bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}

export default function SuperAdminPage() {
  const { user: me } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<{ users: { _id: string; count: number }[]; programs: { _id: string; count: number }[]; transactions: { _id: string; total: number }[]; pendingWelfare: number; totalAuditLogs: number } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');

  useEffect(() => {
    if (me && me.role !== 'super_admin') router.replace('/dashboard');
  }, [me, router]);

  useEffect(() => {
    superAdminService.getStats().then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await superAdminService.getUsers({ page: usersPage, limit: 15, search: usersSearch || undefined });
      setUsers(res.data.data);
      setUsersTotalPages(res.data.pagination.totalPages);
    } finally { setUsersLoading(false); }
  }, [usersPage, usersSearch]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, loadUsers]);

  const activeUsers = stats?.users.find(u => u._id === 'active')?.count || 0;
  const inactiveUsers = stats?.users.find(u => u._id === 'inactive')?.count || 0;
  const totalIncome = stats?.transactions.find(t => t._id === 'income')?.total || 0;
  const totalExpense = stats?.transactions.find(t => t._id === 'expense')?.total || 0;

  if (!me || me.role !== 'super_admin') return null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-slate-900 p-6 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Super Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold">System Control Panel</h1>
            <p className="text-white/60 text-sm mt-0.5">Full authority · All actions are logged</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Super Admin access.</strong> All actions are permanently logged in the audit trail. Destructive actions cannot be undone.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Members', value: activeUsers, icon: Users, color: 'text-[#22C55E]', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-l-[#22C55E]' },
          { label: 'Inactive', value: inactiveUsers, icon: Activity, color: 'text-[#F97316]', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-l-[#F97316]' },
          { label: 'Income', value: `₦${(totalIncome / 1000).toFixed(0)}k`, icon: TrendingUp, color: 'text-[#1E3A8A]', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-[#1E3A8A]' },
          { label: 'Pending Welfare', value: stats?.pendingWelfare || 0, icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 ${border} p-4 flex items-center gap-3 shadow-sm`}>
            <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
            <div>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">{value}</p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <Tab label="Overview" icon={ShieldCheck} active={tab === 'overview'} onClick={() => setTab('overview')} />
        <Tab label="Users" icon={Users} active={tab === 'users'} onClick={() => setTab('users')} />
        <Tab label="Audit Log" icon={ClipboardList} active={tab === 'audit'} badge={stats?.totalAuditLogs} onClick={() => setTab('audit')} />
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Total Users', value: activeUsers + inactiveUsers, icon: Users, desc: `${activeUsers} active, ${inactiveUsers} inactive` },
            { label: 'Total Income', value: `₦${totalIncome.toLocaleString()}`, icon: TrendingUp, desc: `Expense: ₦${totalExpense.toLocaleString()}` },
            { label: 'Pending Welfare', value: stats?.pendingWelfare || 0, icon: Heart, desc: 'Requests awaiting action' },
            { label: 'Audit Events', value: stats?.totalAuditLogs || 0, icon: ClipboardList, desc: 'Total logged actions' },
          ].map(({ label, value, icon: Icon, desc }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4 shadow-sm">
              <div className="p-3 rounded-xl bg-[#1E3A8A]/10"><Icon className="w-5 h-5 text-[#1E3A8A]" /></div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <UsersTab
          users={users} loading={usersLoading}
          page={usersPage} totalPages={usersTotalPages}
          search={usersSearch}
          onSearch={(s) => { setUsersSearch(s); setUsersPage(1); }}
          onPage={setUsersPage}
          onRefresh={loadUsers}
        />
      )}

      {tab === 'audit' && <AuditTab />}
    </div>
  );
}
