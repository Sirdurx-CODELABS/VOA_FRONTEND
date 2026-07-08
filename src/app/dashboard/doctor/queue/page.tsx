'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService, consultationService } from '@/services/doctorApi.service';
import { Consultation } from '@/types';
import toast from 'react-hot-toast';
import {
  UserCheck, UserX, RefreshCw, Loader2, Clock, AlertTriangle,
  Flame, Calendar, Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type QueueTab = 'pending' | 'emergency' | 'booked' | 'walk-in';

export default function QueuePage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<QueueTab>('pending');

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getConsultations('pending');
      setConsultations(res.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchQueue();
  }, [isAuthenticated]);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await consultationService.accept(id);
      toast.success('Consultation accepted');
      fetchQueue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to accept';
      toast.error(msg);
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await consultationService.reject(id);
      toast.success('Consultation rejected');
      fetchQueue();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to reject';
      toast.error(msg);
    }
    setActionLoading(null);
  };

  if (!_hydrated || !isAuthenticated) return null;

  const categorized = {
    pending: consultations.filter(c => c.status === 'pending'),
    emergency: consultations.filter(c => c.status === 'pending' && false),
    booked: consultations.filter(c => c.status === 'pending'),
    'walk-in': consultations.filter(c => c.status === 'pending' && c.type === 'in-person'),
  };

  const tabs: { key: QueueTab; label: string; icon: React.FC<{ className?: string }>; count: number; color: string }[] = [
    { key: 'pending', label: 'AI Referrals', icon: AlertTriangle, count: categorized.pending.length, color: 'text-yellow-500' },
    { key: 'emergency', label: 'Emergency', icon: Flame, count: 0, color: 'text-red-500' },
    { key: 'booked', label: 'Booked Appointments', icon: Calendar, count: categorized.booked.length, color: 'text-blue-500' },
    { key: 'walk-in', label: 'Walk-in Requests', icon: Stethoscope, count: categorized['walk-in'].length, color: 'text-green-500' },
  ];

  const queue = categorized[activeTab];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultation Queue</h1>
          <p className="text-sm text-muted mt-1">{consultations.length} total pending</p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="p-2 rounded-lg border border-default hover:bg-card-bg text-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap border',
                activeTab === t.key
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'border-default text-muted hover:text-foreground hover:bg-hover'
              )}
            >
              <Icon className={cn('w-4 h-4', t.color)} />
              {t.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                activeTab === t.key ? 'bg-primary/20 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-muted'
              )}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
          <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">All Clear</h3>
          <p className="text-sm text-muted">No {activeTab.replace('-', ' ')} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(c => (
            <div
              key={c._id}
              className="rounded-xl border border-default bg-card-bg p-5 hover:border-primary/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base font-bold shrink-0">
                    {(c.patient?.name || 'P').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/doctor/consultations/${c._id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary truncate"
                      >
                        {c.patient?.name || 'Unknown Patient'}
                      </Link>
                      {/* Risk indicator */}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">Low Risk</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted flex-wrap">
                      <span>{c.patient?.age ? `${c.patient.age}yrs` : '—'}</span>
                      <span className="capitalize">{c.patient?.gender || '—'}</span>
                      <span>{c.type === 'online' ? 'Online' : 'In-person'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {c.hospital && typeof c.hospital === 'object' && (
                        <span>{(c.hospital as { name: string }).name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium shrink-0">Pending</span>
              </div>

              {/* Reason */}
              {c.aiSummary?.symptoms && (
                <p className="text-xs text-muted mt-3 line-clamp-2">{c.aiSummary.symptoms}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-default">
                <button
                  onClick={() => handleAccept(c._id)}
                  disabled={actionLoading === c._id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === c._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                  Accept
                </button>
                <button
                  onClick={() => handleReject(c._id)}
                  disabled={actionLoading === c._id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <UserX className="w-3 h-3" />
                  Reject
                </button>
                <Link
                  href={`/dashboard/doctor/consultations/${c._id}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-medium transition-colors"
                >
                  View Summary
                </Link>
                <button
                  onClick={() => handleAccept(c._id)}
                  disabled={actionLoading === c._id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors disabled:opacity-50 ml-auto"
                >
                  <Stethoscope className="w-3 h-3" />
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
