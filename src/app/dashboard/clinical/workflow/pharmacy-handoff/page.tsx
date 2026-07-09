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
  Pill, Loader2, Clock, ChevronRight, User, Plus, X,
  AlertTriangle, CheckCircle, Trash2, Sun, Moon, Sunrise,
  MoonStar,
} from 'lucide-react';

const TIMING_OPTIONS = [
  { key: 'morning', icon: Sunrise, label: 'Morning' },
  { key: 'afternoon', icon: Sun, label: 'Afternoon' },
  { key: 'evening', icon: Moon, label: 'Evening' },
  { key: 'night', icon: MoonStar, label: 'Night' },
];

interface MedicationEntry {
  name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  duration: string;
  durationUnit: 'days' | 'weeks' | 'months';
  instructions: string;
  notes: string;
}

export default function PharmacyHandoffPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const { activeVisits, fetchActiveVisits } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  const [medications, setMedications] = useState<MedicationEntry[]>([
    { name: '', dosage: '', morning: false, afternoon: false, evening: false, night: false, duration: '7', durationUnit: 'days', instructions: '', notes: '' },
  ]);

  const { initSocketListener } = useWorkflowStore();
  const canPrescribe = hasPermission(user, PERMISSIONS.CREATE_PRESCRIPTION as any);
  const handoffVisits = activeVisits.filter((v: any) =>
    v.status === 'in_consultation' || v.status === 'lab_ordered' || v.status === 'dispensed'
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

  const addMedication = () => setMedications((prev) => [...prev, {
    name: '', dosage: '', morning: false, afternoon: false, evening: false, night: false,
    duration: '7', durationUnit: 'days' as const, instructions: '', notes: '',
  }]);
  const removeMedication = (idx: number) => setMedications((prev) => prev.filter((_, i) => i !== idx));
  const updateMed = (idx: number, field: string, value: any) => {
    setMedications((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };
  const toggleTiming = (idx: number, timing: keyof MedicationEntry) => {
    setMedications((prev) => prev.map((m, i) => i === idx ? { ...m, [timing]: !m[timing] } : m));
  };

  const handleSubmit = async () => {
    if (!selectedVisit) return;
    const validMeds = medications.filter((m) => m.name.trim() && m.dosage.trim());
    if (validMeds.length === 0) return toast.error('Add at least one medication with dosage');

    setSubmitting(true);
    try {
      await clinicalService.createPrescription({
        patientId: selectedVisit.patient?._id,
        visitId: selectedVisit._id,
        medications: validMeds.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          morning: m.morning,
          afternoon: m.afternoon,
          evening: m.evening,
          night: m.night,
          duration: parseInt(m.duration) || 7,
          durationUnit: m.durationUnit,
          instructions: m.instructions || undefined,
          notes: m.notes || undefined,
        })),
        notes: prescriptionNotes || undefined,
      });
      toast.success('Prescription created and sent to pharmacy');
      setSelectedVisit(null);
      setMedications([{ name: '', dosage: '', morning: false, afternoon: false, evening: false, night: false, duration: '7', durationUnit: 'days', instructions: '', notes: '' }]);
      setPrescriptionNotes('');
      fetchActiveVisits();
    } catch { toast.error('Failed to create prescription'); }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pharmacy Prescription Handoff</h1>
          <p className="text-sm text-muted mt-1">Create prescriptions for patients and send to pharmacy</p>
        </div>
        <button onClick={() => fetchActiveVisits()} className="text-sm text-primary hover:underline flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!canPrescribe && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have permission to create prescriptions.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient List */}
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[75vh] overflow-y-auto">
            {handoffVisits.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No patients ready for prescription</p>
              </div>
            ) : handoffVisits.map((v: any) => (
              <button key={v._id} onClick={() => setSelectedVisit(v)}
                className={cn('w-full text-left p-4 hover:bg-hover/50 transition-colors',
                  selectedVisit?._id === v._id && 'bg-blue-500/5'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0">
                      {(v.patient?.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{v.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">{v.patient?.phone}{v.patient?.age ? ` · ${v.patient.age}y` : ''}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </div>
                {v.chiefComplaint && <p className="text-xs text-muted mt-1 line-clamp-1">{v.chiefComplaint}</p>}
              </button>
            ))}
          </div>

          {/* Prescription Form */}
          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {!selectedVisit ? (
              <div className="py-12 text-center">
                <Pill className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a patient to prescribe</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    {selectedVisit.patient?.name}
                  </h2>
                  <button onClick={() => setSelectedVisit(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted uppercase mb-2">Medications</h3>
                  <div className="space-y-3">
                    {medications.map((med, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-default space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted">Medication #{idx + 1}</span>
                          {medications.length > 1 && (
                            <button onClick={() => removeMedication(idx)} className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={med.name} onChange={e => updateMed(idx, 'name', e.target.value)}
                            placeholder="Drug name" className="col-span-2 px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <input type="text" value={med.dosage} onChange={e => updateMed(idx, 'dosage', e.target.value)}
                            placeholder="Dosage (e.g. 500mg)" className="px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <div className="flex gap-1">
                            <input type="text" value={med.duration} onChange={e => updateMed(idx, 'duration', e.target.value)}
                              placeholder="Duration" className="w-16 px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <select value={med.durationUnit} onChange={e => updateMed(idx, 'durationUnit', e.target.value)}
                              className="flex-1 px-2 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="days">days</option>
                              <option value="weeks">weeks</option>
                              <option value="months">months</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted mb-1">Timing</p>
                          <div className="flex gap-1">
                            {TIMING_OPTIONS.map((t) => {
                              const Icon = t.icon;
                              const active = med[t.key as keyof MedicationEntry] as boolean;
                              return (
                                <button key={t.key} onClick={() => toggleTiming(idx, t.key as keyof MedicationEntry)}
                                  className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs border transition-all',
                                    active ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : 'border-default text-muted hover:bg-hover'
                                  )}
                                >
                                  <Icon className="w-3 h-3" /> {t.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <input type="text" value={med.instructions} onChange={e => updateMed(idx, 'instructions', e.target.value)}
                          placeholder="Instructions (e.g. after meals)"
                          className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={addMedication} className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add another medication
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Prescription Notes</label>
                  <textarea value={prescriptionNotes} onChange={e => setPrescriptionNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" rows={2}
                  />
                </div>

                <button onClick={handleSubmit} disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Prescription to Pharmacy'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
