'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsService } from '@/services/api.service';
import { formatCurrency, formatDate, calcAge, membershipTypeLabel, getInitials, cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Users, TrendingUp, UserCheck, Clock, CheckCircle, ArrowRight,
  Heart, Star, Baby, Wallet, FileText, Megaphone, Shield,
  Activity, Target, AlertCircle, Sparkles, ChevronRight,
  Bell, BarChart2, Calendar, Award, Zap,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */
interface ContribMonth {
  month: string; requiredAmount: number; amountPaid: number;
  remainingAmount: number; progressPercent: number;
  isCompleted: boolean; extraAmount: number;
}
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
    history?: ContribMonth[];
  };
  attendance: { total: number; present: number; rate: string };
  notifications: { unread: number };
  recentAnnouncements: { _id: string; title: string; category: string; createdAt: string }[];
  roleData: Record<string, unknown>;
  pendingApprovals?: number;
}

/* ── Helpers ────────────────────────────────────────────────────────── */
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function Skel({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={cn('rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse', w, h)} />;
}

function ProgressBar({ pct, color = '#1E3A8A', thin = false }: { pct: number; color?: string; thin?: boolean }) {
  return (
    <div className={cn('bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden', thin ? 'h-1.5' : 'h-2.5')}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  );
}

function engLevel(score: number) {
  if (score >= 200) return { label: 'Champion', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: '#F59E0B', icon: '🏆', next: 200 };
  if (score >= 100) return { label: 'Active',   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: '#22C55E', icon: '⚡', next: 200 };
  if (score >= 50)  return { label: 'Rising',   color: 'text-[#1E3A8A]', bg: 'bg-blue-50 dark:bg-blue-900/20', bar: '#1E3A8A', icon: '🌱', next: 100 };
  return { label: 'Starter', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800', bar: '#94a3b8', icon: '🌟', next: 50 };
}

function getQuickActions(role: string) {
  const map: Record<string, { href: string; icon: string; label: string }[]> = {
    member:                [{ href: '/dashboard/finance', icon: '💰', label: 'Make contribution' }, { href: '/dashboard/attendance', icon: '✅', label: 'My attendance' }, { href: '/dashboard/welfare', icon: '❤️', label: 'Welfare request' }, { href: '/dashboard/settings', icon: '👤', label: 'Update profile' }],
    treasurer:             [{ href: '/dashboard/finance', icon: '💳', label: 'Review payments' }, { href: '/dashboard/targets', icon: '🎯', label: 'Finance targets' }, { href: '/dashboard/reports', icon: '📊', label: 'Financial report' }, { href: '/dashboard/finance', icon: '🏦', label: 'Manage accounts' }],
    chairman:              [{ href: '/dashboard/users', icon: '👥', label: 'Manage members' }, { href: '/dashboard/announcements', icon: '📢', label: 'Post announcement' }, { href: '/dashboard/reports', icon: '📋', label: 'View reports' }, { href: '/dashboard/role-changes', icon: '🔄', label: 'Role changes' }],
    membership_coordinator:[{ href: '/dashboard/users', icon: '👥', label: 'Pending members' }, { href: '/dashboard/users', icon: '✅', label: 'Approve accounts' }, { href: '/dashboard/analytics', icon: '📊', label: 'Member analytics' }, { href: '/dashboard/announcements', icon: '📢', label: 'Post update' }],
    secretary:             [{ href: '/dashboard/attendance', icon: '✅', label: 'Record attendance' }, { href: '/dashboard/reports', icon: '📋', label: 'Meeting minutes' }, { href: '/dashboard/announcements', icon: '📢', label: 'Post notice' }, { href: '/dashboard/finance', icon: '💰', label: 'My contribution' }],
    program_coordinator:   [{ href: '/dashboard/programs', icon: '📅', label: 'Manage programs' }, { href: '/dashboard/attendance', icon: '✅', label: 'Record attendance' }, { href: '/dashboard/reports', icon: '📊', label: 'Program report' }, { href: '/dashboard/finance', icon: '💰', label: 'My contribution' }],
    pro:                   [{ href: '/dashboard/announcements', icon: '📢', label: 'Create announcement' }, { href: '/dashboard/announcements', icon: '✏️', label: 'Manage posts' }, { href: '/dashboard/finance', icon: '💰', label: 'My contribution' }, { href: '/dashboard/settings', icon: '👤', label: 'Profile' }],
    welfare_officer:       [{ href: '/dashboard/welfare', icon: '❤️', label: 'Welfare requests' }, { href: '/dashboard/announcements', icon: '📢', label: 'Post welfare update' }, { href: '/dashboard/finance', icon: '💰', label: 'My contribution' }, { href: '/dashboard/settings', icon: '👤', label: 'Profile' }],
  };
  return map[role] ?? map['member'];
}

/* ── Sub-components ─────────────────────────────────────────────────── */
function StatPill({ label, value, icon: Icon, color = 'blue' }: {
  label: string; value: string | number; icon: React.ElementType; color?: string;
}) {
  const c: Record<string, string> = {
    blue:   'bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-[#1E3A8A]/20 dark:text-blue-400',
    orange: 'bg-[#F97316]/10 text-[#F97316]',
    green:  'bg-[#22C55E]/10 text-[#22C55E]',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-500',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
    teal:   'bg-teal-50 dark:bg-teal-900/20 text-teal-600',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', c[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-tight">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function SectionHead({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{children}</h2>
      {action}
    </div>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-xs text-[#1E3A8A] dark:text-blue-400 font-bold flex items-center gap-1 hover:underline">
      View all <ChevronRight className="w-3 h-3" />
    </Link>
  );
}

/* ── Contribution 3-month strip ─────────────────────────────────────── */
function ContributionHistory({
  history, contrib, loading, membershipType, breakdown, isParent,
}: {
  history: ContribMonth[];
  contrib: DashData['contribution'] | undefined;
  loading: boolean;
  membershipType: string;
  breakdown?: { childName?: string; category: string; amount: number; childAge?: number }[];
  isParent: boolean;
}) {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Skel h="h-36" /><Skel h="h-36" /><Skel h="h-36" />
    </div>
  );

  const months = history.length > 0 ? history : (contrib ? [{
    month: new Date().toISOString().slice(0, 7),
    requiredAmount: contrib.required, amountPaid: contrib.paid,
    remainingAmount: contrib.remaining, progressPercent: contrib.progressPercent,
    isCompleted: contrib.isCompleted, extraAmount: contrib.extraAmount,
  }] : []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {months.map((h, i) => {
        const isCurrent = i === 0;
        const pctColor = h.isCompleted ? '#22C55E' : h.progressPercent >= 75 ? '#F97316' : '#1E3A8A';
        const cardBg = isCurrent
          ? h.isCompleted
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border-emerald-200 dark:border-emerald-800/40'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-[#1E3A8A]/20'
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800';

        return (
          <div key={h.month} className={cn('rounded-2xl border p-4 transition-all', cardBg, isCurrent && 'ring-1 ring-[#1E3A8A]/10')}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-white">{fmtMonth(h.month)}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {isCurrent && <span className="text-[10px] font-bold text-[#1E3A8A] dark:text-blue-400 bg-[#1E3A8A]/10 px-2 py-0.5 rounded-full">Current</span>}
                  {h.isCompleted
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />Paid</span>
                    : h.amountPaid > 0
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F97316] bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />Partial</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Unpaid</span>
                  }
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-extrabold text-slate-800 dark:text-white">{formatCurrency(h.requiredAmount)}</p>
                <p className="text-[10px] text-slate-400">required</p>
              </div>
            </div>

            {/* Progress */}
            <ProgressBar pct={h.progressPercent} color={pctColor} />
            <div className="flex justify-between text-[11px] mt-1.5 mb-3">
              <span className="text-slate-500">Paid: <strong style={{ color: pctColor }}>{formatCurrency(h.amountPaid)}</strong></span>
              <span className="font-bold text-slate-500">{h.progressPercent}%</span>
            </div>

            {/* Due / Extra */}
            {!h.isCompleted && h.remainingAmount > 0 && (
              <p className="text-[11px] text-[#F97316] font-semibold mb-2">Due: {formatCurrency(h.remainingAmount)}</p>
            )}
            {h.extraAmount > 0 && (
              <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1 mb-2">
                <Heart className="w-3 h-3" />+{formatCurrency(h.extraAmount)} extra
              </p>
            )}

            {/* Parent breakdown — current month only */}
            {isCurrent && isParent && breakdown && breakdown.length > 0 && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Baby className="w-3 h-3 text-[#F97316]" /> Children
                </p>
                {breakdown.map((b, bi) => (
                  <div key={bi} className="flex justify-between text-[11px]">
                    <span className="text-slate-500">{b.childName || `Child ${bi + 1}`}{b.childAge !== undefined ? ` (${b.childAge}y)` : ''}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(b.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA — current unpaid only */}
            {isCurrent && !h.isCompleted && (
              <Link href="/dashboard/finance"
                className="mt-1 flex items-center justify-center gap-1.5 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold py-2 rounded-xl transition-colors text-xs w-full">
                <Wallet className="w-3.5 h-3.5" /> Pay Now
              </Link>
            )}
            {isCurrent && h.isCompleted && (
              <Link href="/dashboard/finance"
                className="mt-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold py-2 rounded-xl transition-colors text-xs w-full">
                <CheckCircle className="w-3.5 h-3.5" /> View Receipt
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────── */
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
  const isChairman    = ['super_admin', 'chairman', 'vice_chairman'].includes(role);
  const isTreasurer   = role === 'treasurer';
  const isMemberCoord = role === 'membership_coordinator';
  const isSecretary   = ['secretary', 'program_coordinator'].includes(role);
  const isPRO         = role === 'pro';
  const isWelfare     = role === 'welfare_officer';
  const isParent      = user.membershipType === 'parent_guardian';

  const contrib  = data?.contribution;
  const att      = data?.attendance;
  const rd       = data?.roleData as Record<string, Record<string, unknown>> ?? {};
  const level    = engLevel(user.engagementScore ?? 0);
  const age      = calcAge(user.dob);
  const actions  = getQuickActions(role);
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const history  = (contrib?.history ?? []) as ContribMonth[];
  const unread   = data?.notifications.unread ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up pb-10">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#1e4db7] to-[#1a3fa8] p-5 sm:p-7 text-white shadow-xl">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 right-20 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-4 right-4 w-24 h-24 bg-[#F97316]/10 rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Left: identity */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center text-xl font-extrabold text-white shrink-0 overflow-hidden">
              {user.profileImage
                ? <img src={user.profileImage} alt={user.fullName} className="w-full h-full object-cover" />
                : getInitials(user.fullName)
              }
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-300" />
                <span className="text-orange-300 text-[11px] font-bold uppercase tracking-wider">Voice of Adolescents</span>
              </div>
              <p className="text-white/60 text-sm">{greeting} 👋</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{user.fullName.split(' ')[0]}</h1>
              <p className="text-white/60 text-xs mt-0.5 capitalize">
                {user.isVice ? 'Vice ' : ''}{role.replace(/_/g, ' ')}
                {age !== null ? ` · ${age} yrs` : ''}
                {' · '}{membershipTypeLabel(user.membershipType)}
              </p>
            </div>
          </div>

          {/* Right: quick stats */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 text-center min-w-[72px]">
              <p className="text-xl font-extrabold">{user.engagementScore ?? 0}</p>
              <p className="text-[10px] text-white/60 font-semibold">Eng. pts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 text-center min-w-[72px]">
              <p className="text-xl font-extrabold">{(user as { totalPoints?: number })?.totalPoints ?? user.points ?? 0}</p>
              <p className="text-[10px] text-white/60 font-semibold">Total pts</p>
            </div>
            {unread > 0 && (
              <Link href="/dashboard/notifications">
                <div className="bg-[#F97316]/30 border border-[#F97316]/40 rounded-xl px-4 py-3 text-center min-w-[72px] hover:bg-[#F97316]/40 transition-colors cursor-pointer">
                  <p className="text-xl font-extrabold">{unread}</p>
                  <p className="text-[10px] text-white/60 font-semibold">Alerts</p>
                </div>
              </Link>
            )}
            {user.isFoundingMember && (
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-3 text-center min-w-[72px]">
                <p className="text-xl font-extrabold">#{user.foundingMemberRank}</p>
                <p className="text-[10px] text-white/60 font-semibold">Founder</p>
              </div>
            )}
          </div>
        </div>

        {/* Engagement level bar inside hero */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/70 font-semibold flex items-center gap-1.5">
              <span>{level.icon}</span> {level.label} Level
            </span>
            <span className="text-xs text-white/50">{user.engagementScore} / {level.next} pts to next</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#F97316] to-amber-400 transition-all duration-700"
              style={{ width: `${Math.min(100, ((user.engagementScore ?? 0) / level.next) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ── Personal stats row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Engagement" value={user.engagementScore ?? 0} icon={Zap} color="orange" />
        <StatPill label="Total Points" value={(user as { totalPoints?: number })?.totalPoints ?? user.points ?? 0} icon={TrophyIcon} color="amber" />
        <StatPill label="Attendance" value={loading ? '—' : `${att?.present ?? 0}/${att?.total ?? 0}`} icon={UserCheck} color="green" />
        <StatPill label="Status" value={user.status} icon={Shield} color={user.status === 'active' ? 'green' : 'red'} />
      </div>

      {/* ── Pending Document Approvals ──────────────────────────────── */}
      {(() => {
        const count = data?.pendingApprovals ?? 0;
        if (loading || count === 0) return null;
        return (
          <div>
            <SectionHead action={<ViewAllLink href="/dashboard/approvals" />}>
              Pending Document Approvals
            </SectionHead>
            <Link href="/dashboard/approvals"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/40 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-white text-lg">{count}</p>
                <p className="text-sm text-amber-600 font-semibold">document{count > 1 ? 's' : ''} awaiting your approval</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        );
      })()}

      {/* ── My Contributions — 3-month view ─────────────────────────── */}
      <div>
        <SectionHead action={<ViewAllLink href="/dashboard/finance" />}>
          My Contributions — {fmtMonth(new Date().toISOString().slice(0, 7))}
        </SectionHead>
        <ContributionHistory
          history={history}
          contrib={contrib}
          loading={loading}
          membershipType={user.membershipType ?? ''}
          breakdown={contrib?.breakdown}
          isParent={isParent}
        />

        {/* Recent installments — compact list */}
        {!loading && contrib?.recentInstallments && contrib.recentInstallments.length > 0 && (
          <div className="mt-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Payments</p>
            </div>
            {contrib.recentInstallments.slice(0, 3).map((inst, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs',
                    inst.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                    inst.status === 'rejected' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'
                  )}>
                    {inst.status === 'approved' ? '✓' : inst.status === 'rejected' ? '✗' : '⏳'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(inst.amount)}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(inst.createdAt)}</p>
                  </div>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                  inst.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                  inst.status === 'rejected' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'
                )}>{inst.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CHAIRMAN / ADMIN role section ───────────────────────────── */}
      {isChairman && rd.members && (
        <div className="space-y-3">
          <SectionHead action={<ViewAllLink href="/dashboard/analytics" />}>Organisation Overview</SectionHead>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill label="Total Members"    value={(rd.members as { total: number }).total}    icon={Users}     color="blue" />
            <StatPill label="Active"           value={(rd.members as { active: number }).active}   icon={UserCheck} color="green" />
            <StatPill label="Pending Approval" value={(rd.members as { pending: number }).pending} icon={Clock}     color="amber" />
            <StatPill label="Welfare Pending"  value={((rd.welfare as { pending: number })?.pending ?? 0)} icon={Heart} color="red" />
          </div>
          {rd.finance && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatPill label="Monthly Collected"  value={formatCurrency((rd.finance as { monthlyCollected: number }).monthlyCollected)} icon={Wallet}      color="green" />
              <StatPill label="Completed Contribs" value={(rd.finance as { completedContributions: number }).completedContributions}     icon={CheckCircle} color="green" />
              <StatPill label="Pending Payments"   value={(rd.finance as { pendingInstallments: number }).pendingInstallments}           icon={Clock}       color="orange" />
              <StatPill label="Balance"            value={formatCurrency((rd.finance as { balance: number }).balance)}                   icon={TrendingUp}  color={(rd.finance as { balance: number }).balance >= 0 ? 'green' : 'red'} />
            </div>
          )}
        </div>
      )}

      {/* ── TREASURER role section ───────────────────────────────────── */}
      {isTreasurer && rd.finance && (
        <div className="space-y-3">
          <SectionHead action={<ViewAllLink href="/dashboard/finance" />}>Finance Overview</SectionHead>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill label="Monthly Collected"  value={formatCurrency((rd.finance as { monthlyCollected: number }).monthlyCollected)} icon={Wallet}      color="green" />
            <StatPill label="Completed"          value={(rd.finance as { completedContributions: number }).completedContributions}     icon={CheckCircle} color="green" />
            <StatPill label="Pending Payments"   value={(rd.finance as { pendingInstallments: number }).pendingInstallments}           icon={Clock}       color="orange" />
            <StatPill label="Balance"            value={formatCurrency((rd.finance as { balance: number }).balance)}                   icon={TrendingUp}  color={(rd.finance as { balance: number }).balance >= 0 ? 'green' : 'red'} />
          </div>
          {Array.isArray(rd.recentPendingPayments) && rd.recentPendingPayments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" /> Pending Approvals
                </p>
                <ViewAllLink href="/dashboard/finance" />
              </div>
              {(rd.recentPendingPayments as { _id: string; amount: number; userId: { fullName: string; membershipType: string }; month: string }[]).map(p => (
                <div key={p._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-xs font-bold text-[#1E3A8A]">
                      {getInitials(p.userId?.fullName ?? '?')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.userId?.fullName}</p>
                      <p className="text-xs text-slate-400 capitalize">{membershipTypeLabel(p.userId?.membershipType)} · {fmtMonth(p.month)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{formatCurrency(p.amount)}</span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MEMBERSHIP COORDINATOR role section ─────────────────────── */}
      {isMemberCoord && rd.members && (
        <div className="space-y-3">
          <SectionHead action={<ViewAllLink href="/dashboard/users" />}>Membership Overview</SectionHead>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill label="Total Members"    value={(rd.members as { total: number }).total}              icon={Users}     color="blue" />
            <StatPill label="Active"           value={(rd.members as { active: number }).active}             icon={UserCheck} color="green" />
            <StatPill label="Pending Approval" value={(rd.members as { pending: number }).pending}           icon={Clock}     color="amber" />
            <StatPill label="New This Month"   value={(rd.members as { newThisMonth: number }).newThisMonth} icon={Sparkles}  color="purple" />
          </div>
          {Array.isArray(rd.membershipBreakdown) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Membership Breakdown</p>
              <div className="space-y-2.5">
                {(rd.membershipBreakdown as { _id: string; count: number }[]).map(b => (
                  <div key={b._id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 w-28 capitalize">{membershipTypeLabel(b._id)}</span>
                    <div className="flex-1">
                      <ProgressBar pct={Math.min(100, (b.count / ((rd.members as { total: number }).total || 1)) * 100)} color="#1E3A8A" thin />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(rd.recentPendingMembers) && rd.recentPendingMembers.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Awaiting Approval
                </p>
                <ViewAllLink href="/dashboard/users" />
              </div>
              {(rd.recentPendingMembers as { _id: string; fullName: string; email: string; membershipType: string; createdAt: string }[]).map(m => (
                <div key={m._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-700">
                      {getInitials(m.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{m.fullName}</p>
                      <p className="text-xs text-slate-400">{membershipTypeLabel(m.membershipType)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECRETARY / PROGRAM COORDINATOR role section ─────────────── */}
      {isSecretary && rd.programs && (
        <div className="space-y-3">
          <SectionHead action={<ViewAllLink href="/dashboard/programs" />}>Programs & Attendance</SectionHead>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill label="Total Programs"  value={(rd.programs as { total: number }).total}       icon={Target}    color="blue" />
            <StatPill label="Upcoming"        value={(rd.programs as { upcoming: number }).upcoming}  icon={Calendar}  color="orange" />
            <StatPill label="Ongoing"         value={(rd.programs as { ongoing: number }).ongoing}    icon={Activity}  color="green" />
            <StatPill label="Attendance Rate" value={`${(rd.attendance as { rate: string })?.rate ?? 0}%`} icon={UserCheck} color="purple" />
          </div>
        </div>
      )}

      {/* ── PRO role section ─────────────────────────────────────────── */}
      {isPRO && rd.announcements && (
        <div className="space-y-3">
          <SectionHead action={<ViewAllLink href="/dashboard/announcements" />}>Announcements Overview</SectionHead>
          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Total Posts" value={(rd.announcements as { total: number }).total}        icon={Megaphone}   color="blue" />
            <StatPill label="Published"   value={(rd.announcements as { published: number }).published} icon={CheckCircle} color="green" />
            <StatPill label="Drafts"      value={(rd.announcements as { draft: number }).draft}         icon={FileText}    color="orange" />
          </div>
        </div>
      )}

      {/* ── WELFARE OFFICER role section ─────────────────────────────── */}
      {isWelfare && rd.welfare && (
        <div className="space-y-3">
          <SectionHead action={<ViewAllLink href="/dashboard/welfare" />}>Welfare Requests</SectionHead>
          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Pending"     value={(rd.welfare as { pending: number }).pending}       icon={AlertCircle} color="red" />
            <StatPill label="In Progress" value={(rd.welfare as { inProgress: number }).inProgress} icon={Clock}       color="orange" />
            <StatPill label="Resolved"    value={(rd.welfare as { resolved: number }).resolved}     icon={CheckCircle} color="green" />
          </div>
        </div>
      )}

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <div>
        <SectionHead>Quick Actions</SectionHead>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map(a => (
            <Link key={a.href + a.label} href={a.href}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-[#1E3A8A]/30 hover:shadow-md transition-all group hover:-translate-y-0.5">
              <span className="text-xl shrink-0">{a.icon}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 flex-1 leading-tight">{a.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Announcements ─────────────────────────────────────── */}
      {data?.recentAnnouncements && data.recentAnnouncements.length > 0 && (
        <div>
          <SectionHead action={<ViewAllLink href="/dashboard/announcements" />}>
            Recent Announcements
          </SectionHead>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            {data.recentAnnouncements.map((a, i) => (
              <Link key={a._id} href="/dashboard/announcements"
                className={cn('flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                  i < data.recentAnnouncements.length - 1 && 'border-b border-slate-50 dark:border-slate-800/60')}>
                <div className="w-9 h-9 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{a.title}</p>
                  <p className="text-xs text-slate-400 capitalize">{a.category?.replace(/_/g, ' ')} · {formatDate(a.createdAt)}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Founding member badge ────────────────────────────────────── */}
      {user.isFoundingMember && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white shadow-lg">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0">🏅</div>
            <div>
              <p className="font-extrabold text-base">Founding Member #{user.foundingMemberRank}</p>
              <p className="text-white/70 text-xs mt-0.5">You are one of the original members of VOA. Thank you for your dedication.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#1e4db7] p-5 text-white text-center">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <Heart className="w-4 h-4 text-orange-300 mx-auto mb-1.5" />
        <p className="font-extrabold text-sm">&ldquo;Empowering Voices. Building Futures.&rdquo;</p>
        <p className="text-white/50 text-xs mt-1">Voice of Adolescents · Together we grow</p>
      </div>

    </div>
  );
}
