'use client';
import { useState, useEffect, useCallback } from 'react';
import { hivService } from '@/services/doctorApi.service';
import { PatientProfile, HIVRecord, ViralLoadEntry, CD4Entry, OIEntry, AllergyEntry, HIVMedication, HIVLabResult, HIVAiAnalysis, ClinicalAlert } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Loader2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle,
  Bug, Heart, Activity, Stethoscope, Pill, FlaskConical, FileText,
  Brain, User, Calendar, Shield, Plus, Edit3, Trash2, Send,
} from 'lucide-react';

function HIVInfoRow({ label, value, highlight }: { label: string; value?: string | number | null; highlight?: 'green' | 'yellow' | 'orange' | 'red' }) {
  const colors = { green: 'text-green-600', yellow: 'text-yellow-600', orange: 'text-orange-600', red: 'text-red-600' };
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-default/50 last:border-0">
      <span className="text-[11px] text-muted">{label}</span>
      <span className={cn('text-xs font-semibold', highlight ? colors[highlight] : 'text-foreground')}>{value ?? 'N/A'}</span>
    </div>
  );
}

function CollapsibleHIVSection({ title, icon: Icon, defaultOpen = true, badge, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; defaultOpen?: boolean; badge?: string | number; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-default rounded-lg bg-card-bg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-main-bg/50 transition-colors">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-muted" />}
          {title}
          {badge !== undefined && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{badge}</span>}
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-muted" />}
      </button>
      {open && <div className="px-3 pb-3 space-y-1.5 text-xs">{children}</div>}
    </div>
  );
}

function AlertBadge({ alert }: { alert: ClinicalAlert }) {
  const map = {
    green: 'bg-green-500/10 text-green-700 border-green-200',
    yellow: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-500/10 text-orange-700 border-orange-200',
    red: 'bg-red-500/10 text-red-700 border-red-200',
  };
  const icons = {
    green: CheckCircle, yellow: AlertTriangle, orange: AlertTriangle, red: AlertTriangle,
  };
  const Icon = icons[alert.type];
  return (
    <div className={cn('flex items-start gap-2 px-3 py-2 rounded-lg border text-[11px]', map[alert.type])}>
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">{alert.message}</p>
        <p className="opacity-75 mt-0.5">{alert.reason}</p>
      </div>
    </div>
  );
}

// ─── Mini Bar Chart ─────────────────────────────────────────────────
function MiniBarChart({ data, label }: { data: { label: string; value: number }[]; label?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-1">
      {label && <p className="text-[10px] text-muted uppercase">{label}</p>}
      <div className="flex items-end gap-1 h-16">
        {data.slice(-8).map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted">{d.value}</span>
            <div className="w-full rounded-t-sm bg-primary/30" style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }} />
            <span className="text-[7px] text-muted rotate-45 origin-left whitespace-nowrap">{d.label.slice(0, 6)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
interface HIVCarePanelProps {
  patient: PatientProfile | null;
  patientId: string | undefined;
  isOpen: boolean;
  onToggle: () => void;
}

export default function HIVCarePanel({ patient, patientId, isOpen, onToggle }: HIVCarePanelProps) {
  const [hivRecord, setHivRecord] = useState<HIVRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<HIVAiAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'art' | 'viral' | 'cd4' | 'adherence' | 'ois' | 'allergies' | 'medications' | 'labs' | 'ai' | 'alerts'>('overview');

  // Follow-up plan
  const [followUp, setFollowUp] = useState({ nextAppointment: '', labTests: '', refill: '', counselling: '', referral: '', homeVisit: '', communityFollowUp: '' });
  const [showFollowUp, setShowFollowUp] = useState(false);

  // Patient education
  const [patientEducation, setPatientEducation] = useState('');
  const [showEducation, setShowEducation] = useState(false);

  // Audit log
  const [auditLog, setAuditLog] = useState<{ action: string; timestamp: string }[]>([]);

  const isHIVPositive = patient?.diagnosis?.hiv || patient?.artNumber || patient?.fileNumber;

  useEffect(() => {
    if (patientId && isHIVPositive) {
      loadRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, isHIVPositive]);

  const loadRecord = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await hivService.getRecord(patientId);
      setHivRecord(res.data.data);
    } catch { /* silent */ }
    setLoading(false);
  };

  const addAuditEntry = useCallback((action: string) => {
    setAuditLog(prev => [...prev, { action, timestamp: new Date().toISOString() }]);
  }, []);

  // ─── AI Analysis ───────────────────────────────────────────────────
  const handleAiAnalysis = async () => {
    if (!patientId) return;
    setAiLoading(true);
    try {
      const res = await hivService.requestAiAnalysis({ patientId });
      const raw = res.data.data.analysis;
      try {
        const parsed = JSON.parse(raw);
        setAiAnalysis(parsed);
      } catch {
        setAiAnalysis({
          possibleCauses: [],
          suggestedInvestigations: [],
          adherenceRecommendations: raw,
          lifestyleAdvice: '',
          referralRecommendations: '',
          suggestedFollowUpInterval: '',
          medicationSuggestions: [],
          clinicalAlerts: [],
          patientEducation: '',
        });
      }
      addAuditEntry('AI HIV analysis requested');
      toast.success('HIV AI analysis complete');
    } catch {
      toast.error('AI analysis failed');
    }
    setAiLoading(false);
  };

  const acceptAlert = (alert: ClinicalAlert) => {
    addAuditEntry(`Alert acknowledged: ${alert.message}`);
    toast.success('Alert noted');
  };

  const acceptMedSuggestion = (med: HIVAiAnalysis['medicationSuggestions'][0]) => {
    addAuditEntry(`Medication suggestion accepted: ${med.name}`);
    toast.success(`${med.name} noted — pending prescription`);
  };

  const rejectMedSuggestion = (name: string) => {
    addAuditEntry(`Medication suggestion rejected: ${name}`);
    toast.success('Suggestion dismissed');
  };

  // ─── Follow-up ─────────────────────────────────────────────────────
  const saveFollowUp = async () => {
    if (!patientId) return;
    try {
      await hivService.updateRecord(patientId, {
        currentStatus: `Follow-up: ${Object.entries(followUp).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('; ')}`,
      });
      addAuditEntry('Follow-up plan saved');
      toast.success('Follow-up plan saved');
      setShowFollowUp(false);
    } catch { toast.error('Failed to save'); }
  };

  const saveEducation = async () => {
    if (!patientId || !patientEducation.trim()) return;
    try {
      await hivService.updateRecord(patientId, { currentStatus: `Patient education: ${patientEducation}` });
      addAuditEntry('Patient education saved');
      toast.success('Education saved');
      setShowEducation(false);
    } catch { toast.error('Failed to save'); }
  };

  if (!isHIVPositive) return null;

  if (loading) {
    return (
      <div className="border border-default rounded-xl bg-card-bg overflow-hidden">
        <button onClick={onToggle} className="flex items-center justify-between w-full px-4 py-3 bg-card-bg border-b border-default">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bug className="w-4 h-4 text-red-500" />
            HIV Clinical Care
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
        </button>
        {isOpen && <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>}
      </div>
    );
  }

  const tabs: { key: typeof activeTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'art', label: 'ART', icon: Pill },
    { key: 'viral', label: 'VL', icon: Activity },
    { key: 'cd4', label: 'CD4', icon: Heart },
    { key: 'adherence', label: 'Adherence', icon: Shield },
    { key: 'ois', label: 'OIs', icon: Bug },
    { key: 'allergies', label: 'Allergies', icon: AlertTriangle },
    { key: 'medications', label: 'Meds', icon: Pill },
    { key: 'labs', label: 'Labs', icon: FlaskConical },
    { key: 'ai', label: 'AI', icon: Brain },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  const latestVL = hivRecord?.viralLoads?.slice(-1)?.[0];
  const latestCD4 = hivRecord?.cd4History?.slice(-1)?.[0];
  const activeAlerts = aiAnalysis?.clinicalAlerts?.filter(a => a.type === 'red' || a.type === 'orange') || [];
  const currentOIs = hivRecord?.opportunisticInfections?.filter(oi => oi.type === 'current') || [];
  const activeMeds = hivRecord?.currentMedications?.filter(m => m.isActive) || [];
  const criticalAllergies = hivRecord?.allergies?.filter(a => a.severity === 'severe' || a.severity === 'critical') || [];

  return (
    <div className={cn('border border-default rounded-xl bg-card-bg overflow-hidden', activeAlerts.length > 0 && 'border-l-4 border-l-red-500')}>
      {/* Header */}
      <button onClick={onToggle} className="flex items-center justify-between w-full px-4 py-3 hover:bg-main-bg/50 transition-colors border-b border-default">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Bug className="w-4 h-4 text-red-500" />
          HIV Clinical Care
          {hivRecord?.artNumber && <span className="text-[10px] font-mono text-muted">#{hivRecord.artNumber}</span>}
        </span>
        <div className="flex items-center gap-2">
          {latestVL?.status === 'unsuppressed' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Unsuppressed VL" />}
          {currentOIs.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-medium">{currentOIs.length} OI</span>}
          {isOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
        </div>
      </button>

      {isOpen && (
        <div>
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-0.5 px-2 py-2 border-b border-default bg-main-bg/30 scrollbar-thin">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const isAlertTab = tab.key === 'alerts';
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors shrink-0',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground hover:bg-main-bg',
                    isAlertTab && activeAlerts.length > 0 && 'text-red-500'
                  )}>
                  <Icon className="w-3 h-3" />
                  {tab.label}
                  {isAlertTab && activeAlerts.length > 0 && <span className="text-[9px] px-1 py-0.5 rounded-full bg-red-500/10 text-red-600">{activeAlerts.length}</span>}
                </button>
              );
            })}
          </div>

          <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-main-bg/50 border border-default">
                  <HIVInfoRow label="Name" value={patient?.name} />
                  <HIVInfoRow label="Age/Gender" value={patient?.age ? `${patient.age} / ${patient.gender || '-'}` : patient?.gender} />
                  <HIVInfoRow label="ART #" value={hivRecord?.artNumber || patient?.artNumber} />
                  <HIVInfoRow label="File #" value={patient?.fileNumber} />
                  <HIVInfoRow label="Status" value={hivRecord?.currentStatus || 'Active'} />
                  <HIVInfoRow label="Treatment" value={hivRecord?.treatmentStatus || hivRecord?.currentLineOfTreatment ? `${hivRecord.currentLineOfTreatment} line` : 'Not set'} />
                  <HIVInfoRow label="Primary Dx" value={hivRecord?.primaryDiagnosis} />
                  <HIVInfoRow label="Secondary Dx" value={hivRecord?.secondaryDiagnosis} />
                </div>

                {/* Quick alerts */}
                {latestVL?.status === 'unsuppressed' && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Unsuppressed Viral Load ({latestVL.value} copies/mL) — requires enhanced adherence counselling
                  </div>
                )}
                {criticalAllergies.length > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-200 text-xs text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {criticalAllergies.length} critical allergen(s) on record
                  </div>
                )}
                {hivRecord?.adherenceScore !== undefined && hivRecord.adherenceScore < 80 && (
                  <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-200 text-xs text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Low adherence score ({hivRecord.adherenceScore}%) — intervention recommended
                  </div>
                )}

                {/* AI Quick Analysis */}
                <button onClick={handleAiAnalysis} disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors w-full justify-center disabled:opacity-50">
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  {aiLoading ? 'Analyzing...' : 'Run HIV AI Clinical Assessment'}
                </button>
              </div>
            )}

            {/* ═══ ART TAB ═══ */}
            {activeTab === 'art' && (
              <CollapsibleHIVSection title="ART Information" icon={Pill} defaultOpen>
                <HIVInfoRow label="Current Regimen" value={hivRecord?.currentRegimen} />
                <HIVInfoRow label="ART Start Date" value={hivRecord?.artStartDate ? new Date(hivRecord.artStartDate).toLocaleDateString() : undefined} />
                <HIVInfoRow label="Line of Treatment" value={hivRecord?.currentLineOfTreatment ? `${hivRecord.currentLineOfTreatment.charAt(0).toUpperCase() + hivRecord.currentLineOfTreatment.slice(1)} Line` : undefined} />
                <HIVInfoRow label="Drug Resistance" value={hivRecord?.drugResistanceHistory || 'None recorded'} />
                <HIVInfoRow label="Missed Medication" value={hivRecord?.missedMedicationHistory || 'None recorded'} />
                <HIVInfoRow label="Adherence %" value={hivRecord?.medicationAdherence !== undefined ? `${hivRecord.medicationAdherence}%` : undefined}
                  highlight={hivRecord?.medicationAdherence !== undefined ? (hivRecord.medicationAdherence >= 95 ? 'green' : hivRecord.medicationAdherence >= 80 ? 'yellow' : 'red') : undefined} />
              </CollapsibleHIVSection>
            )}

            {/* ═══ VIRAL LOAD TAB ═══ */}
            {activeTab === 'viral' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-main-bg/50 border border-default">
                  <HIVInfoRow label="Latest VL" value={latestVL?.value ? `${latestVL.value.toLocaleString()} c/mL` : undefined}
                    highlight={latestVL?.status === 'suppressed' ? 'green' : latestVL?.status === 'unsuppressed' ? 'red' : undefined} />
                  <HIVInfoRow label="Date" value={latestVL?.collectionDate ? new Date(latestVL.collectionDate).toLocaleDateString() : undefined} />
                  <HIVInfoRow label="Status" value={latestVL?.status ? (latestVL.status.charAt(0).toUpperCase() + latestVL.status.slice(1)) : undefined}
                    highlight={latestVL?.status === 'suppressed' ? 'green' : latestVL?.status === 'unsuppressed' ? 'red' : undefined} />
                </div>

                {(hivRecord?.viralLoads?.length || 0) > 1 && (
                  <MiniBarChart
                    label="Viral Load Trend"
                    data={(hivRecord?.viralLoads || []).map(v => ({ label: new Date(v.collectionDate).toLocaleDateString(), value: v.value }))}
                  />
                )}

                {latestVL?.status === 'unsuppressed' && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-200 text-xs text-red-700">
                    Unsuppressed viral load detected. Enhanced adherence counselling recommended. Consider resistance testing.
                  </div>
                )}
              </div>
            )}

            {/* ═══ CD4 TAB ═══ */}
            {activeTab === 'cd4' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-main-bg/50 border border-default">
                  <HIVInfoRow label="Latest CD4" value={latestCD4?.value !== undefined ? latestCD4.value.toString() : undefined} />
                  <HIVInfoRow label="Date" value={latestCD4?.date ? new Date(latestCD4.date).toLocaleDateString() : undefined} />
                  <HIVInfoRow label="Lowest CD4" value={hivRecord?.lowestCD4?.toString()} highlight={hivRecord?.lowestCD4 !== undefined && hivRecord.lowestCD4 < 200 ? 'red' : undefined} />
                  <HIVInfoRow label="Highest CD4" value={hivRecord?.highestCD4?.toString()} />
                </div>

                {(hivRecord?.cd4History?.length || 0) > 1 && (
                  <MiniBarChart
                    label="CD4 Trend"
                    data={(hivRecord?.cd4History || []).map(c => ({ label: new Date(c.date).toLocaleDateString(), value: c.value }))}
                  />
                )}
              </div>
            )}

            {/* ═══ ADHERENCE TAB ═══ */}
            {activeTab === 'adherence' && (
              <CollapsibleHIVSection title="Adherence" icon={Shield} defaultOpen>
                <HIVInfoRow label="Medication Adherence" value={hivRecord?.medicationAdherence !== undefined ? `${hivRecord.medicationAdherence}%` : undefined}
                  highlight={hivRecord?.medicationAdherence !== undefined ? (hivRecord.medicationAdherence >= 95 ? 'green' : hivRecord.medicationAdherence >= 80 ? 'yellow' : 'red') : undefined} />
                <HIVInfoRow label="Appointment Adherence" value={hivRecord?.appointmentAdherence !== undefined ? `${hivRecord.appointmentAdherence}%` : undefined} />
                <HIVInfoRow label="Missed Refills" value={hivRecord?.missedRefills} />
                <HIVInfoRow label="Missed Appointments" value={hivRecord?.missedAppointments} />
                <HIVInfoRow label="Late Pickups" value={hivRecord?.latePickups} />
                <HIVInfoRow label="Adherence Score" value={hivRecord?.adherenceScore !== undefined ? `${hivRecord.adherenceScore}/100` : undefined}
                  highlight={hivRecord?.adherenceScore !== undefined ? (hivRecord.adherenceScore >= 90 ? 'green' : hivRecord.adherenceScore >= 70 ? 'yellow' : 'red') : undefined} />
              </CollapsibleHIVSection>
            )}

            {/* ═══ OIs TAB ═══ */}
            {activeTab === 'ois' && (
              <CollapsibleHIVSection title="Opportunistic Infections" icon={Bug} defaultOpen>
                {currentOIs.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted uppercase mb-1">Current</p>
                    {currentOIs.map((oi, i) => (
                      <div key={i} className="px-2 py-1.5 rounded bg-orange-500/10 text-orange-700 mb-1 text-[11px]">{oi.name}{oi.notes ? ` — ${oi.notes}` : ''}</div>
                    ))}
                  </div>
                )}
                <HIVInfoRow label="TB History" value={hivRecord?.tbHistory || 'None'} />
                <HIVInfoRow label="Hepatitis B" value={hivRecord?.hepatitisB || 'None'} />
                <HIVInfoRow label="STI History" value={hivRecord?.stiHistory || 'None'} />
                {(hivRecord?.hospitalAdmissions?.length || 0) > 0 && (
                  <div>
                    <p className="text-[10px] text-muted uppercase mb-1 mt-2">Hospital Admissions</p>
                    {hivRecord?.hospitalAdmissions.map((adm, i) => (
                      <div key={i} className="text-[11px] text-foreground py-1 border-b border-default/50 last:border-0">
                        {adm.reason}{adm.hospital ? ` @ ${adm.hospital}` : ''}{adm.admissionDate ? ` (${new Date(adm.admissionDate).toLocaleDateString()})` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleHIVSection>
            )}

            {/* ═══ ALLERGIES TAB ═══ */}
            {activeTab === 'allergies' && (
              <CollapsibleHIVSection title="Allergies" icon={AlertTriangle} defaultOpen>
                {hivRecord?.allergies?.length === 0 && <p className="text-muted text-[11px]">No allergies recorded</p>}
                {hivRecord?.allergies.map((a, i) => (
                  <div key={i} className={cn('px-2 py-1.5 rounded text-[11px]', a.severity === 'severe' || a.severity === 'critical' ? 'bg-red-500/10 text-red-700' : 'bg-yellow-500/10 text-yellow-700')}>
                    <span className="font-medium">{a.name}</span> ({a.type}){a.severity ? ` — ${a.severity}` : ''}{a.reaction ? ` — ${a.reaction}` : ''}
                    {(a.severity === 'severe' || a.severity === 'critical') && <span className="ml-1 text-red-600">⚠ CRITICAL</span>}
                  </div>
                ))}
              </CollapsibleHIVSection>
            )}

            {/* ═══ MEDICATIONS TAB ═══ */}
            {activeTab === 'medications' && (
              <CollapsibleHIVSection title="Current Medications" icon={Pill} defaultOpen>
                {activeMeds.length === 0 && <p className="text-muted text-[11px]">No active medications</p>}
                {activeMeds.map((m, i) => (
                  <div key={i} className={cn('px-2 py-1.5 rounded text-[11px]', m.type === 'art' ? 'bg-primary/5 border border-primary/10' : 'bg-main-bg/50')}>
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-muted ml-1">({m.type.toUpperCase()})</span>
                    {m.dosage && <span className="text-muted ml-1">— {m.dosage}</span>}
                    {m.frequency && <span className="text-muted ml-1">{m.frequency}</span>}
                    {m.notes && <p className="text-muted mt-0.5">{m.notes}</p>}
                  </div>
                ))}
              </CollapsibleHIVSection>
            )}

            {/* ═══ LABS TAB ═══ */}
            {activeTab === 'labs' && (
              <CollapsibleHIVSection title="Lab Results" icon={FlaskConical} defaultOpen>
                {(hivRecord?.labResults?.length || 0) === 0 && <p className="text-muted text-[11px]">No lab results recorded</p>}
                {hivRecord?.labResults.slice(-10).reverse().map((lab, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-default/50 last:border-0 text-[11px]">
                    <div>
                      <span className="font-medium text-foreground">{lab.testName}</span>
                      <span className="text-muted ml-1">({lab.testType})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-foreground">{lab.value || ''}</span>
                      {lab.unit && <span className="text-muted ml-0.5">{lab.unit}</span>}
                      {lab.referenceRange && <span className="text-muted ml-1 text-[10px]">[{lab.referenceRange}]</span>}
                    </div>
                  </div>
                ))}
              </CollapsibleHIVSection>
            )}

            {/* ═══ AI ASSISTANT TAB ═══ */}
            {activeTab === 'ai' && (
              <div className="space-y-3">
                {!aiAnalysis && (
                  <div className="text-center py-6">
                    <Brain className="w-8 h-8 text-muted mx-auto mb-2" />
                    <p className="text-xs text-muted mb-3">Run AI analysis on this patient's HIV clinical data</p>
                    <button onClick={handleAiAnalysis} disabled={aiLoading}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors disabled:opacity-50 mx-auto">
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                      {aiLoading ? 'Analyzing...' : 'Run AI Analysis'}
                    </button>
                  </div>
                )}

                {aiLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}

                {aiAnalysis && !aiLoading && (
                  <div className="space-y-3">
                    {aiAnalysis.clinicalAlerts.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted uppercase font-semibold">Clinical Alerts</p>
                        {aiAnalysis.clinicalAlerts.map((alert, i) => (
                          <AlertBadge key={i} alert={alert} />
                        ))}
                      </div>
                    )}

                    {aiAnalysis.possibleCauses.length > 0 && (
                      <CollapsibleHIVSection title="Possible Causes" icon={Stethoscope} defaultOpen={false}>
                        {aiAnalysis.possibleCauses.map((c, i) => <p key={i} className="text-[11px] text-foreground py-1">• {c}</p>)}
                      </CollapsibleHIVSection>
                    )}

                    {aiAnalysis.suggestedInvestigations.length > 0 && (
                      <CollapsibleHIVSection title="Suggested Investigations" icon={FlaskConical} defaultOpen={false}>
                        {aiAnalysis.suggestedInvestigations.map((inv, i) => <p key={i} className="text-[11px] text-foreground py-1">• {inv}</p>)}
                      </CollapsibleHIVSection>
                    )}

                    {aiAnalysis.adherenceRecommendations && (
                      <CollapsibleHIVSection title="Adherence Recommendations" icon={Shield} defaultOpen={false}>
                        <p className="text-[11px] text-foreground whitespace-pre-wrap">{aiAnalysis.adherenceRecommendations}</p>
                      </CollapsibleHIVSection>
                    )}

                    {aiAnalysis.lifestyleAdvice && (
                      <CollapsibleHIVSection title="Lifestyle Advice" icon={Heart} defaultOpen={false}>
                        <p className="text-[11px] text-foreground whitespace-pre-wrap">{aiAnalysis.lifestyleAdvice}</p>
                      </CollapsibleHIVSection>
                    )}

                    {aiAnalysis.medicationSuggestions.length > 0 && (
                      <CollapsibleHIVSection title="Medication Suggestions" icon={Pill} defaultOpen={false}>
                        {aiAnalysis.medicationSuggestions.map((med, i) => (
                          <div key={i} className="px-3 py-2 rounded-lg bg-main-bg/50 border border-default space-y-1">
                            <p className="text-xs font-semibold text-foreground">{med.name}</p>
                            {med.reason && <p className="text-[10px] text-muted">Reason: {med.reason}</p>}
                            {med.dosage && <p className="text-[10px] text-muted">Dosage: {med.dosage}</p>}
                            {med.frequency && <p className="text-[10px] text-muted">Frequency: {med.frequency}</p>}
                            {med.duration && <p className="text-[10px] text-muted">Duration: {med.duration}</p>}
                            {med.sideEffects && <p className="text-[10px] text-orange-600">Side Effects: {med.sideEffects}</p>}
                            {med.drugInteractions && <p className="text-[10px] text-red-500/70">Interactions: {med.drugInteractions}</p>}
                            {med.alternatives && <p className="text-[10px] text-muted">Alternatives: {med.alternatives}</p>}
                            <div className="flex items-center gap-1.5 pt-1">
                              <button onClick={() => acceptMedSuggestion(med)} className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 font-medium transition-colors flex items-center gap-1">
                                <Plus className="w-2.5 h-2.5" /> Accept
                              </button>
                              <button onClick={() => rejectMedSuggestion(med.name)} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 font-medium transition-colors flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5" /> Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </CollapsibleHIVSection>
                    )}

                    {aiAnalysis.referralRecommendations && (
                      <CollapsibleHIVSection title="Referral Recommendations" icon={Send} defaultOpen={false}>
                        <p className="text-[11px] text-foreground whitespace-pre-wrap">{aiAnalysis.referralRecommendations}</p>
                      </CollapsibleHIVSection>
                    )}

                    {aiAnalysis.suggestedFollowUpInterval && (
                      <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-200 text-[11px] text-blue-700 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Suggested follow-up: {aiAnalysis.suggestedFollowUpInterval}
                      </div>
                    )}

                    <button onClick={handleAiAnalysis} disabled={aiLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-main-bg/50 hover:bg-main-bg text-[10px] font-medium text-muted hover:text-foreground transition-colors w-full justify-center disabled:opacity-50 border border-default">
                      <Brain className="w-3 h-3" /> Re-analyze
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══ ALERTS TAB ═══ */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                <p className="text-[10px] text-muted uppercase font-semibold">Color-coded Clinical Alerts</p>

                {/* RED — Critical */}
                <div className="space-y-1.5">
                  {latestVL?.status === 'unsuppressed' && (
                    <AlertBadge alert={{ type: 'red', message: 'Unsuppressed Viral Load', reason: `Current VL: ${latestVL.value} copies/mL. Requires urgent enhanced adherence counselling.` }} />
                  )}
                  {aiAnalysis?.clinicalAlerts?.filter(a => a.type === 'red').map((alert, i) => (
                    <AlertBadge key={`red-${i}`} alert={alert} />
                  ))}
                  {criticalAllergies.map((a, i) => (
                    <AlertBadge key={`ca-${i}`} alert={{ type: 'red', message: `Critical Allergy: ${a.name}`, reason: `${a.type} allergy — ${a.severity} severity${a.reaction ? ` (${a.reaction})` : ''}` }} />
                  ))}
                </div>

                {/* ORANGE — High */}
                <div className="space-y-1.5">
                  {currentOIs.length > 0 && currentOIs.map((oi, i) => (
                    <AlertBadge key={`oi-${i}`} alert={{ type: 'orange', message: `Active OI: ${oi.name}`, reason: 'Requires treatment and monitoring.' }} />
                  ))}
                  {aiAnalysis?.clinicalAlerts?.filter(a => a.type === 'orange').map((alert, i) => (
                    <AlertBadge key={`orange-${i}`} alert={alert} />
                  ))}
                </div>

                {/* YELLOW — Moderate */}
                <div className="space-y-1.5">
                  {hivRecord?.adherenceScore !== undefined && hivRecord.adherenceScore < 80 && (
                    <AlertBadge alert={{ type: 'yellow', message: 'Low Adherence Score', reason: `Score: ${hivRecord.adherenceScore}/100. Adherence intervention recommended.` }} />
                  )}
                  {aiAnalysis?.clinicalAlerts?.filter(a => a.type === 'yellow').map((alert, i) => (
                    <AlertBadge key={`yellow-${i}`} alert={alert} />
                  ))}
                </div>

                {/* GREEN — Info */}
                <div className="space-y-1.5">
                  {latestVL?.status === 'suppressed' && (
                    <AlertBadge alert={{ type: 'green', message: 'Viral Load Suppressed', reason: `Latest VL: ${latestVL.value} copies/mL. Good treatment response.` }} />
                  )}
                  {aiAnalysis?.clinicalAlerts?.filter(a => a.type === 'green').map((alert, i) => (
                    <AlertBadge key={`green-${i}`} alert={alert} />
                  ))}
                </div>

                {activeAlerts.length === 0 && !latestVL && <p className="text-xs text-muted text-center py-4">No active alerts</p>}
              </div>
            )}
          </div>

          {/* ─── Bottom Actions ─── */}
          <div className="border-t border-default px-3 py-2 flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowFollowUp(!showFollowUp)} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 font-medium transition-colors">
              <Calendar className="w-3 h-3" /> Follow-up Plan
            </button>
            <button onClick={() => setShowEducation(!showEducation)} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 font-medium transition-colors">
              <FileText className="w-3 h-3" /> Patient Education
            </button>
            {auditLog.length > 0 && (
              <button onClick={() => { const log = auditLog.map(a => `${new Date(a.timestamp).toLocaleTimeString()} — ${a.action}`).join('\n'); navigator.clipboard.writeText(log); toast.success('Audit log copied'); }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 font-medium transition-colors ml-auto">
                <FileText className="w-3 h-3" /> Audit ({auditLog.length})
              </button>
            )}
          </div>

          {/* ─── Follow-up Plan Modal ─── */}
          {showFollowUp && (
            <div className="border-t border-default p-3 space-y-2">
              <p className="text-[10px] text-muted uppercase font-semibold">Follow-up Plan</p>
              <input value={followUp.nextAppointment} onChange={e => setFollowUp(p => ({ ...p, nextAppointment: e.target.value }))} placeholder="Next appointment date" className="w-full rounded-lg border border-default bg-main-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={followUp.labTests} onChange={e => setFollowUp(p => ({ ...p, labTests: e.target.value }))} placeholder="Lab tests to schedule" className="w-full rounded-lg border border-default bg-main-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={followUp.refill} onChange={e => setFollowUp(p => ({ ...p, refill: e.target.value }))} placeholder="Medication refill" className="w-full rounded-lg border border-default bg-main-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={followUp.counselling} onChange={e => setFollowUp(p => ({ ...p, counselling: e.target.value }))} placeholder="Enhanced adherence counselling" className="w-full rounded-lg border border-default bg-main-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <input value={followUp.referral} onChange={e => setFollowUp(p => ({ ...p, referral: e.target.value }))} placeholder="Referral" className="w-full rounded-lg border border-default bg-main-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="flex items-center gap-2 pt-1">
                <button onClick={saveFollowUp} className="flex-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors">Save Plan</button>
                <button onClick={() => setShowFollowUp(false)} className="px-3 py-1.5 rounded-lg bg-main-bg/50 text-muted hover:text-foreground text-xs font-medium transition-colors border border-default">Cancel</button>
              </div>
            </div>
          )}

          {/* ─── Patient Education Modal ─── */}
          {showEducation && (
            <div className="border-t border-default p-3 space-y-2">
              <p className="text-[10px] text-muted uppercase font-semibold">Patient Education</p>
              <textarea value={patientEducation} onChange={e => setPatientEducation(e.target.value)}
                placeholder="AI-generated or custom patient education content based on condition..."
                rows={4} className="w-full rounded-lg border border-default bg-main-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
              {aiAnalysis?.patientEducation && !patientEducation && (
                <button onClick={() => setPatientEducation(aiAnalysis.patientEducation || '')}
                  className="text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 font-medium transition-colors">
                  Use AI-generated education
                </button>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={saveEducation} className="flex-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors">Save & Send</button>
                <button onClick={() => setShowEducation(false)} className="px-3 py-1.5 rounded-lg bg-main-bg/50 text-muted hover:text-foreground text-xs font-medium transition-colors border border-default">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


