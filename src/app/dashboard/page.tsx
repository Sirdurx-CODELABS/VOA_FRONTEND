'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsService } from '@/services/api.service';
import { formatCurrency, formatDate, calcAge, membershipTypeLabel, getInitials, cn } from '@/lib/utils';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import Link from 'next/link';
import {
  Users, DollarSign, TrendingUp, UserCheck, Clock, CheckCircle,
  ArrowRight, Heart, Star, Baby, Bell, Wallet, FileText,
  Megaphone, Shield, Activity, Target, AlertCircle, Sparkles,
} from 'lucide-react';

/* ── Types ───────────────────────────────────────────────────────────────── */
interface DashData {
  user: {
    fullName: string; role: string; isVice: boolean; membershipType: string;
    status: string; engagementScore: number; totalPoints: number; points: number;
    profileImage?: string; dob?: string; createdAt: string;
    isFoundingMember?: boolean; foundingMemberRank?: number;
  };
  contribution: {
    required: number; paid: number; remaining: number; isCompleted: boolean;
    progressPercent: number; extraAmount: number;
    breakdown?: { childName?: string; category: string; amount: number; childAge?: number }[];
    calculationSource: string;
    recentInstallments: { amount: number; status: string; createdAt: string }[];
  };
  attendance: { total: number; present: number; rate: string };
  notifications: { unread: number };
  recentAnnouncements: { _id: string; title: string; category: string; createdAt: string }[];
  roleData: Record<string, unknown>;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

function StatBox({ label, value, sub, color = 'blue', icon: Icon }:
  { label: string; value: string | number; sub?: string; color?: string; icon: React.ElementType }) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-[#1E3A8A] dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-[#F97316]',
    green:  'bg-green-50 dark:bg-green-900/20 text-[#22C55E]',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-500',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', colors[color])}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ pct, color = '#1E3A8A' }: { pct: number; color?: string }) {
  return (
    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{children}</h2>;
}

function QuickAction({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-sm group', color)}>
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 flex-1">{label}</span>
      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400" />
    </Link>
  );
}

/* ── Role-based quick actions ────────────────────────────────────────────── */
function getQuickActions(role: string) {
  const map: Record<string, { href: string; icon: string; label: string; color: string }[]> = {
    member: [
      { href: '/dashboard/finance', icon: '💰', label: 'Make contribution', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' },
      { href: '/dashboard/attendance', icon: '✅', label: 'View my attendance', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
      { href: '/dashboard/welfare', icon: '❤️', label: 'Submit welfare request', color: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' },
      { href: '/dashboard/settings', icon: '👤', label: 'Update my profile', color: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' },
    ],
    treasurer: [
      { href: '/dashboard/finance', icon: '💳', label: 'Review pending payments', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
      { href: '/dashboard/targets', icon: '🎯', label: 'Manage finance targets', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
      { href: '/dashboard/reports', icon: '📊', label: 'Create financial report', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' },
      { href: '/dashboard/finance', icon: '🏦', label: 'Manage accounts', color: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' },
    ],
    chairman: [
      { href: '/dashboard/users', icon: '👥', label: 'Manage members', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
      { href: '/dashboard/announcements', icon: '📢', label: 'Post announcement', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
      { href: '/dashboard/reports', icon: '📋', label: 'View all reports', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' },
      { href: '/dashboard/role-changes', icon: '🔄', label: 'Review role changes', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30' },
    ],
    membership_coordinator: [
      { href: '/dashboard/users', icon: '👥', label: 'Review pending members', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
      { href: '/dashboard/users', icon: '✅', label: 'Approve registrations', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' },
      { href: '/dashboard/analytics', icon: '📊', label: 'View member analytics', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
      { href: '/dashboard/announcements', icon: '📢', label: 'Post membership update', color: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700' },
    ],
    secretary: [
      { href: '/dashboard/attendance', icon: '✅', label: 'Record attendance', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
      { href: '/dashboard/reports', icon: '📋', label: 'Write meeting minutes', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' },
      { href: '/dashboard/announcements', icon: '📢', label: 'Post meeting notice', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
    ],
    program_coordinator: [
      { href: '/dashboard/programs', icon: '📅', label: 'Manage programs', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
      { href: '/dashboard/attendance', icon: '✅', label: 'Record attendance', color: 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' },
      { href: '/dashboard/reports', icon: '📊', label: 'Create program report', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
    ],
    pro: [
      { href: '/dashboard/announcements', icon: '📢', label: 'Create announcement', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
      { href: '/dashboard/announcements', icon: '✏️', label: 'Manage posts', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
    ],
    welfare_officer: [
      { href: '/dashboard/welfare', icon: '❤️', label: 'Review welfare requests', color: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' },
      { href: '/dashboard/announcements', icon: '📢', label: 'Post welfare update', color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
    ],
  };
  return map[role] ?? map['member'];
}

/* ── Engagement level label ──────────────────────────────────────────────── */
function engagementLevel(score: number) {
  if (score >= 200) return { label: 'Champion', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: '🏆' };
  if (score >= 100) return { label: 'Active', color: 'text-[#22C55E]', bg: 'bg-green-50 dark:bg-green-900/20', icon: '⚡' };
  if (score >= 50)  return { label: 'Rising', color: 'text-[#1E3A8A]', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '🌱' };
  return { label: 'Starter', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800', icon: '🌟' };
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getMyDashboard()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const role = user.role;
  const isChairman = ['super_admin', 'chairman', 'vice_chairman'].includes(role);
  const isTreasurer = role === 'treasurer';
  const isMemberCoord = role === 'membership_coordinator';
  const isSecretary = ['secretary', 'program_coordinator'].includes(role);
  const isPRO = role === 'pro';
  const isWelfare = role === 'welfare_officer';
  const isMember = role === 'member';

  const contrib = data?.contribution;
  const att = data?.attendance;
  const rd = data?.roleData as Record<string, Record<string, unknown>> ?? {};
  const level = engagementLevel(user.engagementScore ?? 0);
  const age = calcAge(user.dob);
  const quickActions = getQuickActions(role);

  const Skeleton = ({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) => (
    <div className={cn('rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse', w, h)} />
  );

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl mx-auto">

      {/* ── Hero / Welcome ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1e4db7] p-5 sm:p-7 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 right-20 w-56 h-56 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-300" />
              <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Voice of Adolescents</span>
            </div>
            <p className="text-white/70 text-sm">{greeting} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-0.5">{user.fullName.split(' ')[0]}</h1>
            <p className="text-white/60 text-sm mt-1 capitalize">
              {user.isVice ? 'Vice ' : ''}{role.replace(/_/g, ' ')}
              {age !== null ? ` · ${age} yrs` : ''}
              {' · '}{membershipTypeLabel(user.membershipType)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-xl font-extrabold">{user.engagementScore ?? 0}</p>
              <p className="text-xs text-white/70">Engagement pts</p>
            </div>
            {data?.notifications.unread ? (
              <div className="bg-[#F97316]/30 border border-[#F97316]/40 rounded-xl px-4 py-3 text-center">
                <p className="text-xl font-extrabold">{data.notifications.unread}</p>
                <p className="text-xs text-white/70">Unread alerts</p>
              </div>
            ) : null}
            {user.isFoundingMember && (
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-3 text-center">
                <p className="text-xl font-extrabold">#{user.foundingMemberRank}</p>
                <p className="text-xs text-white/70">Founding member</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Member: Personal Stats ─────────────────────────────────────── */}
      {(isMember || true) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Engagement Score" value={user.engagementScore ?? 0} icon={Star} color="orange" sub={level.label} />
          <StatBox label="Total Points" value={(user as { totalPoints?: number })?.totalPoints ?? user.points ?? 0} icon={Trophy} color="amber" />
          <StatBox label="Attendance" value={loading ? '—' : `${att?.present ?? 0}/${att?.total ?? 0}`} icon={UserCheck} color="green" sub={att?.total ? `${att.rate}% rate` : undefined} />
          <StatBox label="Account Status" value={user.status} icon={Shield} color={user.status === 'active' ? 'green' : 'red'} sub={formatDate(user.createdAt)} />
        </div>
      )}

      {/* ── Contribution Card ──────────────────────────────────────────── */}
      <div>
        <SectionTitle>My Contribution — {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</SectionTitle>
        <div className={cn('rounded-2xl border p-5',
          contrib?.isCompleted ? 'bg-green-50 dark:bg-green-900/10 border-[#22C55E]/30' : 'bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/10 border-[#1E3A8A]/20')}>
          {loading ? (
            <div className="space-y-3"><Skeleton h="h-6" w="w-32" /><Skeleton /><Skeleton w="w-3/4" /></div>
          ) : contrib ? (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {contrib.isCompleted
                      ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22C55E] bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Complete</span>
                      : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> In Progress</span>
                    }
                    {contrib.extraAmount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 rounded-full"><Heart className="w-3 h-3" /> Extra</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 capitalize">{membershipTypeLabel(user.membershipType)} · {contrib.calculationSource?.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(contrib.required)}</p>
                  <p className="text-xs text-slate-400">required / month</p>
                </div>
              </div>
              {contrib.required > 0 && (
                <>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Paid: <strong className="text-[#22C55E]">{formatCurrency(contrib.paid)}</strong></span>
                    <span className="font-bold">{contrib.progressPercent}%</span>
                    {!contrib.isCompleted && <span className="text-[#F97316] font-semibold">Remaining: {formatCurrency(contrib.remaining)}</span>}
                  </div>
                  <ProgressBar pct={contrib.progressPercent} color={contrib.isCompleted ? '#22C55E' : contrib.progressPercent >= 75 ? '#F97316' : '#1E3A8A'} />
                  {contrib.extraAmount > 0 && (
                    <p className="text-xs text-purple-600 font-semibold mt-2 flex items-center gap-1"><Heart className="w-3 h-3" /> Extra: +{formatCurrency(contrib.extraAmount)}</p>
                  )}
                </>
              )}
              {/* Parent breakdown */}
              {user.membershipType === 'parent_guardian' && contrib.breakdown && contrib.breakdown.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2"><Baby className="w-3.5 h-3.5 text-[#F97316]" /> Children Breakdown</p>
                  {contrib.breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-500">{b.childName || `Child ${i + 1}`}{b.childAge !== undefined ? ` (age ${b.childAge})` : ''} — <span className="capitalize">{b.category?.replace(/_/g, ' ')}</span></span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(b.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              {!contrib.isCompleted && (
                <Link href="/dashboard/finance" className="mt-4 flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                  <Wallet className="w-4 h-4" /> Make Payment
                </Link>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm">No contribution record yet for this month.</p>
              <Link href="/dashboard/finance" className="mt-3 inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-5 py-2 rounded-xl transition-colors text-sm">
                <Wallet className="w-4 h-4" /> Start Contributing
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Engagement / Level ─────────────────────────────────────────── */}
      <div>
        <SectionTitle>Engagement & Rewards</SectionTitle>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0', level.bg)}>
              {level.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className={cn('text-base font-extrabold', level.color)}>{level.label}</p>
                {user.isFoundingMember && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Founding Member #{user.foundingMemberRank}</span>
                )}
              </div>
              <p className="text-xs text-slate-400">{user.engagementScore} engagement points · {(user as { totalPoints?: number })?.totalPoints ?? 0} total points</p>
              <div className="mt-2">
                <ProgressBar pct={Math.min(100, ((user.engagementScore ?? 0) / 200) * 100)} color="#F97316" />
                <p className="text-[10px] text-slate-400 mt-1">Next level at 200 pts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHAIRMAN / ADMIN role data ─────────────────────────────────── */}
      {isChairman && rd.members && (
        <div>
          <SectionTitle>Organisation Overview</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total Members" value={(rd.members as { total: number }).total} icon={Users} color="blue" />
            <StatBox label="Active Members" value={(rd.members as { active: number }).active} icon={UserCheck} color="green" />
            <StatBox label="Pending Approval" value={(rd.members as { pending: number }).pending} icon={Clock} color="amber"
              sub={(rd.members as { pending: number }).pending > 0 ? 'Needs review' : undefined} />
            <StatBox label="Welfare Pending" value={((rd.welfare as { pending: number })?.pending ?? 0)} icon={Heart} color="red" />
          </div>
          {rd.finance && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <StatBox label="Monthly Collected" value={formatCurrency((rd.finance as { monthlyCollected: number }).monthlyCollected)} icon={Wallet} color="green" />
              <StatBox label="Completed Contribs" value={(rd.finance as { completedContributions: number }).completedContributions} icon={CheckCircle} color="green" />
              <StatBox label="Pending Payments" value={(rd.finance as { pendingInstallments: number }).pendingInstallments} icon={Clock} color="orange" />
              <StatBox label="Balance" value={formatCurrency((rd.finance as { balance: number }).balance)} icon={TrendingUp} color={(rd.finance as { balance: number }).balance >= 0 ? 'green' : 'red'} />
            </div>
          )}
        </div>
      )}

      {/* ── TREASURER role data ────────────────────────────────────────── */}
      {isTreasurer && rd.finance && (
        <div>
          <SectionTitle>Finance Overview</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Monthly Collected" value={formatCurrency((rd.finance as { monthlyCollected: number }).monthlyCollected)} icon={Wallet} color="green" />
            <StatBox label="Completed" value={(rd.finance as { completedContributions: number }).completedContributions} icon={CheckCircle} color="green" />
            <StatBox label="Pending Payments" value={(rd.finance as { pendingInstallments: number }).pendingInstallments} icon={Clock} color="orange"
              sub={(rd.finance as { pendingInstallments: number }).pendingInstallments > 0 ? 'Needs approval' : undefined} />
            <StatBox label="Balance" value={formatCurrency((rd.finance as { balance: number }).balance)} icon={TrendingUp} color={(rd.finance as { balance: number }).balance >= 0 ? 'green' : 'red'} />
          </div>
          {/* Recent pending payments */}
          {Array.isArray(rd.recentPendingPayments) && rd.recentPendingPayments.length > 0 && (
            <div className="mt-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Pending Approvals</p>
                <Link href="/dashboard/finance" className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {(rd.recentPendingPayments as { _id: string; amount: number; userId: { fullName: string; membershipType: string }; month: string }[]).map(p => (
                <div key={p._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.userId?.fullName}</p>
                    <p className="text-xs text-slate-400 capitalize">{membershipTypeLabel(p.userId?.membershipType)} · {p.month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(p.amount)}</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERSHIP COORDINATOR role data ──────────────────────────── */}
      {isMemberCoord && rd.members && (
        <div>
          <SectionTitle>Membership Overview</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total Members" value={(rd.members as { total: number }).total} icon={Users} color="blue" />
            <StatBox label="Active" value={(rd.members as { active: number }).active} icon={UserCheck} color="green" />
            <StatBox label="Pending Approval" value={(rd.members as { pending: number }).pending} icon={Clock} color="amber" />
            <StatBox label="New This Month" value={(rd.members as { newThisMonth: number }).newThisMonth} icon={Sparkles} color="purple" />
          </div>
          {Array.isArray(rd.membershipBreakdown) && (
            <div className="mt-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Membership Breakdown</p>
              <div className="space-y-2">
                {(rd.membershipBreakdown as { _id: string; count: number }[]).map(b => (
                  <div key={b._id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-28 capitalize">{membershipTypeLabel(b._id)}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(100, (b.count / ((rd.members as { total: number }).total || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(rd.recentPendingMembers) && rd.recentPendingMembers.length > 0 && (
            <div className="mt-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Awaiting Approval</p>
                <Link href="/dashboard/users" className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">Review <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {(rd.recentPendingMembers as { _id: string; fullName: string; email: string; membershipType: string; createdAt: string }[]).map(m => (
                <div key={m._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{m.fullName}</p>
                    <p className="text-xs text-slate-400">{m.email} · {membershipTypeLabel(m.membershipType)}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECRETARY / PROGRAM COORDINATOR role data ─────────────────── */}
      {isSecretary && rd.programs && (
        <div>
          <SectionTitle>Programs & Attendance</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total Programs" value={(rd.programs as { total: number }).total} icon={Target} color="blue" />
            <StatBox label="Upcoming" value={(rd.programs as { upcoming: number }).upcoming} icon={Clock} color="orange" />
            <StatBox label="Ongoing" value={(rd.programs as { ongoing: number }).ongoing} icon={Activity} color="green" />
            <StatBox label="Attendance Rate" value={`${(rd.attendance as { rate: string })?.rate ?? 0}%`} icon={UserCheck} color="purple" />
          </div>
        </div>
      )}

      {/* ── PRO role data ──────────────────────────────────────────────── */}
      {isPRO && rd.announcements && (
        <div>
          <SectionTitle>Announcements Overview</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Total Posts" value={(rd.announcements as { total: number }).total} icon={Megaphone} color="blue" />
            <StatBox label="Published" value={(rd.announcements as { published: number }).published} icon={CheckCircle} color="green" />
            <StatBox label="Drafts" value={(rd.announcements as { draft: number }).draft} icon={FileText} color="orange" />
          </div>
        </div>
      )}

      {/* ── WELFARE OFFICER role data ──────────────────────────────────── */}
      {isWelfare && rd.welfare && (
        <div>
          <SectionTitle>Welfare Requests</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Pending" value={(rd.welfare as { pending: number }).pending} icon={AlertCircle} color="red" />
            <StatBox label="In Progress" value={(rd.welfare as { inProgress: number }).inProgress} icon={Clock} color="orange" />
            <StatBox label="Resolved" value={(rd.welfare as { resolved: number }).resolved} icon={CheckCircle} color="green" />
          </div>
        </div>
      )}

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Quick Actions</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickActions.map(a => <QuickAction key={a.href + a.label} {...a} />)}
        </div>
      </div>

      {/* ── Recent Announcements ───────────────────────────────────────── */}
      {data?.recentAnnouncements && data.recentAnnouncements.length > 0 && (
        <div>
          <SectionTitle>Recent Announcements</SectionTitle>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {data.recentAnnouncements.map((a, i) => (
              <Link key={a._id} href="/dashboard/announcements"
                className={cn('flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                  i < data.recentAnnouncements.length - 1 && 'border-b border-slate-50 dark:border-slate-800/60')}>
                <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{a.title}</p>
                  <p className="text-xs text-slate-400 capitalize">{a.category?.replace(/_/g, ' ')} · {formatDate(a.createdAt)}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#1e4db7] p-5 text-white text-center">
        <Heart className="w-5 h-5 text-orange-300 mx-auto mb-1.5" />
        <p className="font-extrabold">&ldquo;Empowering Voices. Building Futures.&rdquo;</p>
        <p className="text-white/50 text-xs mt-1">Voice of Adolescents · Together we grow</p>
      </div>
    </div>
  );
}

// Missing import fix
function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
