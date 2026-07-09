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
  FlaskConical, Loader2, Clock, ChevronRight, User, Plus, X,
  AlertTriangle, CheckCircle, Search, Trash2, Stethoscope,
} from 'lucide-react';

const LAB_CATEGORIES = [
  { value: 'viral_load', label: 'Viral Load' },
  { value: 'cd4', label: 'CD4 Count' },
  { value: 'fbc', label: 'Full Blood Count' },
  { value: 'lft', label: 'Liver Function Test' },
  { value: 'rft', label: 'Renal Function Test' },
  { value: 'genexpert', label: 'GeneXpert' },
  { value: 'malaria', label: 'Malaria' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'urinalysis', label: 'Urinalysis' },
  { value: 'custom', label: 'Custom' },
] as const;

export default function LabHandoffPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const { activeVisits, fetchActiveVisits } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tests, setTests] = useState<{ testName: string; category: string; notes: string; isUrgent: boolean }[]>([]);
  const [labNotes, setLabNotes] = useState('');

  const { initSocketListener } = useWorkflowStore();
  const canRequest = hasPermission(user, PERMISSIONS.REQUEST_LAB as any);
  const consultationVisits = activeVisits.filter((v: any) =>
    v.status === 'in_consultation' || v.status === 'lab_ordered'
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

  useEffect(() => {
    if (selectedVisit && tests.length === 0) {
      setTests([{ testName: '', category: 'fbc', notes: '', isUrgent: false }]);
    }
  }, [selectedVisit]);

  const addTest = () => setTests((prev) => [...prev, { testName: '', category: 'fbc', notes: '', isUrgent: false }]);
  const removeTest = (idx: number) => setTests((prev) => prev.filter((_, i) => i !== idx));
  const updateTest = (idx: number, field: string, value: any) => {
    setTests((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleSubmit = async () => {
    if (!selectedVisit) return;
    const validTests = tests.filter((t) => t.testName.trim());
    if (validTests.length === 0) return toast.error('Add at least one test');

    setSubmitting(true);
    try {
      await clinicalService.requestLab({
        patientId: selectedVisit.patient?._id,
        visitId: selectedVisit._id,
        tests: validTests.map((t) => ({
          testName: t.testName,
          category: t.category,
          notes: t.notes || undefined,
          isUrgent: t.isUrgent,
        })),
        notes: labNotes || undefined,
      });
      toast.success('Lab tests ordered');
      setSelectedVisit(null);
      setTests([]);
      setLabNotes('');
      fetchActiveVisits();
    } catch { toast.error('Failed to order lab tests'); }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lab Request Handoff</h1>
          <p className="text-sm text-muted mt-1">Order laboratory tests for patients in consultation</p>
        </div>
        <button onClick={() => fetchActiveVisits()} className="text-sm text-primary hover:underline flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!canRequest && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have permission to request lab tests.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient List */}
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[70vh] overflow-y-auto">
            {consultationVisits.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No patients in consultation</p>
              </div>
            ) : consultationVisits.map((v: any) => (
              <button key={v._id} onClick={() => setSelectedVisit(v)}
                className={cn('w-full text-left p-4 hover:bg-hover/50 transition-colors',
                  selectedVisit?._id === v._id && 'bg-purple-500/5'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs font-bold shrink-0">
                      {(v.patient?.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{v.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">{v.patient?.phone}{v.patient?.age ? ` · ${v.patient.age}y` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full',
                      v.status === 'in_consultation' ? 'bg-green-500/10 text-green-600' : 'bg-purple-500/10 text-purple-600'
                    )}>
                      {v.status?.replace(/_/g, ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </div>
                {v.chiefComplaint && <p className="text-xs text-muted mt-1 line-clamp-1">{v.chiefComplaint}</p>}
              </button>
            ))}
          </div>

          {/* Lab Order Form */}
          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {!selectedVisit ? (
              <div className="py-12 text-center">
                <FlaskConical className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a patient to order lab tests</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-500" />
                    {selectedVisit.patient?.name}
                  </h2>
                  <button onClick={() => setSelectedVisit(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted uppercase mb-2">Order Lab Tests</h3>
                  <div className="space-y-2">
                    {tests.map((test, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-default space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted">Test #{idx + 1}</span>
                          {tests.length > 1 && (
                            <button onClick={() => removeTest(idx)} className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <input type="text" value={test.testName} onChange={e => updateTest(idx, 'testName', e.target.value)}
                          placeholder="Test name"
                          className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                        <select value={test.category} onChange={e => updateTest(idx, 'category', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                          {LAB_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <input type="text" value={test.notes} onChange={e => updateTest(idx, 'notes', e.target.value)}
                          placeholder="Notes (optional)"
                          className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                          <input type="checkbox" checked={test.isUrgent} onChange={e => updateTest(idx, 'isUrgent', e.target.checked)}
                            className="rounded border-default"
                          />
                          Urgent
                        </label>
                      </div>
                    ))}
                  </div>
                  <button onClick={addTest} className="mt-2 text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add another test
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Lab Notes (optional)</label>
                  <textarea value={labNotes} onChange={e => setLabNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none" rows={2}
                  />
                </div>

                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Lab Request'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
