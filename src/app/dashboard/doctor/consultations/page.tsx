'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService } from '@/services/doctorApi.service';
import { Consultation } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, Search, UserPlus, ArrowRight } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600' },
  doctor_accepted: { label: 'Accepted', color: 'bg-blue-500/10 text-blue-600' },
  patient_confirmed: { label: 'Confirmed', color: 'bg-purple-500/10 text-purple-600' },
  in_progress: { label: 'In Progress', color: 'bg-green-500/10 text-green-600' },
  completed: { label: 'Completed', color: 'bg-gray-500/10 text-gray-600' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/10 text-red-600' },
};

type FilterKey = 'all' | 'active' | 'doctor_accepted' | 'in_progress' | 'completed' | 'cancelled';

export default function ConsultationsPage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const statusMap: Record<FilterKey, string | undefined> = {
          all: undefined,
          active: 'in_progress',
          doctor_accepted: 'doctor_accepted',
          in_progress: 'in_progress',
          completed: 'completed',
          cancelled: 'cancelled',
        };
        const res = await doctorService.getConsultations(statusMap[filter]);
        setConsultations(res.data.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated, filter]);

  if (!_hydrated || !isAuthenticated) return null;

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'doctor_accepted', label: 'Accepted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filtered = consultations.filter(c =>
    !search || c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.patient?.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Consultations</h1>
          <p className="text-sm text-muted mt-1">{filtered.length} total</p>
        </div>
        <Link
          href="/dashboard/doctor/walk-in"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Walk-in Patient
        </Link>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name or phone..."
            className="w-full rounded-xl border border-default bg-card-bg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl border border-default bg-card-bg w-fit overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                filter === t.key ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-sm text-muted">No consultations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const cfg = STATUS_CONFIG[c.status] || { label: c.status, color: '' };
            return (
              <Link
                key={c._id}
                href={`/dashboard/doctor/consultations/${c._id}`}
                className={cn(
                  'flex items-center justify-between rounded-xl border bg-card-bg p-4 transition-colors',
                  c.status === 'in_progress' ? 'border-green-500/30 hover:border-green-500/50' :
                  c.status === 'pending' ? 'border-yellow-500/20 hover:border-yellow-500/40' :
                  'border-default hover:border-primary/30'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    c.status === 'in_progress' ? 'bg-green-500/10 text-green-500' :
                    c.status === 'completed' ? 'bg-gray-500/10 text-gray-500' :
                    'bg-primary/10 text-primary'
                  )}>
                    {(c.patient?.name || 'P').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.patient?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted truncate">
                      {c.type === 'online' ? 'Online' : 'In-person'}
                      {' · '}
                      {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {c.patient?.age && ` · ${c.patient.age}yrs`}
                    </p>
                  </div>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', cfg.color)}>
                  {cfg.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
