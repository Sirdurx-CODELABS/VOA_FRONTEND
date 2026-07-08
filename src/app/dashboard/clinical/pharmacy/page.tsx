'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Pill, Loader2, AlertTriangle, CheckCircle, Search,
  ChevronRight, Clock, X, User, FileText, Eye,
} from 'lucide-react';

export default function PharmacyPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canView = hasPermission(user, PERMISSIONS.VIEW_PRESCRIPTIONS as any);
  const canDispense = hasPermission(user, PERMISSIONS.DISPENSE_MEDICATION as any);

  const fetch = useCallback(async () => {
    try {
      const res = await clinicalService.getPendingPrescriptions();
      setPrescriptions(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAuthenticated) fetch(); }, [isAuthenticated, fetch]);

  const handleReview = async (id: string, status: string) => {
    setSubmitting(true);
    try {
      await clinicalService.reviewPrescription(id, { status, notes: '' });
      toast.success(`Prescription ${status}`);
      setSelected(null);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  const handleDispense = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await clinicalService.dispensePrescription(selected._id, { items: [], counselingNotes: '' });
      toast.success('Medication dispensed');
      setSelected(null);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pharmacy</h1>
        <p className="text-sm text-muted mt-1">Review and dispense medications</p>
      </div>

      {!canView && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have pharmacy permissions.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[70vh] overflow-y-auto">
            {prescriptions.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No pending prescriptions</p>
              </div>
            ) : prescriptions.map((rx: any) => (
              <button key={rx._id} onClick={() => setSelected(rx)}
                className={cn('w-full text-left p-4 hover:bg-hover transition-colors', selected?._id === rx._id && 'bg-primary/5')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{rx.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">
                        {rx.medications?.length || 0} meds · Dr. {rx.doctor?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 font-medium shrink-0">
                    {rx.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {!selected ? (
              <div className="py-12 text-center">
                <Pill className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a prescription to review</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Prescription
                  </h2>
                  <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted">Patient:</span> <span className="text-foreground font-medium">{selected.patient?.name}</span></p>
                  <p><span className="text-muted">Doctor:</span> <span className="text-foreground">Dr. {selected.doctor?.name}</span></p>
                  <p><span className="text-muted">Date:</span> <span className="text-foreground">{new Date(selected.createdAt).toLocaleDateString()}</span></p>
                </div>
                {selected.medications?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted uppercase mb-2">Medications</h3>
                    <div className="space-y-2">
                      {selected.medications.map((m: any, i: number) => (
                        <div key={i} className="p-2 rounded-lg bg-hover/50 text-sm">
                          <p className="font-medium text-foreground">{m.name || m.medication}</p>
                          <p className="text-xs text-muted">{m.dosage} · {m.frequency} · {m.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {canDispense && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleDispense} disabled={submitting}
                      className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Dispense'}
                    </button>
                    <button onClick={() => handleReview(selected._id, 'cancelled')} disabled={submitting}
                      className="px-4 py-2 rounded-lg border border-red-500/30 text-red-600 text-sm font-semibold hover:bg-red-500/10 disabled:opacity-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
