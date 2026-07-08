'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, User, Loader2, X, ChevronRight, Users,
  Eye, Stethoscope, Pill, Beaker, HeartHandshake,
  Activity, FileText, Calendar, Clock, AlertCircle, ClipboardCheck,
} from 'lucide-react';

export default function ClinicalPatientsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canView = hasPermission(user, PERMISSIONS.VIEW_PATIENT as any);

  const fetchPatients = useCallback(async (q: string) => {
    try {
      const res = await clinicalService.searchPatients(q);
      setPatients(res.data?.data || []);
    } catch { /* ignore */ }
    setSearching(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !canView) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { fetchPatients(''); return; }
    setSearching(true);
    searchTimer.current = setTimeout(() => fetchPatients(query.trim()), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, isAuthenticated, canView, fetchPatients]);

  const openDetail = async (patient: any) => {
    setSelected(patient);
    setDetailLoading(true);
    try {
      const [detail, timeline] = await Promise.allSettled([
        clinicalService.getPatientDetail(patient._id),
        clinicalService.getPatientTimeline(patient._id),
      ]);
      setDetailData({
        patient: detail.status === 'fulfilled' ? detail.value.data?.data : patient,
        timeline: timeline.status === 'fulfilled' ? timeline.value.data?.data?.slice(0, 10) : [],
      });
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelected(null); setDetailData(null); };

  if (!_hydrated || !isAuthenticated) return null;

  const timelineIcons: Record<string, React.FC<{ className?: string }>> = {
    triage_completed: ClipboardCheck, vitals_recorded: Activity,
    consultation_requested: Stethoscope, prescription_reviewed: Pill,
    prescription_dispensed: Pill, sample_collected: Beaker,
    lab_result_uploaded: Beaker, lab_critical_flagged: AlertCircle,
    counseling_session: HeartHandshake, case_opened: FileText,
    referral_sent: Activity, home_visit: Activity,
    outreach_conducted: Activity,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clinical Patients</h1>
        <p className="text-sm text-muted mt-1">Search and manage patient medical records</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, phone, ART number, or file number..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-default bg-card-bg text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin" />}
        {query && !searching && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-default bg-card-bg overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-default" />
                <div className="flex-1 space-y-2"><div className="h-3 bg-default rounded w-1/4" /><div className="h-2.5 bg-default rounded w-1/6" /></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {selected && detailData && (
              <div className="lg:hidden flex items-center justify-between p-3 border-b border-default bg-hover">
                <button onClick={closeDetail} className="flex items-center gap-1 text-sm text-primary hover:underline"><ChevronRight className="w-4 h-4 rotate-180" /> Back</button>
                <span className="text-sm font-medium text-foreground truncate">{selected.name}</span>
              </div>
            )}
            <div className="flex flex-col lg:flex-row">
              <div className={cn('min-w-0 flex-1', selected && 'hidden lg:block')}>
                {patients.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="w-10 h-10 text-muted mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No patients found</h3>
                    <p className="text-sm text-muted">{query ? 'Try adjusting your search' : 'No patient records available'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-default">
                    {patients.map((p: any) => (
                      <button key={p._id} onClick={() => openDetail(p)}
                        className="w-full text-left p-4 hover:bg-hover transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {(p.name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                            <p className="text-xs text-muted">{p.phone || '—'} {p.age ? ` · ${p.age}y` : ''} {p.gender ? ` · ${p.gender}` : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted shrink-0">
                          {p.artNumber && <span className="font-mono">{p.artNumber}</span>}
                          <Eye className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selected && detailData && (
                <div className={cn('w-full lg:w-[500px] border-t lg:border-t-0 lg:border-l border-default overflow-y-auto max-h-[70vh]')}>
                  <div className="hidden lg:flex items-center justify-between p-3 border-b border-default bg-hover sticky top-0">
                    <h2 className="text-sm font-semibold text-foreground">Patient Details</h2>
                    <button onClick={closeDetail} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  {detailLoading ? (
                    <div className="p-8 space-y-4">
                      {[...Array(6)].map((_, i) => <div key={i} className="animate-pulse space-y-2"><div className="h-3 bg-default rounded w-1/3" /><div className="h-8 bg-default rounded w-full" /></div>)}
                    </div>
                  ) : (
                    <div className="divide-y divide-default">
                      <div className="p-4 space-y-2">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><User className="w-4 h-4 text-primary" /> Personal</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><p className="text-xs text-muted">Name</p><p className="text-foreground font-medium">{detailData.patient.name}</p></div>
                          <div><p className="text-xs text-muted">Phone</p><p className="text-foreground">{detailData.patient.phone || '—'}</p></div>
                          <div><p className="text-xs text-muted">Age</p><p className="text-foreground">{detailData.patient.age ?? '—'}</p></div>
                          <div><p className="text-xs text-muted">Gender</p><p className="text-foreground">{detailData.patient.gender || '—'}</p></div>
                        </div>
                      </div>
                      {detailData.patient.artNumber && (
                        <div className="p-4 space-y-2">
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Stethoscope className="w-4 h-4 text-primary" /> Clinical IDs</h3>
                          <p className="text-sm"><span className="text-muted">ART:</span> <span className="font-mono">{detailData.patient.artNumber}</span></p>
                          {detailData.patient.fileNumber && <p className="text-sm"><span className="text-muted">File:</span> <span className="font-mono">{detailData.patient.fileNumber}</span></p>}
                        </div>
                      )}
                      {detailData.timeline?.length > 0 && (
                        <div className="p-4 space-y-2">
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Activity className="w-4 h-4 text-primary" /> Recent Activity</h3>
                          <div className="space-y-1">
                            {detailData.timeline.map((t: any) => {
                              const Icon = timelineIcons[t.activityType] || Activity;
                              return (
                                <div key={t._id} className="flex items-start gap-2 p-2 rounded-lg bg-hover/50">
                                  <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-foreground font-medium capitalize">{t.activityType?.replace(/_/g, ' ')}</p>
                                    <p className="text-[10px] text-muted">{t.performedByName ? `by ${t.performedByName}` : ''} · {new Date(t.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


