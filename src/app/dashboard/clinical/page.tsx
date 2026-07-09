'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, PERMISSIONS, isClinicalRole } from '@/lib/permissions';
import { clinicalService } from '@/services/clinical.service';
import {
  Stethoscope, ClipboardPlus, Pill, FlaskConical, HeartHandshake,
  UserPlus, Clock, UserCog, Activity, Loader2, Users, AlertTriangle,
  ArrowRight, TrendingUp, CheckCircle, GitBranch, LogOut,
} from 'lucide-react';

const ROLE_SECTIONS = [
  { label: 'Triage Queue', href: '/dashboard/clinical/triage', icon: ClipboardPlus, perm: PERMISSIONS.TRIAGE_PATIENT, desc: 'Assess and prioritize incoming patients' },
  { label: 'Visit Board', href: '/dashboard/clinical/workflow', icon: GitBranch, perm: PERMISSIONS.VIEW_WORKFLOW, desc: 'Kanban view of patient visits' },
  { label: 'Check-in', href: '/dashboard/clinical/workflow/checkin', icon: LogOut, perm: PERMISSIONS.CHECK_IN_PATIENT, desc: 'Register arriving patients' },
  { label: 'Doctor Queue', href: '/dashboard/clinical/workflow/doctor-queue', icon: Stethoscope, perm: PERMISSIONS.MANAGE_DOCTOR_QUEUE, desc: 'Patients waiting for consultation' },
  { label: 'Lab Handoff', href: '/dashboard/clinical/workflow/lab-handoff', icon: FlaskConical, perm: PERMISSIONS.REQUEST_LAB, desc: 'Order lab tests from visits' },
  { label: 'Rx Handoff', href: '/dashboard/clinical/workflow/pharmacy-handoff', icon: Pill, perm: PERMISSIONS.CREATE_PRESCRIPTION, desc: 'Create prescriptions' },
  { label: 'Discharge', href: '/dashboard/clinical/workflow/discharge', icon: UserPlus, perm: PERMISSIONS.DISCHARGE_PATIENT, desc: 'Complete visits with follow-up' },
  { label: 'Pharmacy', href: '/dashboard/clinical/pharmacy', icon: Pill, perm: PERMISSIONS.DISPENSE_MEDICATION, desc: 'Review and dispense prescriptions' },
  { label: 'Laboratory', href: '/dashboard/clinical/laboratory', icon: FlaskConical, perm: PERMISSIONS.PROCESS_SAMPLE, desc: 'Process samples and upload results' },
  { label: 'Adherence', href: '/dashboard/clinical/adherence', icon: HeartHandshake, perm: PERMISSIONS.CONDUCT_COUNSELING, desc: 'Counsel patients and track adherence' },
  { label: 'Case Management', href: '/dashboard/clinical/case', icon: UserPlus, perm: PERMISSIONS.MANAGE_CASE, desc: 'Manage high-risk patients and referrals' },
  { label: 'Appointments', href: '/dashboard/clinical/appointments', icon: Clock, perm: PERMISSIONS.MANAGE_APPOINTMENTS, desc: 'Schedule and manage appointments' },
  { label: 'Patients', href: '/dashboard/clinical/patients', icon: UserCog, perm: PERMISSIONS.VIEW_PATIENT, desc: 'Search and view patient records' },
  { label: 'Timeline', href: '/dashboard/clinical/timeline', icon: Activity, perm: PERMISSIONS.VIEW_PATIENT_TIMELINE, desc: 'View patient activity timeline' },
];

export default function ClinicalDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [stats, setStats] = useState({ triage: 0, prescriptions: 0, labs: 0, critical: 0, cases: 0, adherence: 0, workflow: 0, doctorQueue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fetchStats = async () => {
      try {
        const results = await Promise.allSettled([
          hasPermission(user, PERMISSIONS.TRIAGE_PATIENT) ? clinicalService.getTriageQueue({ status: 'pending' }) : null,
          hasPermission(user, PERMISSIONS.VIEW_PRESCRIPTIONS) ? clinicalService.getPendingPrescriptions() : null,
          hasPermission(user, PERMISSIONS.PROCESS_SAMPLE) ? clinicalService.getLabRequests() : null,
          hasPermission(user, PERMISSIONS.FLAG_CRITICAL_RESULT) ? clinicalService.getCriticalResults() : null,
          hasPermission(user, PERMISSIONS.MANAGE_CASE) ? clinicalService.getHighRiskPatients() : null,
          hasPermission(user, PERMISSIONS.VIEW_ADHERENCE) ? clinicalService.getPoorAdherencePatients() : null,
          hasPermission(user, PERMISSIONS.VIEW_WORKFLOW) ? clinicalService.getActiveWorkflowVisits() : null,
          hasPermission(user, PERMISSIONS.MANAGE_DOCTOR_QUEUE) ? clinicalService.getWorkflowDoctorQueue() : null,
        ]);
        setStats({
          triage: results[0]?.status === 'fulfilled' && results[0].value ? results[0].value.data?.data?.length ?? 0 : 0,
          prescriptions: results[1]?.status === 'fulfilled' && results[1].value ? results[1].value.data?.data?.length ?? 0 : 0,
          labs: results[2]?.status === 'fulfilled' && results[2].value ? results[2].value.data?.data?.length ?? 0 : 0,
          critical: results[3]?.status === 'fulfilled' && results[3].value ? results[3].value.data?.data?.length ?? 0 : 0,
          cases: results[4]?.status === 'fulfilled' && results[4].value ? results[4].value.data?.data?.length ?? 0 : 0,
          adherence: results[5]?.status === 'fulfilled' && results[5].value ? results[5].value.data?.data?.length ?? 0 : 0,
          workflow: results[6]?.status === 'fulfilled' && results[6].value ? results[6].value.data?.data?.length ?? 0 : 0,
          doctorQueue: results[7]?.status === 'fulfilled' && results[7].value ? results[7].value.data?.data?.length ?? 0 : 0,
        });
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchStats();
  }, [isAuthenticated, user]);

  if (!_hydrated || !isAuthenticated) return null;

  const roleLabel = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clinical Dashboard</h1>
          <p className="text-sm text-muted mt-1 capitalize">{roleLabel} — Clinical Overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Stethoscope className="w-4 h-4" />
          <span>Healthcare Information System</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="Triage Queue" value={stats.triage} icon={ClipboardPlus} color="text-orange-500" bg="bg-orange-500/10" loading={loading} />
        <StatCard label="Active Visits" value={stats.workflow} icon={GitBranch} color="text-indigo-500" bg="bg-indigo-500/10" loading={loading} />
        <StatCard label="Doctor Queue" value={stats.doctorQueue} icon={Stethoscope} color="text-green-500" bg="bg-green-500/10" loading={loading} />
        <StatCard label="Pending Rx" value={stats.prescriptions} icon={Pill} color="text-blue-500" bg="bg-blue-500/10" loading={loading} />
        <StatCard label="Lab Requests" value={stats.labs} icon={FlaskConical} color="text-purple-500" bg="bg-purple-500/10" loading={loading} />
        <StatCard label="Critical Results" value={stats.critical} icon={AlertTriangle} color="text-red-500" bg="bg-red-500/10" loading={loading} />
        <StatCard label="High Risk Cases" value={stats.cases} icon={UserPlus} color="text-rose-500" bg="bg-rose-500/10" loading={loading} />
        <StatCard label="Adherence Issues" value={stats.adherence} icon={HeartHandshake} color="text-yellow-500" bg="bg-yellow-500/10" loading={loading} />
      </div>

      {/* Role Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {ROLE_SECTIONS.filter(s => hasPermission(user, s.perm as any)).map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}
              className="group rounded-xl border border-default bg-card-bg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{s.label}</h3>
              <p className="text-xs text-muted mt-0.5">{s.desc}</p>
            </Link>
          );
        })}
      </div>

      {!isClinicalRole(user?.role as any) && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Limited Clinical Access</p>
            <p className="text-xs text-muted mt-0.5">Your account does not have a clinical role. Some features may be restricted. Contact your hospital administrator if you need clinical access.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, loading }: { label: string; value: number; icon: React.FC<{ className?: string }>; color: string; bg: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-default bg-card-bg p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted" /> : <Icon className={`w-5 h-5 ${color}`} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted truncate">{label}</p>
          <p className="text-lg font-bold text-foreground">{loading ? '—' : value}</p>
        </div>
      </div>
    </div>
  );
}
