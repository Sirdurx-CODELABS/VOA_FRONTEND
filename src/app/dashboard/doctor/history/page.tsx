'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService } from '@/services/doctorApi.service';
import { Consultation } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, History, FileText, Clock, CheckCircle, XCircle, Search } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const [completed, cancelled] = await Promise.all([
          doctorService.getConsultations('completed'),
          doctorService.getConsultations('cancelled'),
        ]);
        setConsultations([...(completed.data.data || []), ...(cancelled.data.data || [])]);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated]);

  if (!_hydrated || !isAuthenticated) return null;

  const filtered = consultations.filter(c =>
    !search || c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.patient?.phone?.includes(search)
  );

  const completedCount = filtered.filter(c => c.status === 'completed').length;
  const cancelledCount = filtered.filter(c => c.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultation History</h1>
          <p className="text-sm text-muted mt-1">
            {consultations.length} total &middot;
            <span className="text-green-500 ml-1">{completedCount} completed</span>
            <span className="text-red-500 ml-1">| {cancelledCount} cancelled</span>
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient..."
            className="w-full sm:w-64 rounded-xl border border-default bg-card-bg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
          <History className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-sm text-muted">No past consultations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <Link
              key={c._id}
              href={`/dashboard/doctor/consultations/${c._id}`}
              className="flex items-center justify-between rounded-xl border border-default bg-card-bg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                  c.status === 'completed' ? 'bg-gray-500/10 text-gray-500' : 'bg-red-500/10 text-red-500'
                )}>
                  {(c.patient?.name || 'P').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.patient?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {c.notes && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Has notes</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium',
                  c.status === 'completed' ? 'bg-gray-500/10 text-gray-600' : 'bg-red-500/10 text-red-600'
                )}>
                  {c.status === 'completed' ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                  {c.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
