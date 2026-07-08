'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  HeartHandshake, Loader2, AlertTriangle, CheckCircle,
  ChevronRight, X, User, Calendar, MessageSquare,
} from 'lucide-react';

export default function AdherencePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionForm, setSessionForm] = useState({ patient: '', type: 'adherence', adherenceScore: 80, missedDoses: 0, notes: '', actionPlan: '' });
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canView = hasPermission(user, PERMISSIONS.VIEW_ADHERENCE as any);
  const canCounsel = hasPermission(user, PERMISSIONS.CONDUCT_COUNSELING as any);

  const fetch = useCallback(async () => {
    try {
      const res = await clinicalService.getPoorAdherencePatients();
      setPatients(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAuthenticated) fetch(); }, [isAuthenticated, fetch]);

  const selectPatient = async (p: any) => {
    setSelected(p);
    setSessionForm(f => ({ ...f, patient: p.patient?._id || p._id }));
    try {
      const res = await clinicalService.getPatientCounselingSessions(p.patient?._id || p._id);
      setSessions(res.data?.data || []);
    } catch { setSessions([]); }
  };

  const handleCreateSession = async () => {
    if (!sessionForm.patient) return toast.error('No patient selected');
    setSubmitting(true);
    try {
      await clinicalService.createCounselingSession(sessionForm);
      toast.success('Counseling session recorded');
      setSessionForm({ patient: '', type: 'adherence', adherenceScore: 80, missedDoses: 0, notes: '', actionPlan: '' });
      if (selected) selectPatient(selected);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Adherence Counseling</h1>
        <p className="text-sm text-muted mt-1">Track patient adherence and conduct counseling sessions</p>
      </div>

      {!canView && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have adherence counseling permissions.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[70vh] overflow-y-auto">
            {patients.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No patients with adherence issues</p>
              </div>
            ) : patients.map((p: any) => (
              <button key={p._id} onClick={() => selectPatient(p)}
                className={cn('w-full text-left p-4 hover:bg-hover transition-colors', selected?._id === p._id && 'bg-primary/5')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-xs font-bold shrink-0">
                      {(p.patient?.name || 'P').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">
                        Adherence: {p.adherenceScore ?? p.medicationAdherence ?? 'N/A'}%
                        {p.missedRefills ? ` · Missed refills: ${p.missedRefills}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                      (p.adherenceScore ?? p.medicationAdherence ?? 100) < 50 ? 'bg-red-500/10 text-red-600' :
                      (p.adherenceScore ?? p.medicationAdherence ?? 100) < 80 ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-green-500/10 text-green-600'
                    )}>
                      {p.latestViralLoadStatus === 'unsuppressed' ? 'Unsuppressed' : 'At risk'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {!selected ? (
              <div className="py-12 text-center">
                <HeartHandshake className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a patient</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">{selected.patient?.name || 'Patient'}</h2>
                  <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
                {sessions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase mb-2">Previous Sessions</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {sessions.slice(0, 5).map((s: any) => (
                        <div key={s._id} className="p-2 rounded-lg bg-hover/50 text-xs">
                          <span className="text-foreground font-medium">{s.type}</span>
                          <span className="text-muted"> · {new Date(s.createdAt).toLocaleDateString()}</span>
                          {s.adherenceScore != null && <span className="text-muted"> · Score: {s.adherenceScore}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {canCounsel && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted uppercase">New Session</h3>
                    <select value={sessionForm.type} onChange={e => setSessionForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm"
                    >
                      <option value="adherence">Adherence Counseling</option>
                      <option value="psychosocial">Psychosocial Support</option>
                      <option value="disclosure">Disclosure Support</option>
                      <option value="treatment_readiness">Treatment Readiness</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-muted">Adherence Score</label>
                        <input type="number" min="0" max="100" value={sessionForm.adherenceScore} onChange={e => setSessionForm(p => ({ ...p, adherenceScore: +e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted">Missed Doses (30d)</label>
                        <input type="number" min="0" value={sessionForm.missedDoses} onChange={e => setSessionForm(p => ({ ...p, missedDoses: +e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm"
                        />
                      </div>
                    </div>
                    <textarea placeholder="Session notes" value={sessionForm.notes} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm resize-none" rows={3}
                    />
                    <textarea placeholder="Action plan" value={sessionForm.actionPlan} onChange={e => setSessionForm(p => ({ ...p, actionPlan: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm resize-none" rows={2}
                    />
                    <button onClick={handleCreateSession} disabled={submitting}
                      className="w-full px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >{submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Record Session'}</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
