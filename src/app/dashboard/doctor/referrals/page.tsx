'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { referralService, hospitalService, patientService } from '@/services/doctorApi.service';
import { Referral } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Loader2, Plus, Search, X, ArrowRightCircle, Clock,
  CheckCircle, AlertCircle, Ban, Building2, User, Stethoscope,
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Completed', value: 'completed' },
  { label: 'Declined', value: 'declined' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  accepted: 'bg-blue-500/10 text-blue-600',
  completed: 'bg-green-500/10 text-green-600',
  declined: 'bg-red-500/10 text-red-600',
};

const PRIORITY_BADGE: Record<string, string> = {
  routine: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
  urgent: 'bg-orange-500/10 text-orange-600',
  emergency: 'bg-red-500/10 text-red-600',
};

export default function ReferralsPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<{ _id: string; name: string; phone: string }[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ _id: string; name: string; phone: string } | null>(null);

  const [hospitals, setHospitals] = useState<{ _id: string; name: string; state: string; lga: string }[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [attachSummary, setAttachSummary] = useState(false);
  const [attachAiSummary, setAttachAiSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await referralService.getAll();
        setReferrals(res.data.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!showForm) return;
    const loadHospitals = async () => {
      try {
        const res = await hospitalService.getAll();
        setHospitals(res.data.data || []);
      } catch { /* ignore */ }
    };
    loadHospitals();
  }, [showForm]);

  const filtered = filter
    ? referrals.filter(r => r.status === filter)
    : referrals;

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

  const resetForm = () => {
    setPatientQuery('');
    setPatientResults([]);
    setSelectedPatient(null);
    setSelectedHospital('');
    setReason('');
    setPriority('routine');
    setAttachSummary(false);
    setAttachAiSummary(false);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!selectedPatient) { toast.error('Select a patient'); return; }
    if (!selectedHospital) { toast.error('Select a target hospital'); return; }
    if (!reason.trim()) { toast.error('Enter a reason for referral'); return; }

    setSubmitting(true);
    try {
      await referralService.create({
        patient: selectedPatient._id as unknown as Referral['patient'],
        toHospital: selectedHospital as unknown as Referral['toHospital'],
        reason: reason.trim(),
        priority,
        consultationSummary: attachSummary ? '' : undefined,
        aiSummary: attachAiSummary ? '' : undefined,
      } as Partial<Referral>);
      toast.success('Referral created');
      const res = await referralService.getAll();
      setReferrals(res.data.data || []);
      resetForm();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create referral';
      toast.error(msg);
    }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Referrals</h1>
          <p className="text-sm text-muted mt-1">{filtered.length} referral{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Referral
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

      {/* New Referral Form */}
      {showForm && (
        <div className="rounded-xl border border-default bg-card-bg p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ArrowRightCircle className="w-4 h-4 text-primary" />
              New Referral
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

          {/* Target Hospital Selector */}
          <div>
            <label className="text-xs text-muted block mb-1.5">Target Hospital *</label>
            <select
              value={selectedHospital}
              onChange={e => setSelectedHospital(e.target.value)}
              className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a hospital...</option>
              {hospitals.map(h => (
                <option key={h._id} value={h._id}>
                  {h.name} — {h.state}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs text-muted block mb-1.5">Reason for Referral *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Clinical reason for this referral..."
              className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs text-muted block mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(['routine', 'urgent', 'emergency'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all capitalize',
                    priority === p
                      ? cn('border-primary bg-primary/10 text-primary')
                      : 'border-default text-muted hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <label className="text-xs text-muted block mb-1.5">Attachments</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attachSummary}
                onChange={e => setAttachSummary(e.target.checked)}
                className="w-4 h-4 rounded border-default text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-foreground">Attach Consultation Summary</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={attachAiSummary}
                onChange={e => setAttachAiSummary(e.target.checked)}
                className="w-4 h-4 rounded border-default text-primary focus:ring-primary/30"
              />
              <span className="text-sm text-foreground">Attach AI Summary</span>
            </label>
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Create Referral'}
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
          <ArrowRightCircle className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-sm text-muted">No referrals found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Referral
          </button>
        </div>
      ) : (
        /* List */
        <div className="space-y-2">
          {filtered.map(ref => (
            <div
              key={ref._id}
              className="rounded-xl border border-default bg-card-bg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {(ref.patient?.name || 'P').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{ref.patient?.name || 'Unknown'}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', PRIORITY_BADGE[ref.priority])}>
                        {ref.priority === 'emergency' && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                        {ref.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ref.toHospital?.name || 'Unknown Hospital'}</span>
                    </div>
                    {ref.reason && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{ref.reason}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ref.patient?.phone || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ref.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {ref.fromDoctor?.name && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          {ref.fromDoctor.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', STATUS_BADGE[ref.status] || '')}>
                  {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
