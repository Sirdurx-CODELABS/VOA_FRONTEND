'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import {
  consultationService,
  prescriptionService,
  labService,
  referralService,
  patientService,
} from '@/services/doctorApi.service';
import { Consultation, PatientProfile, AiRecommendation, AiMedicationSuggestion } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Play, Square, FileText,
  ChevronDown, ChevronRight, User, Activity, Stethoscope, Bot,
  AlertTriangle, Plus, Edit3, Trash2, Pill, FlaskConical, Send,
  HeartPulse, ClipboardList, ShieldAlert, Brain,
} from 'lucide-react';
import HIVCarePanel from '@/components/hiv/HIVCarePanel';

interface ApiRes { data: { data: Consultation } }

function RiskBadge({ score }: { score?: string }) {
  const map: Record<string, { color: string; label: string }> = {
    low: { color: 'bg-green-500/10 text-green-600', label: 'Low' },
    moderate: { color: 'bg-yellow-500/10 text-yellow-600', label: 'Moderate' },
    high: { color: 'bg-orange-500/10 text-orange-600', label: 'High' },
    critical: { color: 'bg-red-500/10 text-red-600', label: 'Critical' },
  };
  const m = map[score?.toLowerCase() || ''];
  if (!m) return null;
  return <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', m.color)}>{m.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-600', label: 'Pending' },
    doctor_accepted: { color: 'bg-blue-500/10 text-blue-600', label: 'Accepted' },
    patient_confirmed: { color: 'bg-purple-500/10 text-purple-600', label: 'Confirmed' },
    in_progress: { color: 'bg-green-500/10 text-green-600', label: 'In Progress' },
    completed: { color: 'bg-gray-500/10 text-gray-600', label: 'Completed' },
    cancelled: { color: 'bg-red-500/10 text-red-600', label: 'Cancelled' },
  };
  const m = map[status] || map.pending;
  return <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', m.color)}>{m.label}</span>;
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-default rounded-xl bg-card-bg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-main-bg/50 transition-colors">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted" />}
          {title}
        </span>
        {open ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 text-sm">{children}</div>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wider">{label}</p>
      <p className="font-medium text-foreground">{value ?? 'N/A'}</p>
    </div>
  );
}

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [previousVisits, setPreviousVisits] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiRecommendation | null>(null);
  const [aiRequested, setAiRequested] = useState(false);

  // Center panel - clinical data
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [examination, setExamination] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');

  // Prescription items built from AI
  const [prescriptionItems, setPrescriptionItems] = useState<{ name: string; dosage: string; duration: string; instructions: string }[]>([]);
  const [labRequestItems, setLabRequestItems] = useState<{ testName: string; notes: string; isUrgent: boolean }[]>([]);

  // Panel collapse
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // AI suggestion tracking
  const [acceptedMeds, setAcceptedMeds] = useState<Set<number>>(new Set());
  const [rejectedMeds, setRejectedMeds] = useState<Set<number>>(new Set());
  const [acceptedTests, setAcceptedTests] = useState<Set<number>>(new Set());
  const [rejectedTests, setRejectedTests] = useState<Set<number>>(new Set());
  const [referralAction, setReferralAction] = useState<'none' | 'accepted' | 'rejected'>('none');
  const [followUpAction, setFollowUpAction] = useState<'none' | 'accepted' | 'rejected'>('none');
  const [educationAction, setEducationAction] = useState<'none' | 'accepted' | 'rejected'>('none');
  const [lifestyleAction, setLifestyleAction] = useState<'none' | 'accepted' | 'rejected'>('none');

  // Modify modal
  const [modifyingMed, setModifyingMed] = useState<{ index: number; name: string; dosage: string; duration: string; instructions: string } | null>(null);
  const [modifyingTest, setModifyingTest] = useState<{ index: number; testName: string; notes: string; isUrgent: boolean } | null>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !params.id) return;
    const fetchData = async () => {
      try {
        const res = await consultationService.getById(params.id as string);
        const c = res.data.data;
        setConsultation(c);
        setNotes(c.notes || '');
        if (c.patient?._id) {
          try {
            const pRes = await patientService.getById(c.patient._id);
            setPatientProfile(pRes.data.data);
            const vRes = await consultationService.getByPatient(c.patient._id);
            setPreviousVisits((vRes.data.data || []).filter(v => v._id !== c._id).slice(0, 10));
          } catch { /* non-critical */ }
        }
      } catch { toast.error('Failed to load consultation'); }
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated, params.id]);

  const handleAction = useCallback(async (action: string, apiCall: () => Promise<ApiRes>, successMsg: string) => {
    setActionLoading(action);
    try {
      const res = await apiCall();
      setConsultation(res.data.data);
      toast.success(successMsg);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed';
      toast.error(msg);
    }
    setActionLoading(null);
  }, []);

  const handleEnd = useCallback(async () => {
    setActionLoading('end');
    try {
      const prescriptionText = prescriptionItems.length
        ? prescriptionItems.map(i => `${i.name} — ${i.dosage}, ${i.duration}${i.instructions ? ` (${i.instructions})` : ''}`).join('\n')
        : '';
      const labText = labRequestItems.length
        ? labRequestItems.map(i => `${i.testName}${i.isUrgent ? ' [URGENT]' : ''}${i.notes ? ` — ${i.notes}` : ''}`).join('\n')
        : '';
      const fullNotes = [notes, diagnosis ? `Diagnosis: ${diagnosis}` : '', examination ? `Examination: ${examination}` : '', treatmentPlan ? `Plan: ${treatmentPlan}` : ''].filter(Boolean).join('\n\n');
      const res = await consultationService.end(consultation!._id, { notes: fullNotes, prescription: prescriptionText, labRequests: labText });
      setConsultation(res.data.data);
      toast.success('Consultation completed');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to complete';
      toast.error(msg);
    }
    setActionLoading(null);
  }, [consultation, notes, diagnosis, examination, treatmentPlan, prescriptionItems, labRequestItems]);

  const handleAiAnalysis = useCallback(async () => {
    if (!consultation) return;
    setAiLoading(true);
    try {
      const res = await consultationService.requestAiAnalysis({
        consultationId: consultation._id,
        symptoms: consultation.aiSummary?.symptoms || notes || '',
        notes: notes || undefined,
      });
      setAiResult(res.data.data);
      setAiRequested(true);
      toast.success('AI analysis complete');
    } catch {
      toast.error('AI analysis failed');
    }
    setAiLoading(false);
  }, [consultation, notes]);

  const acceptMedication = useCallback((index: number) => {
    if (!aiResult?.recommendedMedications) return;
    const med = aiResult.recommendedMedications[index];
    if (!med) return;
    setAcceptedMeds(prev => new Set([...prev, index]));
    setPrescriptionItems(prev => [...prev, { name: med.name, dosage: med.dosage || '', duration: med.duration || '', instructions: med.reason || '' }]);
    toast.success(`${med.name} added to prescription`);
  }, [aiResult]);

  const rejectMedication = useCallback((index: number) => {
    setRejectedMeds(prev => new Set([...prev, index]));
    toast.success('Medication suggestion dismissed');
  }, []);

  const modifyMedication = useCallback((index: number) => {
    if (!aiResult?.recommendedMedications) return;
    const med = aiResult.recommendedMedications[index];
    if (!med) return;
    setModifyingMed({ index, name: med.name, dosage: med.dosage || '', duration: med.duration || '', instructions: med.reason || '' });
  }, [aiResult]);

  const saveModifiedMedication = useCallback(() => {
    if (!modifyingMed) return;
    const { index, name, dosage, duration, instructions } = modifyingMed;
    setAcceptedMeds(prev => new Set([...prev, index]));
    setPrescriptionItems(prev => {
      const next = prev.filter(i => i.name !== name);
      return [...next, { name, dosage, duration, instructions }];
    });
    setModifyingMed(null);
    toast.success(`${name} added to prescription`);
  }, [modifyingMed]);

  const acceptTest = useCallback((index: number) => {
    if (!aiResult?.recommendedTests) return;
    const test = aiResult.recommendedTests[index];
    if (!test) return;
    setAcceptedTests(prev => new Set([...prev, index]));
    setLabRequestItems(prev => [...prev, { testName: test, notes: '', isUrgent: false }]);
    toast.success(`${test} added to lab requests`);
  }, [aiResult]);

  const rejectTest = useCallback((index: number) => {
    setRejectedTests(prev => new Set([...prev, index]));
  }, []);

  const modifyTest = useCallback((index: number) => {
    const test = aiResult?.recommendedTests?.[index];
    if (!test) return;
    setModifyingTest({ index, testName: test, notes: '', isUrgent: false });
  }, [aiResult]);

  const saveModifiedTest = useCallback(() => {
    if (!modifyingTest) return;
    const { index, testName, notes: tNotes, isUrgent } = modifyingTest;
    setAcceptedTests(prev => new Set([...prev, index]));
    setLabRequestItems(prev => {
      const next = prev.filter(i => i.testName !== testName);
      return [...next, { testName, notes: tNotes, isUrgent }];
    });
    setModifyingTest(null);
    toast.success(`${testName} added to lab requests`);
  }, [modifyingTest]);

  const acceptReferral = useCallback(async () => {
    if (!consultation || !aiResult?.referralRecommendation) return;
    setReferralAction('accepted');
    try {
      await referralService.create({
        patient: consultation.patient,
        reason: aiResult.referralRecommendation,
        priority: aiResult.riskLevel === 'emergency' ? 'emergency' : aiResult.riskLevel === 'high' ? 'urgent' : 'routine',
        consultationSummary: notes,
        aiSummary: aiResult.referralRecommendation,
      });
      toast.success('Referral created');
    } catch {
      toast.error('Failed to create referral');
      setReferralAction('none');
    }
  }, [consultation, aiResult, notes]);

  const rejectReferral = useCallback(() => {
    setReferralAction('rejected');
    toast.success('Referral suggestion dismissed');
  }, []);

  const acceptFollowUp = useCallback(() => {
    setFollowUpAction('accepted');
    if (aiResult?.recommendedFollowUp) {
      setNotes(prev => prev + `\n\nFollow-up: ${aiResult.recommendedFollowUp}`);
    }
    toast.success('Follow-up added to notes');
  }, [aiResult]);

  const acceptEducation = useCallback(() => {
    setEducationAction('accepted');
    if (aiResult?.patientEducation) {
      setNotes(prev => prev + `\n\nPatient Education: ${aiResult.patientEducation}`);
    }
    toast.success('Patient education added to notes');
  }, [aiResult]);

  const acceptLifestyle = useCallback(() => {
    setLifestyleAction('accepted');
    if (aiResult?.lifestyleAdvice) {
      setNotes(prev => prev + `\n\nLifestyle Advice: ${aiResult.lifestyleAdvice}`);
    }
    toast.success('Lifestyle advice added to notes');
  }, [aiResult]);

  const removePrescriptionItem = useCallback((index: number) => {
    setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeLabItem = useCallback((index: number) => {
    setLabRequestItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  if (!_hydrated || !isAuthenticated) return null;

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>;
  }

  if (!consultation) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">Consultation not found</p>
        <button onClick={() => router.back()} className="text-primary text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  const patient = consultation.patient;
  const isPending = consultation.status === 'pending';
  const isAccepted = consultation.status === 'doctor_accepted';
  const isConfirmed = consultation.status === 'patient_confirmed';
  const isInProgress = consultation.status === 'in_progress';
  const isCompleted = consultation.status === 'completed';
  const isCancelled = consultation.status === 'cancelled';
  const canStart = isAccepted || isConfirmed;
  const canEnd = isInProgress;
  const isEditable = canStart || canEnd || isInProgress;
  const isReadOnly = isCompleted;

  const PanelHeader = ({ icon: Icon, title, collapsed, onToggle }: { icon: React.ComponentType<{ className?: string }>; title: string; collapsed: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="flex items-center justify-between w-full px-4 py-3 bg-card-bg border-b border-default">
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="w-4 h-4 text-muted" />
        {title}
      </span>
      {collapsed ? <ChevronRight className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-card-bg text-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{patient?.name || 'Unknown Patient'}</h1>
            <p className="text-xs text-muted">
              {consultation.type === 'online' ? 'Online' : 'In-person'} consultation
              {patient?.phone && ` · ${patient.phone}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={consultation.status} />
          {consultation.type === 'online' ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium">Online</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600 font-medium">In-person</span>}
        </div>
      </div>

      {/* Action buttons */}
      {!isCompleted && !isCancelled && (
        <div className="flex items-center gap-2 flex-wrap">
          {isPending && (
            <>
              <button onClick={() => handleAction('accept', () => consultationService.accept(consultation._id), 'Consultation accepted')} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm font-medium transition-colors disabled:opacity-50">
                {actionLoading === 'accept' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Accept
              </button>
              <button onClick={() => handleAction('reject', () => consultationService.reject(consultation._id), 'Consultation rejected')} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm font-medium transition-colors disabled:opacity-50">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {canStart && (
            <button onClick={() => handleAction('start', () => consultationService.start(consultation._id), 'Consultation started')} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-sm font-medium transition-colors disabled:opacity-50">
              {actionLoading === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Start Consultation
            </button>
          )}
          {canEnd && (
            <button onClick={handleEnd} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm font-medium transition-colors disabled:opacity-50">
              {actionLoading === 'end' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} End & Complete
            </button>
          )}
        </div>
      )}

      {/* 3-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── LEFT PANEL ── */}
        <div className={cn('lg:col-span-3 space-y-3', leftCollapsed && 'lg:col-span-1')}>
          <div className="border border-default rounded-xl bg-card-bg overflow-hidden">
            <PanelHeader icon={User} title="Patient Info" collapsed={leftCollapsed} onToggle={() => setLeftCollapsed(!leftCollapsed)} />
            {!leftCollapsed && (
              <div className="p-4 space-y-4">
                {/* Patient info */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Name" value={patient?.name} />
                  <InfoRow label="Phone" value={patient?.phone} />
                  <InfoRow label="Age" value={patient?.age} />
                  <InfoRow label="Gender" value={patient?.gender} />
                </div>

                {/* Medical History */}
                <CollapsibleSection title="Medical History" icon={ClipboardList} defaultOpen={false}>
                  {patientProfile?.diagnosis ? (
                    <div className="space-y-1">
                      {patientProfile.diagnosis.hiv && <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 font-medium mr-1">HIV</span>}
                      {patientProfile.diagnosis.tb && <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 font-medium mr-1">TB</span>}
                      {patientProfile.diagnosis.hypertension && <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 font-medium mr-1">Hypertension</span>}
                      {patientProfile.diagnosis.diabetes && <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium mr-1">Diabetes</span>}
                      {patientProfile.diagnosis.other && <p className="text-xs text-foreground mt-1">{patientProfile.diagnosis.other}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">No recorded diagnoses</p>
                  )}
                </CollapsibleSection>

                {/* Previous Visits */}
                <CollapsibleSection title="Previous Visits" icon={Activity} defaultOpen={false}>
                  {previousVisits.length === 0 ? (
                    <p className="text-xs text-muted">No previous visits</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {previousVisits.map(v => (
                        <div key={v._id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-main-bg/50">
                          <div>
                            <p className="text-xs font-medium text-foreground">{new Date(v.createdAt).toLocaleDateString()}</p>
                            <p className="text-[10px] text-muted">{v.type === 'online' ? 'Online' : 'In-person'}</p>
                          </div>
                          <StatusBadge status={v.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* Current Medication */}
                <CollapsibleSection title="Current Medication" icon={Pill} defaultOpen={false}>
                  {patientProfile?.currentMedication ? (
                    <p className="text-xs text-foreground whitespace-pre-wrap">{patientProfile.currentMedication}</p>
                  ) : (
                    <p className="text-xs text-muted">None recorded</p>
                  )}
                </CollapsibleSection>

                {/* Allergies */}
                <CollapsibleSection title="Allergies" icon={AlertTriangle} defaultOpen={false}>
                  {patientProfile?.allergies ? (
                    <p className="text-xs text-foreground">{patientProfile.allergies}</p>
                  ) : (
                    <p className="text-xs text-muted">None recorded</p>
                  )}
                </CollapsibleSection>

                {/* Risk Score */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-main-bg/50">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-muted" />
                    Risk Score
                  </span>
                  <RiskBadge score={patientProfile?.riskScore || consultation.aiSummary?.riskAssessment?.split(' ')[0]} />
                </div>

                {/* AI Summary */}
                {consultation.aiSummary?.symptoms && (
                  <CollapsibleSection title="AI Summary" icon={Brain} defaultOpen={false}>
                    <div className="space-y-2 text-xs">
                      {consultation.aiSummary.symptoms && (
                        <div><p className="text-[10px] text-muted uppercase">Symptoms</p><p className="text-foreground">{consultation.aiSummary.symptoms}</p></div>
                      )}
                      {consultation.aiSummary.timeline && (
                        <div><p className="text-[10px] text-muted uppercase">Timeline</p><p className="text-foreground">{consultation.aiSummary.timeline}</p></div>
                      )}
                      {consultation.aiSummary.currentMedication && (
                        <div><p className="text-[10px] text-muted uppercase">Current Meds</p><p className="text-foreground">{consultation.aiSummary.currentMedication}</p></div>
                      )}
                      {consultation.aiSummary.riskAssessment && (
                        <div><p className="text-[10px] text-muted uppercase">Risk</p><p className="text-foreground">{consultation.aiSummary.riskAssessment}</p></div>
                      )}
                      {consultation.aiSummary.recommendations && (
                        <div><p className="text-[10px] text-muted uppercase">Recommendations</p><p className="text-foreground">{consultation.aiSummary.recommendations}</p></div>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Consent Status */}
                <div className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-main-bg/50">
                  <span className="text-[10px] text-muted uppercase tracking-wider">Consent</span>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs', consultation.consentDataShare ? 'text-green-600' : 'text-muted')}>
                      {consultation.consentDataShare ? '✓ Data Sharing' : '○ Data Sharing'}
                    </span>
                    <span className={cn('text-xs', consultation.consentSummaryShare ? 'text-green-600' : 'text-muted')}>
                      {consultation.consentSummaryShare ? '✓ Summary' : '○ Summary'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CENTER PANEL ── */}
        <div className="lg:col-span-5 space-y-3">
          <div className="border border-default rounded-xl bg-card-bg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-default">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Stethoscope className="w-4 h-4 text-muted" />
                Consultation Workspace
              </span>
            </div>
            <div className="p-4 space-y-4">
              {/* Read-only completed view */}
              {isReadOnly && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-default bg-main-bg/50 p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Completed Records</h3>
                    {consultation.notes && (
                      <div>
                        <p className="text-[10px] text-muted">Notes</p>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{consultation.notes}</p>
                      </div>
                    )}
                    {consultation.prescription && (
                      <div>
                        <p className="text-[10px] text-muted">Prescription</p>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{consultation.prescription}</p>
                      </div>
                    )}
                    {consultation.labRequests && (
                      <div>
                        <p className="text-[10px] text-muted">Lab Requests</p>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{consultation.labRequests}</p>
                      </div>
                    )}
                  </div>
                  {/* Patient info read-only */}
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Patient" value={patient?.name} />
                    <InfoRow label="Phone" value={patient?.phone} />
                    <InfoRow label="Age" value={patient?.age} />
                    <InfoRow label="Gender" value={patient?.gender} />
                  </div>
                </div>
              )}

              {/* Editable workspace */}
              {isEditable && (
                <>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Clinical Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-y" placeholder="Symptoms, observations, clinical findings..." />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Diagnosis</label>
                    <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Primary diagnosis..." />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Examination Findings</label>
                    <textarea value={examination} onChange={e => setExamination(e.target.value)} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px] resize-y" placeholder="Physical exam findings, vitals, observations..." />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">Treatment Plan</label>
                    <textarea value={treatmentPlan} onChange={e => setTreatmentPlan(e.target.value)} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px] resize-y" placeholder="Procedures, interventions, follow-up schedule..." />
                  </div>

                  {/* Prescription items */}
                  {prescriptionItems.length > 0 && (
                    <div>
                      <label className="text-[10px] text-muted uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                        <Pill className="w-3 h-3" /> Prescription Items ({prescriptionItems.length})
                      </label>
                      <div className="space-y-1.5">
                        {prescriptionItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-main-bg/50 border border-default">
                            <div className="text-xs">
                              <p className="font-medium text-foreground">{item.name}</p>
                              <p className="text-muted">{item.dosage} · {item.duration}</p>
                            </div>
                            <button onClick={() => removePrescriptionItem(i)} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab request items */}
                  {labRequestItems.length > 0 && (
                    <div>
                      <label className="text-[10px] text-muted uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                        <FlaskConical className="w-3 h-3" /> Lab Requests ({labRequestItems.length})
                      </label>
                      <div className="space-y-1.5">
                        {labRequestItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-main-bg/50 border border-default">
                            <div className="text-xs">
                              <p className="font-medium text-foreground">{item.testName}</p>
                              {item.notes && <p className="text-muted">{item.notes}</p>}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.isUrgent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 font-medium">URGENT</span>}
                              <button onClick={() => removeLabItem(i)} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-600 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {canEnd && (
                    <button onClick={handleEnd} disabled={actionLoading !== null} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm font-medium transition-colors disabled:opacity-50 w-full justify-center">
                      {actionLoading === 'end' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      Save & Complete Consultation
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className={cn('lg:col-span-4 space-y-3', rightCollapsed && 'lg:col-span-1')}>
          <div className="border border-default rounded-xl bg-card-bg overflow-hidden">
            <PanelHeader icon={Bot} title="AI Clinical Assistant" collapsed={rightCollapsed} onToggle={() => setRightCollapsed(!rightCollapsed)} />
            {!rightCollapsed && (
              <div className="p-4 space-y-4">
                {!aiRequested && !aiResult && (
                  <div className="text-center py-6">
                    <Bot className="w-10 h-10 text-muted mx-auto mb-3" />
                    <p className="text-xs text-muted mb-3">Request AI analysis of current notes for clinical decision support</p>
                    <button onClick={handleAiAnalysis} disabled={aiLoading} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors disabled:opacity-50 mx-auto">
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                      {aiLoading ? 'Analyzing...' : 'Request AI Analysis'}
                    </button>
                  </div>
                )}

                {aiLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}

                {aiResult && !aiLoading && (
                  <div className="space-y-4">
                    {/* Possible Conditions */}
                    {aiResult.possibleConditions && aiResult.possibleConditions.length > 0 && (
                      <CollapsibleSection title="Possible Conditions" icon={ClipboardList}>
                        <div className="space-y-2">
                          {aiResult.possibleConditions.map((cond, i) => (
                            <div key={i} className="px-3 py-2 rounded-lg bg-main-bg/50 border border-default">
                              <p className="text-xs font-medium text-foreground">{cond}</p>
                            </div>
                          ))}
                          {aiResult.confidence && (
                            <div className="mt-1">
                              <div className="flex items-center justify-between text-[10px] text-muted mb-1">
                                <span>Confidence</span>
                                <span>{Math.round(aiResult.confidence * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-main-bg overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${aiResult.confidence * 100}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleSection>
                    )}

                    {/* Risk Level */}
                    {aiResult.riskLevel && (
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-default bg-main-bg/50">
                        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-muted" />
                          Risk Level
                        </span>
                        <RiskBadge score={aiResult.riskLevel} />
                      </div>
                    )}

                    {/* Recommended Tests */}
                    {aiResult.recommendedTests && aiResult.recommendedTests.length > 0 && (
                      <CollapsibleSection title="Recommended Tests" icon={FlaskConical}>
                        <div className="space-y-2">
                          {aiResult.recommendedTests.map((test, i) => {
                            if (rejectedTests.has(i)) return null;
                            const isAdded = acceptedTests.has(i);
                            return (
                              <div key={i} className={cn('px-3 py-2 rounded-lg border', isAdded ? 'bg-green-500/5 border-green-500/20' : 'bg-main-bg/50 border-default')}>
                                <p className="text-xs font-medium text-foreground">{test}</p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  {!isAdded ? (
                                    <>
                                      <button onClick={() => acceptTest(i)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors">
                                        <Plus className="w-3 h-3" /> Accept
                                      </button>
                                      <button onClick={() => modifyTest(i)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 font-medium transition-colors">
                                        <Edit3 className="w-3 h-3" /> Modify
                                      </button>
                                      <button onClick={() => rejectTest(i)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors">
                                        <XCircle className="w-3 h-3" /> Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Added to lab</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleSection>
                    )}

                    {/* Recommended Medication */}
                    {aiResult.recommendedMedications && aiResult.recommendedMedications.length > 0 && (
                      <CollapsibleSection title="Recommended Medication" icon={Pill}>
                        <div className="space-y-2">
                          {aiResult.recommendedMedications.map((med, i) => {
                            if (rejectedMeds.has(i)) return null;
                            const isAdded = acceptedMeds.has(i);
                            return (
                              <div key={i} className={cn('px-3 py-2 rounded-lg border', isAdded ? 'bg-green-500/5 border-green-500/20' : 'bg-main-bg/50 border-default')}>
                                <p className="text-xs font-medium text-foreground">{med.name}</p>
                                {med.dosage && <p className="text-[10px] text-muted">Dosage: {med.dosage}</p>}
                                {med.frequency && <p className="text-[10px] text-muted">Frequency: {med.frequency}</p>}
                                {med.duration && <p className="text-[10px] text-muted">Duration: {med.duration}</p>}
                                {med.reason && <p className="text-[10px] text-muted mt-0.5">{med.reason}</p>}
                                {med.warnings && <p className="text-[10px] text-red-500/70 mt-0.5">⚠ {med.warnings}</p>}
                                {med.alternative && <p className="text-[10px] text-muted">Alt: {med.alternative}</p>}
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  {!isAdded ? (
                                    <>
                                      <button onClick={() => acceptMedication(i)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors">
                                        <Plus className="w-3 h-3" /> Accept
                                      </button>
                                      <button onClick={() => modifyMedication(i)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 font-medium transition-colors">
                                        <Edit3 className="w-3 h-3" /> Modify
                                      </button>
                                      <button onClick={() => rejectMedication(i)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors">
                                        <XCircle className="w-3 h-3" /> Reject
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Added to prescription</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleSection>
                    )}

                    {/* Recommended Follow-up */}
                    {aiResult.recommendedFollowUp && (
                      <div className={cn('px-4 py-3 rounded-lg border', followUpAction === 'accepted' ? 'bg-green-500/5 border-green-500/20' : 'bg-main-bg/50 border-default')}>
                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Recommended Follow-up</p>
                        <p className="text-xs text-foreground">{aiResult.recommendedFollowUp}</p>
                        {followUpAction === 'none' && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button onClick={acceptFollowUp} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors">
                              <Plus className="w-3 h-3" /> Accept
                            </button>
                            <button onClick={() => setFollowUpAction('rejected')} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors">
                              <XCircle className="w-3 h-3" /> Dismiss
                            </button>
                          </div>
                        )}
                        {followUpAction === 'accepted' && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Added to notes</span>}
                      </div>
                    )}

                    {/* Referral Recommendation */}
                    {aiResult.referralRecommendation && (
                      <div className={cn('px-4 py-3 rounded-lg border', referralAction === 'accepted' ? 'bg-green-500/5 border-green-500/20' : 'bg-main-bg/50 border-default')}>
                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Referral Recommendation</p>
                        <p className="text-xs text-foreground">{aiResult.referralRecommendation}</p>
                        {referralAction === 'none' && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button onClick={acceptReferral} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors">
                              <Send className="w-3 h-3" /> Create Referral
                            </button>
                            <button onClick={rejectReferral} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors">
                              <XCircle className="w-3 h-3" /> Dismiss
                            </button>
                          </div>
                        )}
                        {referralAction === 'accepted' && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Referral created</span>}
                      </div>
                    )}

                    {/* Patient Education */}
                    {aiResult.patientEducation && (
                      <div className={cn('px-4 py-3 rounded-lg border', educationAction === 'accepted' ? 'bg-green-500/5 border-green-500/20' : 'bg-main-bg/50 border-default')}>
                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Patient Education</p>
                        <p className="text-xs text-foreground">{aiResult.patientEducation}</p>
                        {educationAction === 'none' && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button onClick={acceptEducation} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors">
                              <Plus className="w-3 h-3" /> Add to Notes
                            </button>
                            <button onClick={() => setEducationAction('rejected')} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors">
                              <XCircle className="w-3 h-3" /> Dismiss
                            </button>
                          </div>
                        )}
                        {educationAction === 'accepted' && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Added to notes</span>}
                      </div>
                    )}

                    {/* Lifestyle Advice */}
                    {aiResult.lifestyleAdvice && (
                      <div className={cn('px-4 py-3 rounded-lg border', lifestyleAction === 'accepted' ? 'bg-green-500/5 border-green-500/20' : 'bg-main-bg/50 border-default')}>
                        <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Lifestyle Advice</p>
                        <p className="text-xs text-foreground">{aiResult.lifestyleAdvice}</p>
                        {lifestyleAction === 'none' && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button onClick={acceptLifestyle} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors">
                              <Plus className="w-3 h-3" /> Add to Notes
                            </button>
                            <button onClick={() => setLifestyleAction('rejected')} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors">
                              <XCircle className="w-3 h-3" /> Dismiss
                            </button>
                          </div>
                        )}
                        {lifestyleAction === 'accepted' && <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Added to notes</span>}
                      </div>
                    )}

                    {/* Evidence */}
                    {aiResult.evidence && (
                      <CollapsibleSection title="Evidence & Reasoning" icon={HeartPulse} defaultOpen={false}>
                        <p className="text-xs text-foreground whitespace-pre-wrap">{aiResult.evidence}</p>
                        {aiResult.guidelineSource && <p className="text-[10px] text-muted mt-1">Source: {aiResult.guidelineSource}</p>}
                      </CollapsibleSection>
                    )}

                    {/* Re-analyze */}
                    <button onClick={handleAiAnalysis} disabled={aiLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-main-bg/50 hover:bg-main-bg text-xs font-medium text-muted hover:text-foreground transition-colors w-full justify-center disabled:opacity-50 border border-default">
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                      Re-analyze with current notes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HIV Clinical Care Panel */}
          <HIVCarePanel patient={patientProfile} patientId={patient?._id} isOpen={!rightCollapsed} onToggle={() => setRightCollapsed(!rightCollapsed)} />
        </div>
      </div>

      {/* Modify Medication Modal */}
      {modifyingMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModifyingMed(null)}>
          <div className="bg-card-bg rounded-xl border border-default p-5 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Modify Medication</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted uppercase block mb-0.5">Name</label>
                <input value={modifyingMed.name} onChange={e => setModifyingMed({ ...modifyingMed, name: e.target.value })} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase block mb-0.5">Dosage</label>
                <input value={modifyingMed.dosage} onChange={e => setModifyingMed({ ...modifyingMed, dosage: e.target.value })} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. 500mg" />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase block mb-0.5">Duration</label>
                <input value={modifyingMed.duration} onChange={e => setModifyingMed({ ...modifyingMed, duration: e.target.value })} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. 7 days" />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase block mb-0.5">Instructions</label>
                <textarea value={modifyingMed.instructions} onChange={e => setModifyingMed({ ...modifyingMed, instructions: e.target.value })} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[50px] resize-y" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button onClick={saveModifiedMedication} className="flex-1 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors">Save & Add</button>
                <button onClick={() => setModifyingMed(null)} className="flex-1 px-3 py-2 rounded-lg bg-main-bg/50 text-muted hover:text-foreground text-sm font-medium transition-colors border border-default">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modify Test Modal */}
      {modifyingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModifyingTest(null)}>
          <div className="bg-card-bg rounded-xl border border-default p-5 w-full max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Modify Lab Test</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted uppercase block mb-0.5">Test Name</label>
                <input value={modifyingTest.testName} onChange={e => setModifyingTest({ ...modifyingTest, testName: e.target.value })} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase block mb-0.5">Notes</label>
                <textarea value={modifyingTest.notes} onChange={e => setModifyingTest({ ...modifyingTest, notes: e.target.value })} className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[50px] resize-y" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={modifyingTest.isUrgent} onChange={e => setModifyingTest({ ...modifyingTest, isUrgent: e.target.checked })} className="rounded border-default text-primary focus:ring-primary/30" />
                <span className="text-xs text-foreground">Urgent</span>
              </label>
              <div className="flex items-center gap-2 pt-2">
                <button onClick={saveModifiedTest} className="flex-1 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors">Save & Add</button>
                <button onClick={() => setModifyingTest(null)} className="flex-1 px-3 py-2 rounded-lg bg-main-bg/50 text-muted hover:text-foreground text-sm font-medium transition-colors border border-default">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
