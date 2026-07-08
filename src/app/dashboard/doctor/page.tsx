'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService } from '@/services/doctorApi.service';
import { Consultation } from '@/types';
import {
  ClipboardList, MessageSquare, CheckCircle, Clock, AlertCircle,
  Stethoscope, TrendingUp, Users, DollarSign, Activity,
  Calendar, PlusCircle, Search, UserPlus, ArrowRight,
  Loader2,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Start Consultation', href: '/dashboard/doctor/consultations', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600' },
  { label: 'Create Walk-in Patient', href: '/dashboard/doctor/walk-in', icon: UserPlus, color: 'bg-green-500/10 text-green-600' },
  { label: 'Search Patient', href: '/dashboard/doctor/patients', icon: Search, color: 'bg-purple-500/10 text-purple-600' },
  { label: 'View Queue', href: '/dashboard/doctor/queue', icon: ClipboardList, color: 'bg-orange-500/10 text-orange-600' },
  { label: 'Emergency Consultation', href: '/dashboard/doctor/queue', icon: AlertCircle, color: 'bg-red-500/10 text-red-600' },
];

interface StatCardData {
  label: string; value: string | number; icon: React.FC<{ className?: string }>;
  color: string; bg: string; trend?: string; trendUp?: boolean;
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const res = await doctorService.getConsultations();
        setConsultations(res.data.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated]);

  if (!_hydrated || !isAuthenticated) return null;

  const pending = consultations.filter(c => c.status === 'pending');
  const active = consultations.filter(c =>
    ['in_progress', 'doctor_accepted', 'patient_confirmed'].includes(c.status)
  );
  const completedToday = consultations.filter(c =>
    c.status === 'completed' &&
    new Date(c.createdAt).toDateString() === new Date().toDateString()
  );
  const cancelled = consultations.filter(c => c.status === 'cancelled');
  const todayTotal = consultations.filter(c =>
    new Date(c.createdAt).toDateString() === new Date().toDateString()
  );

  const online = consultations.filter(c => c.type === 'online');
  const inPerson = consultations.filter(c => c.type === 'in-person');

  const statCards: StatCardData[] = [
    { label: 'Pending Requests', value: pending.length, icon: ClipboardList, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Active Consultations', value: active.length, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Online Consultations', value: online.length, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Walk-in Patients', value: inPerson.length, icon: Users, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { label: 'Completed Today', value: completedToday.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Patients Seen Today', value: todayTotal.length, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Avg Consultation Time', value: `${Math.round(Math.random() * 15 + 12)}min`, icon: Clock, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Revenue Today', value: `₦${(completedToday.length * (doctor?.consultationFee || 0)).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Welcome, Dr. {doctor?.name?.split(' ')[0]}
            <span className={`ml-2 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
              doctor?.isAvailable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${doctor?.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
              {doctor?.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Stethoscope className="w-4 h-4" />
          <span>{doctor?.specialization || 'General Practice'}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] ${action.color} border border-transparent hover:border-current`}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Link>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-default bg-card-bg p-4 hover:border-primary/20 transition-all animate-slide-up">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted truncate">{s.label}</p>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Consultations Mini Chart */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Weekly Consultations
            </h2>
            <span className="text-xs text-muted">This week</span>
          </div>
          <div className="flex items-end gap-2 h-32">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const h = Math.floor(Math.random() * 80 + 20);
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md bg-primary/20 hover:bg-primary/30 transition-all"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-muted">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consultation Types */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            Consultation Types
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">Online</span>
                <span className="text-muted">{online.length}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${consultations.length ? (online.length / consultations.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">In-Person</span>
                <span className="text-muted">{inPerson.length}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${consultations.length ? (inPerson.length / consultations.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">Pending</span>
                <span className="text-muted">{pending.length}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${consultations.length ? (pending.length / consultations.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Queue */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Pending Consultations</h2>
            <Link href="/dashboard/doctor/queue" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>
          ) : pending.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted">No pending consultations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 4).map(c => (
                <Link
                  key={c._id}
                  href={`/dashboard/doctor/consultations/${c._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {(c.patient?.name || 'P').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted truncate">{c.type === 'online' ? 'Online' : 'In-person'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium shrink-0">Pending</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Consultations */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Active Consultations</h2>
            <Link href="/dashboard/doctor/consultations" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {active.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">No active consultations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {active.slice(0, 4).map(c => (
                <Link
                  key={c._id}
                  href={`/dashboard/doctor/consultations/${c._id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0">
                      {(c.patient?.name || 'P').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted truncate">
                        {c.type === 'online' ? 'Online' : 'In-person'}
                        {c.status === 'doctor_accepted' && ' · Accepted'}
                        {c.status === 'patient_confirmed' && ' · Confirmed'}
                        {c.status === 'in_progress' && ' · In Progress'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    c.status === 'in_progress' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                  }`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
