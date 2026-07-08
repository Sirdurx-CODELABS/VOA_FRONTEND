'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import toast from 'react-hot-toast';
import {
  Activity, Search, Loader2, User, Clock, Stethoscope, Pill,
  Beaker, HeartHandshake, FileText, AlertCircle, ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';

const ACTIVITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  triage_completed: ClipboardCheck, vitals_recorded: Activity,
  consultation_requested: Stethoscope, consultation_started: Stethoscope,
  consultation_completed: Stethoscope, prescription_created: Pill,
  prescription_reviewed: Pill, prescription_dispensed: Pill,
  prescription_cancelled: Pill, sample_collected: Beaker,
  lab_requested: Beaker, lab_result_uploaded: Beaker,
  lab_critical_flagged: AlertCircle, counseling_session: HeartHandshake,
  case_opened: FileText, case_updated: FileText, referral_sent: Activity,
  home_visit: Activity, outreach_conducted: Activity,
  appointment_scheduled: Clock, appointment_completed: Clock,
  appointment_missed: Clock,
};

export default function TimelinePage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (_hydrated && !isAuthenticated) router.replace('/login');

  const canView = hasPermission(user, PERMISSIONS.VIEW_PATIENT_TIMELINE as any);

  const handleSearch = async () => {
    if (!patientId.trim()) return toast.error('Enter a patient ID');
    setLoading(true);
    setSearched(true);
    try {
      const res = await clinicalService.getPatientTimeline(patientId.trim());
      setTimeline(res.data?.data || []);
      if (res.data?.data?.length > 0) {
        setPatientName(res.data.data[0].performedByName || '');
      }
    } catch {
      toast.error('Failed to load timeline. Check the patient ID.');
      setTimeline([]);
    }
    setLoading(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patient Timeline</h1>
        <p className="text-sm text-muted mt-1">View complete clinical activity history for a patient</p>
      </div>
      {!canView && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have permission to view patient timelines.</p>
        </div>
      )}
      {canView && (
        <>
          <div className="flex gap-2">
            <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)}
              placeholder="Enter Patient ID..."
              className="flex-1 max-w-md px-4 py-2.5 rounded-xl border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>

          {searched && (
            <div className="rounded-xl border border-default bg-card-bg divide-y divide-default">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
              ) : timeline.length === 0 ? (
                <div className="py-16 text-center">
                  <Activity className="w-10 h-10 text-muted mx-auto mb-3" />
                  <p className="text-sm text-muted">No timeline entries found for this patient</p>
                </div>
              ) : (
                <div className="max-h-[65vh] overflow-y-auto">
                  {timeline.map((entry: any, i: number) => {
                    const Icon = ACTIVITY_ICONS[entry.activityType] || Activity;
                    return (
                      <div key={entry._id || i} className="flex items-start gap-3 p-4 hover:bg-hover transition-colors">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          {i < timeline.length - 1 && <div className="absolute top-10 left-4 w-px h-full bg-default" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground capitalize">
                            {entry.activityType?.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {entry.performedByName ? `by ${entry.performedByName}` : ''}
                            {entry.performedByRole ? ` (${entry.performedByRole.replace(/_/g, ' ')})` : ''}
                            {entry.department ? ` · ${entry.department}` : ''}
                          </p>
                          {entry.description && (
                            <p className="text-xs text-foreground/70 mt-1">{entry.description}</p>
                          )}
                          {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(entry.metadata).filter(([_, v]) => v).map(([k, v]) => (
                                <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-hover text-muted">
                                  {k.replace(/([A-Z])/g, ' $1').trim()}: {String(v).slice(0, 30)}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-muted mt-1">
                            <Clock className="w-3 h-3 inline mr-0.5" />
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
