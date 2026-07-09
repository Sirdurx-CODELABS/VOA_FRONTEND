'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Loader2, Clock, User, Phone,
  ArrowRight, CheckCircle, X, FlaskConical, Pill,
  LogOut, Stethoscope, AlertTriangle, Activity,
} from 'lucide-react';

type ColumnKey = 'checked_in' | 'triaged' | 'in_consultation' | 'lab_ordered' | 'in_pharmacy' | 'dispensed' | 'discharged' | 'cancelled';

const COLUMNS: { key: ColumnKey; label: string; color: string }[] = [
  { key: 'checked_in', label: 'Checked In', color: 'border-t-blue-500' },
  { key: 'triaged', label: 'Triaged', color: 'border-t-orange-500' },
  { key: 'in_consultation', label: 'In Consultation', color: 'border-t-green-500' },
  { key: 'lab_ordered', label: 'Lab Ordered', color: 'border-t-purple-500' },
  { key: 'in_pharmacy', label: 'In Pharmacy', color: 'border-t-blue-500' },
  { key: 'dispensed', label: 'Dispensed', color: 'border-t-teal-500' },
  { key: 'discharged', label: 'Discharged', color: 'border-t-gray-500' },
  { key: 'cancelled', label: 'Cancelled', color: 'border-t-red-500' },
];

const STATUS_COLORS: Record<string, string> = {
  checked_in: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  triaged: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  in_consultation: 'bg-green-500/10 text-green-600 border-green-500/20',
  lab_ordered: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  in_pharmacy: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  dispensed: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  discharged: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function WorkflowKanbanPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const {
    activeVisits, loading, fetchActiveVisits,
    transitionVisit, startConsultation, dischargePatient,
    initSocketListener, destroySocketListener,
  } = useWorkflowStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canView = hasPermission(user, PERMISSIONS.VIEW_WORKFLOW as any);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveVisits();
      initSocketListener();
      return () => { destroySocketListener(); };
    }
  }, [isAuthenticated, fetchActiveVisits, initSocketListener, destroySocketListener]);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = activeVisits.filter((v: any) => v.status === col.key);
    return acc;
  }, {} as Record<string, any[]>);

  const handleAction = async (visit: any, action: string) => {
    setActionLoading(`${visit._id}-${action}`);
    try {
      switch (action) {
        case 'start_consultation':
          await startConsultation(visit._id);
          toast.success('Consultation started');
          break;
        case 'order_lab':
          await transitionVisit(visit._id, { status: 'lab_ordered' });
          toast.success('Marked as lab ordered');
          break;
        case 'send_pharmacy':
          await transitionVisit(visit._id, { status: 'in_pharmacy' });
          toast.success('Sent to pharmacy');
          break;
        case 'dispensed':
          await transitionVisit(visit._id, { status: 'dispensed' });
          toast.success('Marked as dispensed');
          break;
        case 'discharge':
          router.push(`/dashboard/clinical/workflow/discharge?visitId=${visit._id}`);
          return;
        case 'cancel':
          await transitionVisit(visit._id, { status: 'cancelled' });
          toast.success('Visit cancelled');
          break;
      }
      fetchActiveVisits();
    } catch { toast.error('Action failed'); }
    setActionLoading(null);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visit Status Board</h1>
          <p className="text-sm text-muted mt-1">Kanban view of all active patient visits</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{activeVisits.length} total visits</span>
          <button onClick={() => fetchActiveVisits()} className="text-sm text-primary hover:underline flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {!canView && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have permission to view the workflow board.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {COLUMNS.map((col) => {
            const items = grouped[col.key] || [];
            return (
              <div key={col.key} className={cn('rounded-xl border border-default bg-card-bg border-t-2', col.color)}>
                <div className="p-3 border-b border-default flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-foreground uppercase">{col.label}</h3>
                  <span className="text-[11px] font-bold text-muted bg-hover px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-[11px] text-muted">No visits</p>
                    </div>
                  ) : items.map((visit: any) => (
                    <div key={visit._id} className="rounded-lg border border-default p-2.5 space-y-2 hover:border-primary/20 transition-colors">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{visit.patient?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span className="truncate">{visit.patient?.phone || '—'}</span>
                            {visit.patient?.age && <span>· {visit.patient.age}y</span>}
                          </div>
                        </div>
                        {visit.queueNumber && (
                          <span className="text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded shrink-0">
                            #{visit.queueNumber}
                          </span>
                        )}
                      </div>

                      {visit.chiefComplaint && (
                        <p className="text-[10px] text-muted line-clamp-2">{visit.chiefComplaint}</p>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {visit.priority && visit.priority !== 'normal' && (
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                            visit.priority === 'emergency' ? 'bg-red-500/10 text-red-600' :
                            visit.priority === 'urgent' ? 'bg-orange-500/10 text-orange-600' :
                            'bg-rose-500/10 text-rose-600'
                          )}>
                            {visit.priority}
                          </span>
                        )}
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium border', STATUS_COLORS[visit.status] || '')}>
                          {visit.status?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      {visit.status === 'checked_in' && (
                        <div className="flex gap-1 pt-1">
                          <button onClick={() => handleAction(visit, 'cancel')} disabled={actionLoading === `${visit._id}-cancel`}
                            className="flex-1 text-[10px] py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                          >
                            {actionLoading === `${visit._id}-cancel` ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Cancel'}
                          </button>
                        </div>
                      )}
                      {visit.status === 'triaged' && (
                        <button onClick={() => handleAction(visit, 'start_consultation')} disabled={actionLoading === `${visit._id}-start_consultation`}
                          className="w-full text-[10px] py-1 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          {actionLoading === `${visit._id}-start_consultation` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Stethoscope className="w-3 h-3" />}
                          Consult
                        </button>
                      )}
                      {visit.status === 'in_consultation' && (
                        <div className="flex gap-1 pt-1">
                          <button onClick={() => handleAction(visit, 'order_lab')} disabled={actionLoading === `${visit._id}-order_lab`}
                            className="flex-1 text-[10px] py-1 rounded bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-1"
                          >
                            {actionLoading === `${visit._id}-order_lab` ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
                            Lab
                          </button>
                          <button onClick={() => handleAction(visit, 'send_pharmacy')} disabled={actionLoading === `${visit._id}-send_pharmacy`}
                            className="flex-1 text-[10px] py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1"
                          >
                            {actionLoading === `${visit._id}-send_pharmacy` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pill className="w-3 h-3" />}
                            Rx
                          </button>
                        </div>
                      )}
                      {visit.status === 'lab_ordered' && (
                        <button onClick={() => handleAction(visit, 'send_pharmacy')} disabled={actionLoading === `${visit._id}-send_pharmacy`}
                          className="w-full text-[10px] py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          {actionLoading === `${visit._id}-send_pharmacy` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pill className="w-3 h-3" />}
                          Send to Pharmacy
                        </button>
                      )}
                      {visit.status === 'in_pharmacy' && (
                        <button onClick={() => handleAction(visit, 'dispensed')} disabled={actionLoading === `${visit._id}-dispensed`}
                          className="w-full text-[10px] py-1 rounded bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          {actionLoading === `${visit._id}-dispensed` ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Dispensed
                        </button>
                      )}
                      {(visit.status === 'dispensed' || visit.status === 'in_consultation' || visit.status === 'lab_ordered') && (
                        <button onClick={() => handleAction(visit, 'discharge')}
                          className="w-full text-[10px] py-1 rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                          <LogOut className="w-3 h-3" /> Discharge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
