'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsService } from '@/services/api.service';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GamificationCard } from '@/components/ui/GamificationCard';
import { Users, Calendar, DollarSign, TrendingUp, Trophy, UserCheck, UserX, Activity, ArrowRight, Target, Heart, Sparkles, Globe } from 'lucide-react';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Link from 'next/link';

const BRAND_COLORS = ['#1E3A8A', '#F97316', '#22C55E', '#3B82F6'];

/* Impact highlights — static NGO-feel content */
const IMPACT_HIGHLIGHTS = [
  { icon: '🎓', title: 'Education Drive', desc: '42 members completed skill workshops this month', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
  { icon: '🌱', title: 'Community Outreach', desc: '3 new community programs launched this quarter', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' },
  { icon: '🤝', title: 'Welfare Support', desc: '12 welfare requests resolved with positive outcomes', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<{ activeMembers: number; totalPrograms: number; totalIncome: number; totalExpense: number; balance: number } | null>(null);
  const [memberStats, setMemberStats] = useState<{ active: number; inactive: number; byRole: { _id: string; count: number }[] } | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ _id: string; fullName: string; role: string; engagementScore: number }[]>([]);
  const [programMetrics, setProgramMetrics] = useState<{ programs: { upcoming: number; ongoing: number; completed: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isFinance = ['chairman', 'treasurer'].includes(user?.role || '');
  const isAdmin = ['chairman', 'membership_coordinator', 'secretary'].includes(user?.role || '');

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, leaderRes, progRes] = await Promise.allSettled([
          analyticsService.getDashboard(),
          analyticsService.getLeaderboard(5),
          analyticsService.getProgramMetrics(),
        ]);
        if (dashRes.status === 'fulfilled') setStats(dashRes.value.data.data);
        if (leaderRes.status === 'fulfilled') setLeaderboard(leaderRes.value.data.data);
        if (progRes.status === 'fulfilled') setProgramMetrics(progRes.value.data.data);
        if (isAdmin) {
          const mRes = await analyticsService.getMemberStats();
          setMemberStats(mRes.data.data);
        }
      } finally { setLoading(false); }
    };
    load();
  }, [user, isAdmin]);

  const pieData = programMetrics ? [
    { name: 'Upcoming', value: programMetrics.programs.upcoming },
    { name: 'Ongoing', value: programMetrics.programs.ongoing },
    { name: 'Completed', value: programMetrics.programs.completed },
  ].filter(d => d.value > 0) : [];

  const financialBar = stats ? [
    { name: 'Income', value: stats.totalIncome },
    { name: 'Expense', value: stats.totalExpense },
  ] : [];

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand-soft p-6 md:p-8 text-white shadow-lg">
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&auto=format&fit=crop&q=60" alt="" className="w-full h-full object-cover" />
        </div>
        {/* Decorative shapes */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-12 right-24 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-6 right-40 w-12 h-12 bg-[#F97316]/30 rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orange-300" />
              <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Voice of Adolescents</span>
            </div>
            <p className="text-white/70 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-0.5">{user?.fullName.split(' ')[0]}</h1>
            <p className="text-white/60 text-sm mt-1 capitalize">
              {user?.isVice ? 'Vice ' : ''}{user?.role?.replace(/_/g, ' ')} &nbsp;·&nbsp; {formatDate(new Date().toISOString())}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="glass rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-extrabold">{user?.engagementScore ?? 0}</p>
              <p className="text-xs text-white/70 font-medium">Engagement pts</p>
            </div>
            <div className="glass rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-extrabold">{loading ? '—' : stats?.activeMembers ?? 0}</p>
              <p className="text-xs text-white/70 font-medium">Active members</p>
            </div>
            <div className="glass rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-extrabold">{loading ? '—' : stats?.totalPrograms ?? 0}</p>
              <p className="text-xs text-white/70 font-medium">Programs</p>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-5">
          {[
            { label: '📅 Programs', href: '/dashboard/programs' },
            { label: '📢 Announcements', href: '/dashboard/announcements' },
            { label: '❤️ Welfare', href: '/dashboard/welfare' },
            ...(isFinance ? [{ label: '💰 Finance', href: '/dashboard/finance' }] : []),
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-1.5 glass hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105">
              {l.label} <ArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Members"  value={loading ? '—' : stats?.activeMembers ?? 0}  icon={Users}    color="blue"   />
        <StatCard title="Total Programs"  value={loading ? '—' : stats?.totalPrograms ?? 0}  icon={Calendar} color="orange" />
        {isFinance ? (
          <>
            <StatCard title="Total Income"  value={loading ? '—' : formatCurrency(stats?.totalIncome ?? 0)}  icon={TrendingUp} color="green" />
            <StatCard title="Balance"       value={loading ? '—' : formatCurrency(stats?.balance ?? 0)}      icon={DollarSign} color={stats && stats.balance >= 0 ? 'green' : 'red'} />
          </>
        ) : (
          <>
            <StatCard title="Engagement Score" value={user?.engagementScore ?? 0} icon={Activity}  color="orange" />
            <StatCard title="Account Status"   value={user?.status ?? 'active'}   icon={UserCheck} color="green"  />
          </>
        )}
      </div>

      {/* ── Main content grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Program donut */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Program Status</CardTitle>
              <Target className="w-4 h-4 text-[#F97316]" />
            </div>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-1">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BRAND_COLORS[i] }} />
                      {d.name} <span className="font-bold text-slate-800 dark:text-white">({d.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Target className="w-10 h-10 opacity-20" />
                <p className="text-sm">No programs yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Finance or member overview */}
        {isFinance ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Financial Overview</CardTitle>
                <DollarSign className="w-4 h-4 text-[#22C55E]" />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={financialBar} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {financialBar.map((_, i) => <Cell key={i} fill={i === 0 ? '#22C55E' : '#F97316'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">Balance</span>
                <span className={`text-sm font-extrabold ${stats && stats.balance >= 0 ? 'text-[#22C55E]' : 'text-red-500'}`}>{formatCurrency(stats?.balance ?? 0)}</span>
              </div>
            </CardContent>
          </Card>
        ) : memberStats ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Member Overview</CardTitle>
                <Users className="w-4 h-4 text-[#1E3A8A]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <div className="flex-1 text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                  <UserCheck className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
                  <p className="text-xl font-extrabold text-[#22C55E]">{memberStats.active}</p>
                  <p className="text-xs text-slate-500 font-medium">Active</p>
                </div>
                <div className="flex-1 text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                  <UserX className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <p className="text-xl font-extrabold text-red-500">{memberStats.inactive}</p>
                  <p className="text-xs text-slate-500 font-medium">Inactive</p>
                </div>
              </div>
              <div className="space-y-2">
                {memberStats.byRole.slice(0, 5).map(r => (
                  <div key={r._id} className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">{r._id?.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(100, (r.count / (memberStats.active + memberStats.inactive)) * 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-4 text-right">{r.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Gamification for regular members */
          <GamificationCard score={user?.engagementScore ?? 0} />
        )}

        {/* Quick actions / gamification */}
        {!isFinance && !memberStats ? (
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'View my programs', href: '/dashboard/programs', icon: '📅', color: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Check attendance', href: '/dashboard/attendance', icon: '✅', color: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'Submit welfare request', href: '/dashboard/welfare', icon: '❤️', color: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'Read announcements', href: '/dashboard/announcements', icon: '📢', color: 'bg-green-50 dark:bg-green-900/20' },
                ].map(a => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:translate-x-1 group">
                    <span className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center text-base`}>{a.icon}</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors font-medium">{a.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-auto group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : isAdmin && (
          <GamificationCard score={user?.engagementScore ?? 0} />
        )}
      </div>

      {/* ── Impact This Month ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-[#22C55E]/10 rounded-lg">
            <Globe className="w-4 h-4 text-[#22C55E]" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Impact This Month</h2>
          <span className="text-xs text-slate-400 ml-1">Community highlights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {IMPACT_HIGHLIGHTS.map(({ icon, title, desc, color }) => (
            <div key={title} className={`rounded-2xl border p-4 ${color} flex items-start gap-3`}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Leaderboard ─────────────────────────────────────────────────── */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle>Top Contributors</CardTitle>
                <span className="text-xs text-slate-400">This month</span>
              </div>
              <Link href="/dashboard/analytics" className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {leaderboard.map((member, i) => (
                <div key={member._id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                    i === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                    i === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-500'
                  }`}>{i + 1}</div>
                  <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(member.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{member.fullName}</p>
                    <p className="text-xs text-slate-400 capitalize">{member.role?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${Math.min(100, (member.engagementScore / (leaderboard[0]?.engagementScore || 1)) * 100)}%` }} />
                    </div>
                    <Badge variant="orange">{member.engagementScore} pts</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Community feel footer ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand p-6 text-white text-center">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&auto=format&fit=crop&q=60" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10">
          <Heart className="w-6 h-6 text-orange-300 mx-auto mb-2" />
          <p className="font-extrabold text-lg">&ldquo;Empowering Voices. Building Futures.&rdquo;</p>
          <p className="text-white/60 text-xs mt-1">Voice of Adolescents · Together we grow</p>
        </div>
      </div>
    </div>
  );
}
