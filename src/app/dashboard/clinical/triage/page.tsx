'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ClipboardPlus, Search, Loader2, AlertTriangle, Thermometer,
  Heart, Weight, Droplets, Activity, Gauge, User, ChevronRight,
  ArrowUpRight, Clock, Stethoscope, X, CheckCircle,
} from 'lucide-react';

export default function TriagePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [triageForm, setTriageForm] = useState({ triageCategory: '', triageNotes: '', chiefComplaint: '', painLevel: 0 });
  const [vitalsForm, setVitalsForm] = useState({ weight: '', height: '', temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', pulse: '', respiration: '', oxygenSaturation: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canTriage = hasPermission(user, PERMISSIONS.TRIAGE_PATIENT as any);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await clinicalService.getTriageQueue({ status: 'pending' });
      setPatients(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchQueue();
  }, [isAuthenticated, fetchQueue]);

  const handleTriage = async () => {
    if (!selected || !triageForm.triageCategory || !triageForm.chiefComplaint) {
      return toast.error('Triage category and chief complaint are required');
    }
    setSubmitting(true);
    try {
      await clinicalService.recordTriage(selected._id, triageForm);
      if (vitalsForm.weight || vitalsForm.temperature || vitalsForm.bloodPressureSystolic) {
        await clinicalService.recordVitals(selected._id, vitalsForm);
      }
      toast.success('Triage recorded');
      setSelected(null);
      setTriageForm({ triageCategory: '', triageNotes: '', chiefComplaint: '', painLevel: 0 });
      setVitalsForm({ weight: '', height: '', temperature: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', pulse: '', respiration: '', oxygenSaturation: '' });
      fetchQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record triage');
    }
    setSubmitting(false);
  };

  const handleEscalate = async () => {
    if (!selected) return;
    try {
      await clinicalService.escalateToDoctor({ patientId: selected._id, reason: triageForm.triageNotes || 'Escalated from triage' });
      toast.success('Patient escalated to doctor');
      setSelected(null);
      fetchQueue();
    } catch { toast.error('Failed to escalate'); }
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Triage Queue</h1>
          <p className="text-sm text-muted mt-1">Assess and prioritize incoming patients</p>
        </div>
        <button onClick={fetchQueue} className="text-sm text-primary hover:underline flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!canTriage && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have triage permissions.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient List */}
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[70vh] overflow-y-auto">
            {patients.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No patients in triage queue</p>
              </div>
            ) : patients.map((p: any) => (
              <button key={p._id} onClick={() => setSelected(p)}
                className={cn('w-full text-left p-4 hover:bg-hover transition-colors', selected?._id === p._id && 'bg-primary/5')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {(p.name || 'P').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">{p.phone || 'No phone'}{p.age ? ` · ${p.age}y` : ''}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </div>
                {p.chiefComplaint && <p className="text-xs text-muted mt-1 line-clamp-1">{p.chiefComplaint}</p>}
              </button>
            ))}
          </div>

          {/* Triage Form */}
          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {!selected ? (
              <div className="py-12 text-center">
                <ClipboardPlus className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a patient to begin triage</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {selected.name}
                  </h2>
                  <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>

                {/* Vitals */}
                <div>
                  <h3 className="text-xs font-semibold text-muted uppercase mb-2">Vitals</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <VitalInput icon={Weight} label="Weight (kg)" value={vitalsForm.weight} onChange={v => setVitalsForm(p => ({ ...p, weight: v }))} />
                    <VitalInput icon={Droplets} label="Height (cm)" value={vitalsForm.height} onChange={v => setVitalsForm(p => ({ ...p, height: v }))} />
                    <VitalInput icon={Thermometer} label="Temp (°C)" value={vitalsForm.temperature} onChange={v => setVitalsForm(p => ({ ...p, temperature: v }))} />
                    <VitalInput icon={Gauge} label="BP Systolic" value={vitalsForm.bloodPressureSystolic} onChange={v => setVitalsForm(p => ({ ...p, bloodPressureSystolic: v }))} />
                    <VitalInput icon={Gauge} label="BP Diastolic" value={vitalsForm.bloodPressureDiastolic} onChange={v => setVitalsForm(p => ({ ...p, bloodPressureDiastolic: v }))} />
                    <VitalInput icon={Heart} label="Pulse (bpm)" value={vitalsForm.pulse} onChange={v => setVitalsForm(p => ({ ...p, pulse: v }))} />
                    <VitalInput icon={Activity} label="Resp (/min)" value={vitalsForm.respiration} onChange={v => setVitalsForm(p => ({ ...p, respiration: v }))} />
                    <VitalInput icon={ArrowUpRight} label="SpO2 (%)" value={vitalsForm.oxygenSaturation} onChange={v => setVitalsForm(p => ({ ...p, oxygenSaturation: v }))} />
                  </div>
                </div>

                {/* Triage Assessment */}
                <div>
                  <h3 className="text-xs font-semibold text-muted uppercase mb-2">Assessment</h3>
                  <select value={triageForm.triageCategory} onChange={e => setTriageForm(p => ({ ...p, triageCategory: e.target.value }))}
                    className="w-full mb-2 px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select category...</option>
                    <option value="emergency">Emergency (Red)</option>
                    <option value="urgent">Urgent (Orange)</option>
                    <option value="semi_urgent">Semi-Urgent (Yellow)</option>
                    <option value="non_urgent">Non-Urgent (Green)</option>
                  </select>
                  <input type="text" placeholder="Chief complaint" value={triageForm.chiefComplaint} onChange={e => setTriageForm(p => ({ ...p, chiefComplaint: e.target.value }))}
                    className="w-full mb-2 px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted">Pain:</span>
                    <input type="range" min="0" max="10" value={triageForm.painLevel} onChange={e => setTriageForm(p => ({ ...p, painLevel: +e.target.value }))} className="flex-1" />
                    <span className="text-xs font-bold text-foreground w-5 text-right">{triageForm.painLevel}</span>
                  </div>
                  <textarea placeholder="Triage notes" value={triageForm.triageNotes} onChange={e => setTriageForm(p => ({ ...p, triageNotes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleTriage} disabled={submitting}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Complete Triage'}
                  </button>
                  <button onClick={handleEscalate} className="px-4 py-2 rounded-lg border border-orange-500/30 text-orange-600 text-sm font-semibold hover:bg-orange-500/10 transition-all">
                    Escalate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VitalInput({ icon: Icon, label, value, onChange }: { icon: React.FC<{ className?: string }>; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-hover/50">
      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
      <input type="text" placeholder={label} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none"
      />
    </div>
  );
}
