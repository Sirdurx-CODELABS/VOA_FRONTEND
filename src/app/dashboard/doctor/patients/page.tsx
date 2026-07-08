'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { patientService, consultationService, prescriptionService, labService } from '@/services/doctorApi.service';
import { PatientProfile, Consultation, Prescription, LabRequest, Vitals } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Search, User, Hash, FileText, ChevronRight, X,
  Loader2, Users, Activity, Heart, Stethoscope, Beaker,
  ClipboardCheck, Eye, ChevronLeft, Droplets, Weight, Thermometer,
  Gauge, Pill, FileCheck,
} from 'lucide-react';

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [detailData, setDetailData] = useState<{
    consultations: Consultation[];
    prescriptions: Prescription[];
    labResults: LabRequest[];
  }>({ consultations: [], prescriptions: [], labResults: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchRecent = async () => {
      try {
        const res = await patientService.search('');
        setPatients(res.data.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchRecent();
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!isAuthenticated) return;
    if (!query.trim()) {
      const fetchRecent = async () => {
        try {
          const res = await patientService.search('');
          setPatients(res.data.data || []);
        } catch { /* ignore */ }
        setSearching(false);
      };
      fetchRecent();
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await patientService.search(query.trim());
        setPatients(res.data.data || []);
      } catch {
        toast.error('Search failed');
      }
      setSearching(false);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, isAuthenticated]);

  const fetchPatientDetail = useCallback(async (patient: PatientProfile) => {
    setDetailLoading(true);
    try {
      const [consRes, rxRes, labRes] = await Promise.allSettled([
        consultationService.getByPatient(patient._id),
        prescriptionService.getAll(patient._id),
        labService.getAll(patient._id),
      ]);
      setDetailData({
        consultations: consRes.status === 'fulfilled' ? consRes.value.data.data || [] : [],
        prescriptions: rxRes.status === 'fulfilled' ? rxRes.value.data.data || [] : [],
        labResults: labRes.status === 'fulfilled' ? labRes.value.data.data || [] : [],
      });
    } catch { /* ignore */ }
    setDetailLoading(false);
  }, []);

  const openDetail = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    fetchPatientDetail(patient);
  };

  const closeDetail = () => {
    setSelectedPatient(null);
    setDetailData({ consultations: [], prescriptions: [], labResults: [] });
  };

  const viewConsultation = (id: string) => {
    router.push(`/dashboard/doctor/consultations/${id}`);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted mt-1">
            Search and manage patient records
          </p>
        </div>
        <div className="text-sm text-muted flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, ART number, or file number..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-default bg-card-bg text-foreground text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin" />
        )}
        {query && !searching && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Patients Table / List */}
      <div className="rounded-xl border border-default bg-card-bg overflow-hidden">
        {loading ? (
          <div className="p-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-default" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-default rounded w-1/4" />
                  <div className="h-2.5 bg-default rounded w-1/6" />
                </div>
                <div className="h-3 bg-default rounded w-16" />
                <div className="h-3 bg-default rounded w-12" />
                <div className="h-3 bg-default rounded w-20" />
                <div className="h-3 bg-default rounded w-16" />
                <div className="h-3 bg-default rounded w-24" />
                <div className="w-8 h-8 rounded-lg bg-default" />
              </div>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-default flex items-center justify-center">
              <Users className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No patients found</h3>
            <p className="text-sm text-muted max-w-xs mx-auto">
              {query ? 'Try adjusting your search query' : 'No patient records available yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {selectedPatient && (
              <div className="lg:hidden flex items-center justify-between p-3 border-b border-default bg-hover">
                <button onClick={closeDetail} className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <ChevronLeft className="w-4 h-4" /> Back to list
                </button>
                <span className="text-sm font-medium text-foreground truncate">{selectedPatient.name}</span>
              </div>
            )}
            <div className="flex flex-col lg:flex-row">
              {/* Table */}
              <div className={cn(
                'min-w-0 flex-1 transition-all duration-300',
                selectedPatient && 'hidden lg:block'
              )}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-default">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Age</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Gender</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">ART#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">File#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Last Visit</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, i) => (
                      <tr
                        key={p._id}
                        onClick={() => openDetail(p)}
                        className={cn(
                          'border-b border-default/50 transition-colors cursor-pointer',
                          i % 2 === 0 ? 'bg-transparent' : 'bg-hover/30',
                          'hover:bg-hover',
                          selectedPatient?._id === p._id && 'bg-primary/5'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-foreground truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{p.phone || '—'}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">{p.age ?? '—'}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">
                          {p.gender ? (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              p.gender.toLowerCase() === 'male' ? 'bg-blue-500/10 text-blue-600' :
                              p.gender.toLowerCase() === 'female' ? 'bg-pink-500/10 text-pink-600' :
                              'bg-default text-muted'
                            )}>
                              {p.gender}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap font-mono text-xs">{p.artNumber || '—'}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap font-mono text-xs">{p.fileNumber || '—'}</td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap text-xs">
                          {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => { e.stopPropagation(); openDetail(p); }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            View <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Detail Panel */}
              {selectedPatient && (
                <div className={cn(
                  'w-full lg:w-[480px] xl:w-[560px] border-t lg:border-t-0 lg:border-l border-default overflow-y-auto',
                  'max-h-[80vh] lg:max-h-none'
                )}>
                  <div className="hidden lg:flex items-center justify-between p-3 border-b border-default bg-hover sticky top-0 z-10">
                    <h2 className="text-sm font-semibold text-foreground">Patient Details</h2>
                    <button onClick={closeDetail} className="text-muted hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {detailLoading ? (
                    <div className="p-8 space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="h-3 bg-default rounded w-1/3" />
                          <div className="h-8 bg-default rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-default">
                      {/* Personal Details */}
                      <DetailSection icon={User} title="Personal Details">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <DetailItem label="Name" value={selectedPatient.name} />
                          <DetailItem label="Phone" value={selectedPatient.phone} />
                          <DetailItem label="Age" value={selectedPatient.age?.toString()} />
                          <DetailItem label="Gender" value={selectedPatient.gender} />
                          {selectedPatient.state && <DetailItem label="State" value={selectedPatient.state} />}
                          {selectedPatient.lga && <DetailItem label="LGA" value={selectedPatient.lga} />}
                        </div>
                      </DetailSection>

                      {/* IDs */}
                      <DetailSection icon={Hash} title="Identifiers">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <DetailItem label="ART Number" value={selectedPatient.artNumber} />
                          <DetailItem label="File Number" value={selectedPatient.fileNumber} />
                        </div>
                      </DetailSection>

                      {/* Vitals */}
                      <DetailSection icon={Activity} title="Vitals">
                        {selectedPatient.vitals ? (
                          <VitalsDisplay vitals={selectedPatient.vitals} />
                        ) : (
                          <p className="text-xs text-muted">No vitals recorded</p>
                        )}
                      </DetailSection>

                      {/* Diagnosis */}
                      <DetailSection icon={Stethoscope} title="Diagnosis">
                        {selectedPatient.diagnosis ? (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(selectedPatient.diagnosis).map(([key, val]) => {
                              if (!val || typeof val !== 'boolean') return null;
                              const labels: Record<string, string> = {
                                hiv: 'HIV', tb: 'TB', oi: 'Opportunistic Infection',
                                hypertension: 'Hypertension', diabetes: 'Diabetes',
                              };
                              return (
                                <span key={key} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-medium">
                                  {labels[key] || key}
                                </span>
                              );
                            })}
                            {!Object.values(selectedPatient.diagnosis).some(v => v === true) && (
                              <span className="text-xs text-muted">No diagnoses recorded</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted">No diagnoses recorded</p>
                        )}
                      </DetailSection>

                      {/* Current ART */}
                      <DetailSection icon={Pill} title="Current ART">
                        {selectedPatient.currentDrugs ? (
                          <p className="text-sm text-foreground">{selectedPatient.currentDrugs}</p>
                        ) : (
                          <p className="text-xs text-muted">Not on ART / No data</p>
                        )}
                      </DetailSection>

                      {/* Consultations History */}
                      <DetailSection icon={ClipboardCheck} title="Consultations History">
                        {detailData.consultations.length === 0 ? (
                          <p className="text-xs text-muted">No consultation history</p>
                        ) : (
                          <div className="space-y-2">
                            {detailData.consultations.slice(0, 5).map(c => (
                              <button
                                key={c._id}
                                onClick={() => viewConsultation(c._id)}
                                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-hover/50 hover:bg-hover transition-colors text-left"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {c.type === 'online' ? 'Online' : 'In-person'} Consultation
                                  </p>
                                  <p className="text-xs text-muted">
                                    {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                                    c.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                                    c.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
                                    c.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                                    'bg-yellow-500/10 text-yellow-600'
                                  )}>
                                    {c.status.replace(/_/g, ' ')}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-muted" />
                                </div>
                              </button>
                            ))}
                            {detailData.consultations.length > 5 && (
                              <p className="text-xs text-primary text-center pt-1">
                                +{detailData.consultations.length - 5} more
                              </p>
                            )}
                          </div>
                        )}
                      </DetailSection>

                      {/* Recent Prescriptions */}
                      <DetailSection icon={FileText} title="Recent Prescriptions">
                        {detailData.prescriptions.length === 0 ? (
                          <p className="text-xs text-muted">No prescriptions</p>
                        ) : (
                          <div className="space-y-2">
                            {detailData.prescriptions.slice(0, 3).map(rx => (
                              <div key={rx._id} className="p-2.5 rounded-lg bg-hover/50">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {rx.medications.length} medication{rx.medications.length !== 1 ? 's' : ''}
                                  </p>
                                  <span className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                                    rx.status === 'active' ? 'bg-green-500/10 text-green-600' :
                                    rx.status === 'completed' ? 'bg-blue-500/10 text-blue-600' :
                                    rx.status === 'draft' ? 'bg-yellow-500/10 text-yellow-600' :
                                    'bg-default text-muted'
                                  )}>
                                    {rx.status}
                                  </span>
                                </div>
                                <p className="text-xs text-muted">
                                  {new Date(rx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            ))}
                            {detailData.prescriptions.length > 3 && (
                              <p className="text-xs text-primary text-center pt-1">
                                +{detailData.prescriptions.length - 3} more
                              </p>
                            )}
                          </div>
                        )}
                      </DetailSection>

                      {/* Lab Results */}
                      <DetailSection icon={Beaker} title="Lab Results">
                        {detailData.labResults.length === 0 ? (
                          <p className="text-xs text-muted">No lab results</p>
                        ) : (
                          <div className="space-y-2">
                            {detailData.labResults.slice(0, 3).map(lab => (
                              <div key={lab._id} className="p-2.5 rounded-lg bg-hover/50">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-foreground">
                                    {lab.tests.length} test{lab.tests.length !== 1 ? 's' : ''}
                                  </p>
                                  <span className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                                    lab.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                                    lab.status === 'processing' ? 'bg-blue-500/10 text-blue-600' :
                                    lab.status === 'sample_collected' ? 'bg-purple-500/10 text-purple-600' :
                                    lab.status === 'requested' ? 'bg-yellow-500/10 text-yellow-600' :
                                    'bg-default text-muted'
                                  )}>
                                    {lab.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <p className="text-xs text-muted">
                                  {new Date(lab.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            ))}
                            {detailData.labResults.length > 3 && (
                              <p className="text-xs text-primary text-center pt-1">
                                +{detailData.labResults.length - 3} more
                              </p>
                            )}
                          </div>
                        )}
                      </DetailSection>

                      {/* Consent History */}
                      <DetailSection icon={FileCheck} title="Consent">
                        <div className="flex items-center gap-2 text-sm">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            selectedPatient.consentStatus ? 'bg-green-500' : 'bg-red-400'
                          )} />
                          <span className="text-foreground">
                            {selectedPatient.consentStatus ? 'Consent granted' : 'No consent'}
                          </span>
                        </div>
                      </DetailSection>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailSection({ icon: Icon, title, children }: { icon: React.FC<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm text-foreground font-medium">{value}</p>
    </div>
  );
}

function VitalsDisplay({ vitals }: { vitals: Vitals }) {
  const items = [
    { label: 'BP', icon: Gauge, value: vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic
      ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg` : null },
    { label: 'Pulse', icon: Heart, value: vitals.pulse ? `${vitals.pulse} bpm` : null },
    { label: 'Temp', icon: Thermometer, value: vitals.temperature ? `${vitals.temperature}°C` : null },
    { label: 'Weight', icon: Weight, value: vitals.weight ? `${vitals.weight} kg` : null },
    { label: 'Height', icon: Droplets, value: vitals.height ? `${vitals.height} cm` : null },
    { label: 'Resp', icon: Activity, value: vitals.respiration ? `${vitals.respiration}/min` : null },
  ];
  const visible = items.filter(i => i.value);
  if (visible.length === 0) return <p className="text-xs text-muted">No vitals recorded</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {visible.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-hover/50">
            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted">{item.label}</p>
              <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
