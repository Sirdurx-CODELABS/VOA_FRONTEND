'use client';
import { useState, useEffect } from 'react';
import { Clock, Loader2, AlertCircle } from 'lucide-react';
import { timelineService } from '@/services/clinicalApi.service';
import { Badge } from '@/components/ui/Badge';

const ACTIVITY_ICONS: Record<string, string> = {
  registration: '📋', vitals_recorded: '❤️', triage_completed: '🔍',
  consultation_started: '🩺', consultation_completed: '✅', prescription_created: '💊',
  prescription_dispensed: '💊', lab_requested: '🧪', lab_result_uploaded: '📊',
  lab_critical_flagged: '🚨', referral_sent: '🔄', counseling_session: '🗣️',
  adherence_review: '📈', case_opened: '📁', appointment_scheduled: '📅',
  medication_refilled: '💊', ai_summary_generated: '🤖',
  ai_recommendation_accepted: '✓', ai_recommendation_rejected: '✗',
  patient_educated: '📖', note_added: '📝', document_uploaded: '📎',
  home_visit: '🏠', outreach_conducted: '📞', consent_granted: '✓',
  hiv_viral_load_added: '🩸', hiv_cd4_added: '🔬', hiv_regimen_changed: '💊',
};

const ACTIVITY_LABELS: Record<string, string> = {
  registration: 'Registered', vitals_recorded: 'Vitals Recorded', triage_completed: 'Triage',
  consultation_started: 'Consultation Started', consultation_completed: 'Consultation Completed',
  prescription_created: 'Prescription Created', prescription_dispensed: 'Dispensed',
  lab_requested: 'Lab Requested', lab_result_uploaded: 'Lab Results',
  lab_critical_flagged: 'Critical Lab Flagged', referral_sent: 'Referral Sent',
  counseling_session: 'Counseling', adherence_review: 'Adherence Review',
  case_opened: 'Case Opened', appointment_scheduled: 'Appointment',
  medication_refilled: 'Medication Refilled', ai_summary_generated: 'AI Summary',
  ai_recommendation_accepted: 'AI Rec. Accepted', ai_recommendation_rejected: 'AI Rec. Rejected',
  patient_educated: 'Patient Education', note_added: 'Note Added',
  document_uploaded: 'Document Uploaded', home_visit: 'Home Visit',
  outreach_conducted: 'Outreach', consent_granted: 'Consent Granted',
  hiv_viral_load_added: 'Viral Load', hiv_cd4_added: 'CD4 Count',
  hiv_regimen_changed: 'Regimen Change',
};

interface TimelineProps {
  patientId: string;
  limit?: number;
}

export function PatientTimeline({ patientId, limit = 50 }: TimelineProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await timelineService.getPatientTimeline(patientId);
        setEntries((res.data.data || []).slice(0, limit));
      } catch {
        setError('Failed to load timeline');
      }
      setLoading(false);
    };
    fetch();
  }, [patientId, limit]);

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>;
  if (!entries.length) return <div className="p-6 text-center text-slate-400"><p className="text-sm">No timeline entries yet</p></div>;

  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-0">
        {entries.map((entry, i) => (
          <div key={entry._id || i} className="relative flex items-start gap-4 pb-4 pl-0">
            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shrink-0 text-sm">
              {ACTIVITY_ICONS[entry.activityType] || '📌'}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {ACTIVITY_LABELS[entry.activityType] || entry.activityType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
                {entry.department && <Badge variant="default">{entry.department}</Badge>}
              </div>
              {entry.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{entry.description}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(entry.createdAt).toLocaleString()}</span>
                {entry.performedByName && <span>by {entry.performedByName}</span>}
                {entry.performedByRole && <Badge variant="default">{entry.performedByRole.replace(/_/g, ' ')}</Badge>}
                {entry.source && entry.source !== 'web' && <Badge variant="info">{entry.source}</Badge>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
