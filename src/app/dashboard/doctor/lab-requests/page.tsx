'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { labService, patientService } from '@/services/doctorApi.service';
import { LabRequest } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Loader2, Plus, Search, X, Beaker, AlertCircle, Clock,
  CheckCircle, FlaskConical, Ban, Printer, User,
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Requested', value: 'requested' },
  { label: 'Sample Collected', value: 'sample_collected' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  requested: 'bg-yellow-500/10 text-yellow-600',
  sample_collected: 'bg-blue-500/10 text-blue-600',
  processing: 'bg-purple-500/10 text-purple-600',
  completed: 'bg-green-500/10 text-green-600',
  cancelled: 'bg-red-500/10 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested',
  sample_collected: 'Sample Collected',
  processing: 'Processing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const TEST_OPTIONS = [
  { label: 'Viral Load', value: 'viral_load', category: 'viral_load' },
  { label: 'CD4', value: 'cd4', category: 'cd4' },
  { label: 'FBC', value: 'fbc', category: 'fbc' },
  { label: 'LFT', value: 'lft', category: 'lft' },
  { label: 'RFT', value: 'rft', category: 'rft' },
  { label: 'GeneXpert', value: 'genexpert', category: 'genexpert' },
  { label: 'Malaria', value: 'malaria', category: 'malaria' },
  { label: 'Pregnancy Test', value: 'pregnancy', category: 'pregnancy' },
  { label: 'Urinalysis', value: 'urinalysis', category: 'urinalysis' },
  { label: 'Custom Test', value: 'custom', category: 'custom' },
];

export default function LabRequestsPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<{ _id: string; name: string; phone: string }[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ _id: string; name: string; phone: string } | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTestName, setCustomTestName] = useState('');
  const [notes, setNotes] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await labService.getAll();
        setRequests(res.data.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated]);

  const filtered = filter
    ? requests.filter(r => r.status === filter)
    : requests;

  const handlePatientSearch = async () => {
    if (!patientQuery.trim()) return;
    setPatientSearching(true);
    try {
      const res = await patientService.search(patientQuery);
      setPatientResults(res.data.data || []);
    } catch {
      try {
        const res = await patientService.getByPhone(patientQuery);
        setPatientResults([{ _id: res.data.data._id, name: res.data.data.name, phone: res.data.data.phone }]);
      } catch {
        setPatientResults([]);
      }
    }
    setPatientSearching(false);
  };

  const toggleTest = (value: string) => {
    setSelectedTests(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  };

  const resetForm = () => {
    setPatientQuery('');
    setPatientResults([]);
    setSelectedPatient(null);
    setSelectedTests([]);
    setCustomTestName('');
    setNotes('');
    setUrgent(false);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error('Select a patient'); return; }
    if (!selectedTests.length && !customTestName.trim()) { toast.error('Select at least one test'); return; }

    const tests = [
      ...selectedTests.map(t => {
        const opt = TEST_OPTIONS.find(o => o.value === t);
        return { testName: opt?.label || t, category: opt?.category || 'custom' as LabRequest['tests'][0]['category'], notes: '', isUrgent: urgent };
      }),
      ...(customTestName.trim() ? [{ testName: customTestName.trim(), category: 'custom' as LabRequest['tests'][0]['category'], notes: '', isUrgent: urgent }] : []),
    ];

    setSubmitting(true);
    try {
      await labService.create({
        patient: selectedPatient._id as unknown as LabRequest['patient'],
        tests,
        notes: notes || undefined,
      } as Partial<LabRequest>);
      toast.success('Lab request created');
      const res = await labService.getAll();
      setRequests(res.data.data || []);
      resetForm();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create lab request';
      toast.error(msg);
    }
    setSubmitting(false);
  };

  const handlePrint = (req: LabRequest) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Lab Request</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px; }
        .meta { font-size: 13px; color: #555; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f5f5f5; }
        .urgent { color: red; font-weight: bold; }
        .footer { margin-top: 32px; font-size: 12px; color: #888; text-align: center; }
      </style></head><body>
      <div class="header">
        <h1>Laboratory Request Form</h1>
        <p class="meta">Request ID: ${req._id}</p>
        <p class="meta">Date: ${new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        <p class="meta">Status: ${STATUS_LABEL[req.status] || req.status}</p>
      </div>
      <p><strong>Patient:</strong> ${req.patient?.name || 'N/A'}</p>
      <p><strong>Phone:</strong> ${req.patient?.phone || 'N/A'}</p>
      <p><strong>Doctor:</strong> ${doctor?.name || 'N/A'}</p>
      ${req.notes ? `<p><strong>Notes:</strong> ${req.notes}</p>` : ''}
      ${req.tests.some(t => t.isUrgent) ? '<p class="urgent">⚠ URGENT</p>' : ''}
      <table>
        <thead><tr><th>#</th><th>Test Name</th><th>Category</th><th>Notes</th></tr></thead>
        <tbody>
          ${req.tests.map((t, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${t.testName}</td>
              <td>${t.category}</td>
              <td>${t.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">Generated by VOA EMR System</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laboratory Requests</h1>
          <p className="text-sm text-muted mt-1">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Lab Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl border border-default bg-card-bg w-fit flex-wrap">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filter === t.value ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* New Lab Request Form */}
      {showForm && (
        <div className="rounded-xl border border-default bg-card-bg p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Beaker className="w-4 h-4 text-primary" />
              New Laboratory Request
            </h2>
            <button onClick={resetForm} className="p-1 rounded-lg hover:bg-hover text-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Patient Selector */}
          <div>
            <label className="text-xs text-muted block mb-1.5">Patient *</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-lg border border-default bg-main-bg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedPatient.name}</p>
                    <p className="text-xs text-muted">{selectedPatient.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-xs text-muted hover:text-foreground transition-colors">
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={e => setPatientQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handlePatientSearch()}
                    placeholder="Search by name or phone..."
                    className="flex-1 rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handlePatientSearch}
                    disabled={patientSearching}
                    className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {patientSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
                {patientResults.length > 0 && (
                  <div className="border border-default rounded-lg divide-y divide-default max-h-40 overflow-y-auto">
                    {patientResults.map(p => (
                      <button
                        key={p._id}
                        onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientQuery(''); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-hover text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted">{p.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Selection */}
          <div>
            <label className="text-xs text-muted block mb-1.5">Tests *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {TEST_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => toggleTest(t.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left',
                    selectedTests.includes(t.value)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-default text-muted hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Custom Test */}
            <div className="mt-2">
              <input
                type="text"
                value={customTestName}
                onChange={e => setCustomTestName(e.target.value)}
                placeholder="Or type a custom test name..."
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-muted block mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Clinical notes / specific instructions for the lab..."
              className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>

          {/* Urgent Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUrgent(!urgent)}
              className={cn(
                'relative w-10 h-5 rounded-full transition-colors',
                urgent ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                urgent && 'translate-x-5'
              )} />
            </button>
            <span className={cn('text-sm font-medium', urgent ? 'text-red-500' : 'text-muted')}>
              {urgent ? 'Urgent' : 'Mark as urgent'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end pt-2 border-t border-default">
            <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-default text-sm text-muted hover:bg-hover transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Beaker className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
          <FlaskConical className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-sm text-muted">No lab requests found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Lab Request
          </button>
        </div>
      ) : (
        /* List */
        <div className="space-y-2">
          {filtered.map(req => (
            <div
              key={req._id}
              className="rounded-xl border border-default bg-card-bg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {(req.patient?.name || 'P').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{req.patient?.name || 'Unknown'}</p>
                      {req.tests.some(t => t.isUrgent) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {req.tests.map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 text-muted">
                          {t.testName}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {req.patient?.phone || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {req.tests.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-muted">
                          {req.tests.map(t => t.category).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', STATUS_BADGE[req.status] || '')}>
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                  <button
                    onClick={() => handlePrint(req)}
                    className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-foreground transition-colors"
                    title="Print lab request"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
