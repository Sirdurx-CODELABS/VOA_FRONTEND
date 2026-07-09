'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { useWorkflowStore } from '@/store/workflowStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import toast from 'react-hot-toast';
import {
  UserPlus, Search, Loader2, Clock, ChevronRight, User,
  X, MapPin, Phone, Calendar, CheckCircle, ArrowRight, AlertTriangle,
} from 'lucide-react';

export default function CheckinPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const { waitingQueue, fetchWaitingQueue, checkInPatient } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [visitType, setVisitType] = useState<'walk_in' | 'appointment' | 'emergency' | 'follow_up'>('walk_in');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { initSocketListener } = useWorkflowStore();
  const canCheckIn = hasPermission(user, PERMISSIONS.CHECK_IN_PATIENT as any);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWaitingQueue();
      initSocketListener();
      setLoading(false);
    }
  }, [isAuthenticated, fetchWaitingQueue, initSocketListener]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await clinicalService.searchPatients(searchQuery);
        setSearchResults(res.data?.data || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCheckIn = async () => {
    if (!selectedPatient) return toast.error('Select a patient');
    setSubmitting(true);
    try {
      await checkInPatient({
        patientId: selectedPatient._id,
        visitType,
        chiefComplaint: chiefComplaint || undefined,
      });
      toast.success(`${selectedPatient.name} checked in`);
      setSelectedPatient(null);
      setChiefComplaint('');
      setSearchQuery('');
      setSearchResults([]);
      fetchWaitingQueue();
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Check-in</h1>
          <p className="text-sm text-muted mt-1">Register arriving patients into the workflow</p>
        </div>
        <button onClick={() => fetchWaitingQueue()} className="text-sm text-primary hover:underline flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!canCheckIn && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have check-in permission.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Waiting Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-default bg-card-bg p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Current Queue ({waitingQueue.length})
            </h2>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>
            ) : waitingQueue.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-xs text-muted">No patients waiting</p>
              </div>
            ) : (
              <div className="divide-y divide-default max-h-[50vh] overflow-y-auto">
                {waitingQueue.map((v: any) => (
                  <div key={v._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {(v.patient?.name || '?').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{v.patient?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted">
                          {v.patient?.phone}
                          {v.patient?.age ? ` · ${v.patient.age}y` : ''}
                          {v.queueNumber ? ` · #${v.queueNumber}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        v.status === 'checked_in' ? 'bg-blue-500/10 text-blue-600' :
                        v.status === 'triaged' ? 'bg-orange-500/10 text-orange-600' :
                        'bg-muted/20 text-muted'
                      }`}>
                        {v.status?.replace(/_/g, ' ')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-default bg-card-bg p-4">
              <h2 className="text-xs font-semibold text-muted uppercase mb-3">Search Results</h2>
              <div className="divide-y divide-default max-h-64 overflow-y-auto">
                {searchResults.map((p: any) => (
                  <button key={p._id} onClick={() => { setSelectedPatient(p); setSearchResults([]); }}
                    className="w-full text-left py-3 flex items-center justify-between hover:bg-hover/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {(p.name || '?').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted">{p.phone}{p.age ? ` · ${p.age}y` : ''}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Check-in Form */}
        <div className="rounded-xl border border-default bg-card-bg p-4 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            {selectedPatient ? `Check-in: ${selectedPatient.name}` : 'New Check-in'}
          </h2>

          {!selectedPatient ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search patient by name or phone..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted" />}
              </div>
              <p className="text-xs text-muted text-center pt-4">Search for a patient to begin check-in</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedPatient.name}</p>
                    <p className="text-xs text-muted">{selectedPatient.phone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1.5">Visit Type</label>
                <select value={visitType} onChange={e => setVisitType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="walk_in">Walk-in</option>
                  <option value="appointment">Appointment</option>
                  <option value="emergency">Emergency</option>
                  <option value="follow_up">Follow-up</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1.5">Chief Complaint (optional)</label>
                <textarea value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)}
                  placeholder="Brief reason for visit..."
                  className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" rows={3}
                />
              </div>

              <button onClick={handleCheckIn} disabled={submitting}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Complete Check-in'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
