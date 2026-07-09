'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  UserPlus, Loader2, AlertTriangle, CheckCircle,
  ChevronRight, X, User, Calendar, FileText,
  AlertCircle,
} from 'lucide-react';

export default function CaseManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [highRisk, setHighRisk] = useState<any[]>([]);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [tab, setTab] = useState<'high_risk' | 'my_cases'>('high_risk');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canManage = hasPermission(user, PERMISSIONS.MANAGE_CASE as any);

  const fetch = useCallback(async () => {
    try {
      const [hr, mc] = await Promise.allSettled([
        clinicalService.getHighRiskPatients(),
        clinicalService.getMyCases(),
      ]);
      if (hr.status === 'fulfilled') setHighRisk(hr.value.data?.data || []);
      if (mc.status === 'fulfilled') setMyCases(mc.value.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAuthenticated) fetch(); }, [isAuthenticated, fetch]);

  const handleOpenCase = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await clinicalService.openCaseRecord({
        patient: selected.patient?._id || selected._id,
        category: 'missed_appointments',
        riskLevel: selected.riskLevel === 'critical' ? 'critical' : 'high',
      });
      toast.success('Case record opened');
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  const list = tab === 'high_risk' ? highRisk : myCases;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Case Management</h1>
        <p className="text-sm text-muted mt-1">Manage high-risk patients and care coordination</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-hover p-1 w-fit">
        <button onClick={() => setTab('high_risk')} className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'high_risk' ? 'bg-card-bg text-foreground shadow-sm' : 'text-muted hover:text-foreground')}>
          High Risk ({highRisk.length})
        </button>
        <button onClick={() => setTab('my_cases')} className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors', tab === 'my_cases' ? 'bg-card-bg text-foreground shadow-sm' : 'text-muted hover:text-foreground')}>
          My Cases ({myCases.length})
        </button>
      </div>

      {!canManage && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have case management permissions.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[70vh] overflow-y-auto">
            {list.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">{tab === 'high_risk' ? 'No high-risk patients' : 'No assigned cases'}</p>
              </div>
            ) : list.map((c: any) => (
              <button key={c._id} onClick={() => setSelected(c)}
                className={cn('w-full text-left p-4 hover:bg-hover transition-colors', selected?._id === c._id && 'bg-primary/5')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      c.riskLevel === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                    )}>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">
                        {c.category || 'General'} · Risk: {c.riskLevel}
                        {c.nextFollowUpDate ? ` · Follow-up: ${new Date(c.nextFollowUpDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {!selected ? (
              <div className="py-12 text-center">
                <UserPlus className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a patient</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">{selected.patient?.name || 'Patient'}</h2>
                  <button onClick={() => setSelected(null)} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
                <div className="text-sm space-y-1">
                  {selected.riskLevel && (
                    <p><span className="text-muted">Risk Level:</span>{' '}
                      <span className={cn('font-semibold', selected.riskLevel === 'critical' ? 'text-red-500' : selected.riskLevel === 'high' ? 'text-orange-500' : 'text-yellow-500')}>
                        {selected.riskLevel}
                      </span>
                    </p>
                  )}
                  {selected.interventions?.length > 0 && (
                    <p><span className="text-muted">Interventions:</span> <span className="text-foreground">{selected.interventions.length}</span></p>
                  )}
                  {selected.nextFollowUpDate && (
                    <p><span className="text-muted">Next Follow-up:</span> <span className="text-foreground">{new Date(selected.nextFollowUpDate).toLocaleDateString()}</span></p>
                  )}
                </div>
                {tab === 'high_risk' && !selected.status && (
                  <button onClick={handleOpenCase} disabled={submitting}
                    className="w-full px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >{submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Open Case Record'}</button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
