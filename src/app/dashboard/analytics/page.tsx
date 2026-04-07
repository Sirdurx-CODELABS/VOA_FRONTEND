'use client';
import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/api.service';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getInitials, membershipTypeLabel } from '@/lib/utils';
import { Users, Calendar, TrendingUp, AlertTriangle, Trophy, Bell, Baby, UserCheck, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#1E3A8A', '#F97316', '#22C55E', '#EF4444', '#8b5cf6', '#06b6d4'];
const MEMBERSHIP_COLORS: Record<string, string> = {
  adolescent: '#1E3A8A',
  adult: '#F97316',
  parent_guardian: '#22C55E',
};

export default function AnalyticsPage() {
  const [memberStats, setMemberStats] = useState<{
    active: number; inactive: number; pending: number; total: number;
    byRole: { _id: string; count: number }[];
    byMembershipType: { _id: string; count: number }[];
    totalChildren: number;
  } | null>(null);
  const [programMetrics, setProgramMetrics] = useState<{ programs: { total: number; upcoming: number; ongoing: number; completed: number }; attendance: { total: number; present: number; rate: string } } | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ _id: string; fullName: string; role: string; engagementScore: number }[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<{ count: number; users: { _id: string; fullName: string; email: string; lastActiveAt: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerting, setAlerting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, pRes, lRes, iRes] = await Promise.allSettled([
          analyticsService.getMemberStats(),
          analyticsService.getProgramMetrics(),
          analyticsService.getLeaderboard(10),
          analyticsService.getInactiveUsers(),
        ]);
        if (mRes.status === 'fulfilled') setMemberStats(mRes.value.data.data);
        if (pRes.status === 'fulfilled') setProgramMetrics(pRes.value.data.data);
        if (lRes.status === 'fulfilled') setLeaderboard(lRes.value.data.data);
        if (iRes.status === 'fulfilled') setInactiveUsers(iRes.value.data.data);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAlertInactive = async () => {
    setAlerting(true);
    try {
      toast.success('Inactive users alerted');
    } catch { toast.error('Failed'); }
    finally { setAlerting(false); }
  };

  const roleData = memberStats?.byRole.map(r => ({ name: r._id?.replace(/_/g, ' '), value: r.count })) || [];
  const membershipData = memberStats?.byMembershipType.map(r => ({
    name: membershipTypeLabel(r._id),
    value: r.count,
    color: MEMBERSHIP_COLORS[r._id] || '#64748b',
  })) || [];
  const programData = programMetrics ? [
    { name: 'Upcoming', value: programMetrics.programs.upcoming },
    { name: 'Ongoing', value: programMetrics.programs.ongoing },
    { name: 'Completed', value: programMetrics.programs.completed },
  ] : [];

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="page-title text-slate-800 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Organization insights and performance metrics</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard title="Total Members" value={memberStats?.total ?? '—'} icon={Users} color="blue" />
        <StatCard title="Active" value={memberStats?.active ?? '—'} icon={UserCheck} color="green" />
        <StatCard title="Pending Approval" value={memberStats?.pending ?? '—'} icon={Clock} color="orange" />
        <StatCard title="Registered Children" value={memberStats?.totalChildren ?? '—'} icon={Baby} color="purple" />
      </div>

      {/* Membership type breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {membershipData.map(({ name, value, color }) => (
          <div key={name} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ background: color }}>
              {name === 'Adolescent' ? '🧒' : name === 'Adult' ? '👤' : '👨‍👧'}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{value}</p>
              <p className="text-xs text-slate-400 font-semibold">{name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Members by role */}
        <Card>
          <CardHeader><CardTitle>Members by Role</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Program status */}
        <Card>
          <CardHeader><CardTitle>Program Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={programData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg"><Trophy className="w-4 h-4 text-amber-600" /></div>
            <CardTitle>Engagement Leaderboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
            {leaderboard.map((m, i) => (
              <div key={m._id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-500'}`}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-xs font-bold shrink-0">{getInitials(m.fullName)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{m.fullName}</p>
                  <p className="text-xs text-slate-400 capitalize">{m.role?.replace(/_/g, ' ')}</p>
                </div>
                <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block mr-2">
                  <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${Math.min(100, (m.engagementScore / (leaderboard[0]?.engagementScore || 1)) * 100)}%` }} />
                </div>
                <Badge variant="orange">{m.engagementScore} pts</Badge>
              </div>
            ))}
            {leaderboard.length === 0 && !loading && <p className="text-sm text-slate-400 text-center py-8">No data yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* Inactive users */}
      {inactiveUsers && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <CardTitle>Inactive Members ({inactiveUsers.count})</CardTitle>
              </div>
              <Button size="sm" variant="outline" loading={alerting} onClick={handleAlertInactive}>
                <Bell className="w-3.5 h-3.5" /> Alert All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {inactiveUsers.users.slice(0, 8).map(u => (
                <div key={u._id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{u.fullName}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                    Last active: {new Date(u.lastActiveAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {inactiveUsers.count === 0 && <p className="text-sm text-slate-400 text-center py-8">No inactive members</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
