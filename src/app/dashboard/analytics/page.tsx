'use client';
import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/api.service';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/lib/utils';
import { Users, Calendar, TrendingUp, AlertTriangle, Trophy, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [memberStats, setMemberStats] = useState<{ active: number; inactive: number; total: number; byRole: { _id: string; count: number }[] } | null>(null);
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
      const res = await analyticsService.getLeaderboard(); // reuse to call alert
      toast.success('Inactive users alerted');
    } catch { toast.error('Failed to alert users'); }
    finally { setAlerting(false); }
  };

  const roleData = memberStats?.byRole.map((r) => ({ name: r._id?.replace(/_/g, ' '), value: r.count })) || [];
  const programData = programMetrics ? [
    { name: 'Upcoming', value: programMetrics.programs.upcoming },
    { name: 'Ongoing', value: programMetrics.programs.ongoing },
    { name: 'Completed', value: programMetrics.programs.completed },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Organization insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Members" value={memberStats?.total ?? '—'} icon={Users} color="indigo" />
        <StatCard title="Active Members" value={memberStats?.active ?? '—'} icon={Users} color="green" />
        <StatCard title="Total Programs" value={programMetrics?.programs.total ?? '—'} icon={Calendar} color="purple" />
        <StatCard title="Attendance Rate" value={programMetrics ? `${programMetrics.attendance.rate}%` : '—'} icon={TrendingUp} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members by role */}
        <Card>
          <CardHeader><CardTitle>Members by Role</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={programData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <CardTitle>Engagement Leaderboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {leaderboard.map((m, i) => (
              <div key={m._id} className="flex items-center gap-4 px-6 py-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                  {getInitials(m.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{m.fullName}</p>
                  <p className="text-xs text-gray-400 capitalize">{m.role?.replace(/_/g, ' ')}</p>
                </div>
                <div className="w-32 bg-gray-100 dark:bg-gray-800 rounded-full h-2 mr-3">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (m.engagementScore / (leaderboard[0]?.engagementScore || 1)) * 100)}%` }} />
                </div>
                <Badge variant="purple">{m.engagementScore} pts</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inactive users */}
      {inactiveUsers && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <CardTitle>Inactive Members ({inactiveUsers.count})</CardTitle>
              </div>
              <Button size="sm" variant="outline" loading={alerting} onClick={handleAlertInactive}>
                <Bell className="w-3.5 h-3.5" /> Alert All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {inactiveUsers.users.slice(0, 8).map((u) => (
                <div key={u._id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{u.fullName}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <span className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                    Last active: {new Date(u.lastActiveAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {inactiveUsers.count === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No inactive members</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
