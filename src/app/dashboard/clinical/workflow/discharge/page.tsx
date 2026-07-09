'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { useWorkflowStore } from '@/store/workflowStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  LogOut, Loader2, Clock, ChevronRight, User, X, FileText,
  AlertTriangle, CheckCircle, Calendar,
} from 'lucide-react';

export default function DischargePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const { activeVisits, fetchActiveVisits, dischargePatient } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const { initSocketListener } = useWorkflowStore();
  const canDischarge = hasPermission(user, PERMISSIONS.DISCHARGE_PATIENT as any);
  const dischargeReadyVisits = activeVisits.filter((v: any) =>
    ['in_consultation', 'lab_ordered', 'in_pharmacy', 'dispensed'].includes(v.status)
  );

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveVisits();
      initSocketListener();
      setLoading(false);
    }
  }, [isAuthenticated, fetchActiveVisits, initSocketListener]);

  const handleDischarge = async () => {
    if (!selectedVisit) return;
    if (!diagnosis.trim()) return toast.error('Diagnosis is required');

    setSubmitting(true);
    try {
      await dischargePatient(selectedVisit._id, {
        diagnosis: diagnosis.trim(),
        dischargeSummary: dischargeSummary.trim() || undefined,
        notes: notes.trim() || undefined,
        followUpDate: followUpDate || undefined,
        followUpNotes: followUpNotes.trim() || undefined,
      });
      toast.success(`${selectedVisit.patient?.name} discharged successfully`);
      setSelectedVisit(null);
      setDiagnosis('');
      setDischargeSummary('');
      setNotes('');
      setFollowUpDate('');
      setFollowUpNotes('');
      fetchActiveVisits();
    } catch { toast.error('Failed to discharge patient'); }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discharge & Follow-up</h1>
          <p className="text-sm text-muted mt-1">Complete patient visits and schedule follow-ups</p>
        </div>
        <button onClick={() => fetchActiveVisits()} className="text-sm text-primary hover:underline flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!canDischarge && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have discharge permission.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient List */}
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[70vh] overflow-y-auto">
            {dischargeReadyVisits.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No patients ready for discharge</p>
              </div>
            ) : dischargeReadyVisits.map((v: any) => (
              <button key={v._id} onClick={() => setSelectedVisit(v)}
                className={cn('w-full text-left p-4 hover:bg-hover/50 transition-colors',
                  selectedVisit?._id === v._id && 'bg-rose-500/5'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-xs font-bold shrink-0">
                      {(v.patient?.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{v.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">{v.patient?.phone}{v.patient?.age ? ` · ${v.patient.age}y` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      v.status === 'in_consultation' ? 'bg-green-500/10 text-green-600' :
                      v.status === 'lab_ordered' ? 'bg-purple-500/10 text-purple-600' :
                      v.status === 'in_pharmacy' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-teal-500/10 text-teal-600'
                    )}>
                      {v.status?.replace(/_/g, ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                  </div>
                </div>
                {v.chiefComplaint && <p className="text-xs text-muted mt-1 line-clamp-1">{v.chiefComplaint}</p>}
              </button>
            ))}
          </div>

          {/* Discharge Form */}
          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {!selectedVisit ? (
              <div className="py-12 text-center">
                <LogOut className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a patient to discharge</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-rose-500" />
                    {selectedVisit.patient?.name}
                  </h2>
                  <button onClick={() => setSelectedVisit(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">
                    Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                    placeholder="Primary diagnosis"
                    className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none" rows={2}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Discharge Summary</label>
                  <textarea value={dischargeSummary} onChange={e => setDischargeSummary(e.target.value)}
                    placeholder="Summary of visit, treatment provided, and outcomes"
                    className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none" rows={3}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Additional Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Any additional notes"
                    className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none" rows={2}
                  />
                </div>

                <div className="border-t border-default pt-4">
                  <h3 className="text-xs font-semibold text-muted uppercase mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Follow-up (optional)
                  </h3>
                  <div className="space-y-2">
                    <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    <textarea value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)}
                      placeholder="Follow-up instructions"
                      className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none" rows={2}
                    />
                  </div>
                </div>

                <button onClick={handleDischarge} disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Complete Discharge'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
