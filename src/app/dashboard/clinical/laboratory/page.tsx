'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FlaskConical, Loader2, AlertTriangle, CheckCircle,
  ChevronRight, Clock, X, User, FileText, Beaker,
} from 'lucide-react';

export default function LaboratoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sampleForm, setSampleForm] = useState({ sampleType: '', notes: '' });
  const [testResults, setTestResults] = useState<{ testName: string; result: string; referenceRange: string; isCritical: boolean }[]>([]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canProcess = hasPermission(user, PERMISSIONS.PROCESS_SAMPLE as any);
  const canUpload = hasPermission(user, PERMISSIONS.UPLOAD_LAB_RESULTS as any);

  const fetch = useCallback(async () => {
    try {
      const res = await clinicalService.getLabRequests();
      setRequests(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAuthenticated) fetch(); }, [isAuthenticated, fetch]);

  const handleCollect = async () => {
    if (!selected || !sampleForm.sampleType) return toast.error('Sample type required');
    setSubmitting(true);
    try {
      await clinicalService.collectSample(selected._id, sampleForm);
      toast.success('Sample collected');
      setSelected(null);
      setSampleForm({ sampleType: '', notes: '' });
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  const handleUpload = async () => {
    if (!selected || testResults.length === 0) return toast.error('At least one test result required');
    setSubmitting(true);
    try {
      await clinicalService.uploadLabResult(selected._id, { tests: testResults });
      toast.success('Results uploaded');
      setSelected(null);
      setTestResults([]);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  const addTestRow = () => {
    setTestResults(p => [...p, { testName: '', result: '', referenceRange: '', isCritical: false }]);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laboratory</h1>
        <p className="text-sm text-muted mt-1">Process samples and upload lab results</p>
      </div>

      {!canProcess && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have laboratory permissions.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border border-default bg-card-bg divide-y divide-default max-h-[70vh] overflow-y-auto">
            {requests.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted">No pending lab requests</p>
              </div>
            ) : requests.map((r: any) => (
              <button key={r._id} onClick={() => setSelected(r)}
                className={cn('w-full text-left p-4 hover:bg-hover transition-colors', selected?._id === r._id && 'bg-primary/5')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs font-bold shrink-0">
                      <Beaker className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.patient?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted">{r.tests?.length || 0} tests</p>
                    </div>
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                    r.status === 'requested' ? 'bg-yellow-500/10 text-yellow-600' :
                    r.status === 'sample_collected' ? 'bg-blue-500/10 text-blue-600' :
                    r.status === 'processing' ? 'bg-purple-500/10 text-purple-600' :
                    'bg-green-500/10 text-green-600'
                  )}>{r.status.replace(/_/g, ' ')}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {!selected ? (
              <div className="py-12 text-center">
                <FlaskConical className="w-10 h-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">Select a lab request</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Lab Request
                  </h2>
                  <button onClick={() => { setSelected(null); setTestResults([]); }} className="text-muted hover:text-foreground"><X className="w-4 h-4" /></button>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted">Patient:</span> <span className="text-foreground font-medium">{selected.patient?.name}</span></p>
                  <p><span className="text-muted">Status:</span> <span className="text-foreground capitalize">{selected.status?.replace(/_/g, ' ')}</span></p>
                </div>

                {selected.status === 'requested' && (
                  <>
                    <div>
                      <h3 className="text-xs font-semibold text-muted uppercase mb-2">Collect Sample</h3>
                      <select value={sampleForm.sampleType} onChange={e => setSampleForm(p => ({ ...p, sampleType: e.target.value }))}
                        className="w-full mb-2 px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm"
                      >
                        <option value="">Select type...</option>
                        <option value="blood">Blood</option>
                        <option value="urine">Urine</option>
                        <option value="sputum">Sputum</option>
                        <option value="stool">Stool</option>
                        <option value="swab">Swab</option>
                        <option value="csf">CSF</option>
                      </select>
                      <input type="text" placeholder="Notes" value={sampleForm.notes} onChange={e => setSampleForm(p => ({ ...p, notes: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm"
                      />
                    </div>
                    <button onClick={handleCollect} disabled={submitting}
                      className="w-full px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                    >{submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Record Sample Collection'}</button>
                  </>
                )}

                {(selected.status === 'sample_collected' || selected.status === 'processing') && canUpload && (
                  <>
                    <div>
                      <h3 className="text-xs font-semibold text-muted uppercase mb-2">Test Results</h3>
                      <div className="space-y-2">
                        {testResults.map((t, i) => (
                          <div key={i} className="p-2 rounded-lg bg-hover/50 space-y-1">
                            <input type="text" placeholder="Test name" value={t.testName} onChange={e => {
                              const copy = [...testResults]; copy[i].testName = e.target.value; setTestResults(copy);
                            }} className="w-full px-2 py-1 rounded bg-transparent text-sm text-foreground border border-default" />
                            <div className="flex gap-1">
                              <input type="text" placeholder="Result" value={t.result} onChange={e => {
                                const copy = [...testResults]; copy[i].result = e.target.value; setTestResults(copy);
                              }} className="flex-1 px-2 py-1 rounded bg-transparent text-sm text-foreground border border-default" />
                              <input type="text" placeholder="Ref range" value={t.referenceRange} onChange={e => {
                                const copy = [...testResults]; copy[i].referenceRange = e.target.value; setTestResults(copy);
                              }} className="flex-1 px-2 py-1 rounded bg-transparent text-sm text-foreground border border-default" />
                            </div>
                            <label className="flex items-center gap-2 text-xs text-muted">
                              <input type="checkbox" checked={t.isCritical} onChange={e => {
                                const copy = [...testResults]; copy[i].isCritical = e.target.checked; setTestResults(copy);
                              }} /> Critical
                            </label>
                          </div>
                        ))}
                      </div>
                      <button onClick={addTestRow} className="mt-2 text-xs text-primary hover:underline">+ Add test</button>
                    </div>
                    <button onClick={handleUpload} disabled={submitting || testResults.length === 0}
                      className="w-full px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
                    >{submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Upload Results'}</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
