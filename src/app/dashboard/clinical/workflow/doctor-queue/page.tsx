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
  Stethoscope, Loader2, Clock, ChevronRight, User, Phone,
  AlertTriangle, Heart, Thermometer, Weight, Gauge, Activity,
  ArrowUpRight, FlaskConical, Pill, CheckCircle, X, FileText,
  Calendar,
} from 'lucide-react';

export default function DoctorQueuePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const { doctorQueue, fetchDoctorQueue, startConsultation } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [patientDetail, setPatientDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { initSocketListener } = useWorkflowStore();
  const canManage = hasPermission(user, PERMISSIONS.MANAGE_DOCTOR_QUEUE as any);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDoctorQueue();
      initSocketListener();
      setLoading(false);
    }
  }, [isAuthenticated, fetchDoctorQueue, initSocketListener]);

  useEffect(() => {
    if (!selectedVisit) { setPatientDetail(null); return; }
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await clinicalService.getPatientDetail(selectedVisit.patient?._id);
        setPatientDetail(res.data?.data || null);
      } catch { setPatientDetail(null); }
      setDetailLoading(false);
    };
    loadDetail();
  }, [selectedVisit]);

  const handleStartConsultation = async (visitId: string) => {
    setActionLoading(true);
    try {
      await startConsultation(visitId);
      toast.success('Consultation started');
    } catch { toast.error('Failed to start consultation'); }
    setActionLoading(false);
  };

  const handleTransition = async (visitId: string, status: string) => {
    setActionLoading(true);
    try {
      await clinicalService.transitionWorkflowVisit(visitId, { status });
      toast.success(`Visit updated to ${status.replace(/_/g, ' ')}`);
      fetchDoctorQueue();
    } catch { toast.error('Transition failed'); }
    setActionLoading(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  const priorityColor = (p?: string) => {
    if (p === 'emergency') return 'text-red-500 bg-red-500/10';
    if (p === 'urgent') return 'text-orange-500 bg-orange-500/10';
    if (p === 'high') return 'text-rose-500 bg-rose-500/10';
    return 'text-muted bg-muted/10';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Queue</h1>
          <p className="text-sm text-muted mt-1">Patients waiting for consultation</p>
        </div>
        <button onClick={() => fetchDoctorQueue()} className="text-sm text-primary hover:underline flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!canManage && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have permission to manage the doctor queue.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient List */}
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[75vh] overflow-y-auto">
            {doctorQueue.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No patients in the doctor queue</p>
              </div>
            ) : doctorQueue.map((v: any) => (
              <button key={v._id} onClick={() => setSelectedVisit(v)}
                className={cn('w-full text-left p-4 hover:bg-hover/50 transition-colors',
                  selectedVisit?._id === v._id && 'bg-primary/5')
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {(v.patient?.name || '?').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{v.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">
                        {v.patient?.phone}
                        {v.patient?.age ? ` · ${v.patient.age}y` : ''}
                        {v.queueNumber ? ` · #${v.queueNumber}` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {v.priority && (
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priorityColor(v.priority))}>
                      {v.priority}
                    </span>
                  )}
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    v.status === 'triaged' ? 'bg-orange-500/10 text-orange-600' :
                    v.status === 'in_consultation' ? 'bg-green-500/10 text-green-600' :
                    'bg-blue-500/10 text-blue-600'
                  )}>
                    {v.status?.replace(/_/g, ' ')}
                  </span>
                  {v.chiefComplaint && (
                    <span className="text-xs text-muted line-clamp-1">{v.chiefComplaint}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {!selectedVisit ? (
              <div className="py-12 text-center">
                <Stethoscope className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a patient to view details</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {selectedVisit.patient?.name}
                  </h2>
                  <button onClick={() => setSelectedVisit(null)} className="text-muted hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted"><Phone className="w-3 h-3" /> {selectedVisit.patient?.phone || '—'}</div>
                  <div className="flex items-center gap-1.5 text-muted"><User className="w-3 h-3" /> {selectedVisit.patient?.gender || '—'}</div>
                  <div className="flex items-center gap-1.5 text-muted"><Calendar className="w-3 h-3" /> {selectedVisit.patient?.age ? `${selectedVisit.patient.age}y` : '—'}</div>
                  <div className="flex items-center gap-1.5 text-muted"><FileText className="w-3 h-3" /> #{selectedVisit.queueNumber || '—'}</div>
                </div>

                {/* Vitals */}
                {selectedVisit.vitals && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase mb-2">Vitals</h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {selectedVisit.vitals.weight && <VitalBadge icon={Weight} label="Weight" value={`${selectedVisit.vitals.weight} kg`} />}
                      {selectedVisit.vitals.temperature && <VitalBadge icon={Thermometer} label="Temp" value={`${selectedVisit.vitals.temperature}°C`} />}
                      {selectedVisit.vitals.bloodPressureSystolic && (
                        <VitalBadge icon={Gauge} label="BP" value={`${selectedVisit.vitals.bloodPressureSystolic}/${selectedVisit.vitals.bloodPressureDiastolic || '?'}`} />
                      )}
                      {selectedVisit.vitals.pulse && <VitalBadge icon={Heart} label="Pulse" value={`${selectedVisit.vitals.pulse} bpm`} />}
                      {selectedVisit.vitals.respiration && <VitalBadge icon={Activity} label="Resp" value={`${selectedVisit.vitals.respiration}/min`} />}
                      {selectedVisit.vitals.oxygenSaturation && <VitalBadge icon={ArrowUpRight} label="SpO2" value={`${selectedVisit.vitals.oxygenSaturation}%`} />}
                    </div>
                  </div>
                )}

                {/* Triage Info */}
                {selectedVisit.triage && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase mb-2">Triage</h3>
                    <div className="space-y-1 text-xs">
                      <p><span className="text-muted">Category:</span> <span className="text-foreground font-medium">{selectedVisit.triage.category}</span></p>
                      <p><span className="text-muted">Complaint:</span> <span className="text-foreground">{selectedVisit.triage.chiefComplaint}</span></p>
                      {selectedVisit.triage.painLevel > 0 && (
                        <p><span className="text-muted">Pain:</span> <span className="text-foreground">{selectedVisit.triage.painLevel}/10</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Chief Complaint from visit */}
                {selectedVisit.chiefComplaint && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase mb-2">Chief Complaint</h3>
                    <p className="text-sm text-foreground">{selectedVisit.chiefComplaint}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2 border-t border-default">
                  {selectedVisit.status === 'triaged' && (
                    <button onClick={() => handleStartConsultation(selectedVisit._id)} disabled={actionLoading}
                      className="w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Start Consultation'}
                    </button>
                  )}

                  {selectedVisit.status === 'in_consultation' && (
                    <>
                      <button onClick={() => handleTransition(selectedVisit._id, 'lab_ordered')} disabled={actionLoading}
                        className="w-full px-4 py-2 rounded-lg border border-purple-500/30 text-purple-600 text-sm font-semibold hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                      >
                        <FlaskConical className="w-4 h-4" /> Order Lab Tests
                      </button>
                      <button onClick={() => handleTransition(selectedVisit._id, 'in_pharmacy')} disabled={actionLoading}
                        className="w-full px-4 py-2 rounded-lg border border-blue-500/30 text-blue-600 text-sm font-semibold hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Pill className="w-4 h-4" /> Send to Pharmacy
                      </button>
                    </>
                  )}

                  {(selectedVisit.status === 'lab_ordered' || selectedVisit.status === 'dispensed') && (
                    <button onClick={() => handleStartConsultation(selectedVisit._id)} disabled={actionLoading}
                      className="w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >
                      Resume Consultation
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VitalBadge({ icon: Icon, label, value }: { icon: React.FC<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-hover/50">
      <Icon className="w-3 h-3 text-primary shrink-0" />
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[11px] font-semibold text-foreground ml-auto">{value}</span>
    </div>
  );
}
