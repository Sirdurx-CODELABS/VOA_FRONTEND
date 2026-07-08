'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { patientService, medicalRecordService } from '@/services/doctorApi.service';
import { MedicalRecord, PatientProfile } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Loader2, Search, Stethoscope, Pill, FlaskRoundIcon as Flask,
  ArrowRightFromLine, Bot, FileText, Building, ShieldAlert,
  Calendar, Clock, User, ChevronRight, Activity,
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.FC<{ className?: string }>; label: string; color: string; bg: string }> = {
  consultation:    { icon: Stethoscope,       label: 'Consultation',    color: 'text-blue-600',     bg: 'bg-blue-500/10' },
  prescription:   { icon: Pill,              label: 'Prescription',    color: 'text-emerald-600',  bg: 'bg-emerald-500/10' },
  lab_result:     { icon: Flask,             label: 'Lab Result',      color: 'text-purple-600',   bg: 'bg-purple-500/10' },
  referral:       { icon: ArrowRightFromLine, label: 'Referral',       color: 'text-orange-600',   bg: 'bg-orange-500/10' },
  ai_summary:     { icon: Bot,               label: 'AI Summary',      color: 'text-cyan-600',     bg: 'bg-cyan-500/10' },
  doctor_note:    { icon: FileText,          label: 'Doctor Note',     color: 'text-gray-600',     bg: 'bg-gray-500/10' },
  hospital_visit: { icon: Building,          label: 'Hospital Visit',  color: 'text-rose-600',     bg: 'bg-rose-500/10' },
  risk_assessment:{ icon: ShieldAlert,       label: 'Risk Assessment', color: 'text-red-600',      bg: 'bg-red-500/10' },
};

interface GroupedRecords {
  date: string;
  entries: MedicalRecord[];
}

export default function MedicalRecordsPage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  const fetchPatients = useCallback(async (q: string) => {
    if (!q.trim()) { setPatients([]); setPatientsLoading(false); return; }
    setPatientsLoading(true);
    try {
      const res = await patientService.search(q);
      setPatients(res.data.data || []);
    } catch { setPatients([]); }
    setPatientsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => fetchPatients(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPatients, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedPatient) return;
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await medicalRecordService.getByPatient(selectedPatient._id);
        setRecords(res.data.data || []);
      } catch {
        toast.error('Failed to load medical records');
        setRecords([]);
      }
      setLoading(false);
    };
    fetchRecords();
  }, [isAuthenticated, selectedPatient]);

  if (!_hydrated || !isAuthenticated) return null;

  const grouped: GroupedRecords[] = records
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .reduce<GroupedRecords[]>((acc, r) => {
      const dateKey = new Date(r.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const existing = acc.find(g => g.date === dateKey);
      if (existing) existing.entries.push(r);
      else acc.push({ date: dateKey, entries: [r] });
      return acc;
    }, []);

  return (
    <div className="flex gap-6 h-[calc(100vh-6rem)]">
      {/* Sidebar – Patient Selector */}
      <div className="w-80 shrink-0 rounded-xl border border-default bg-card-bg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-default">
          <h2 className="text-sm font-semibold text-foreground mb-2">Patients</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-full rounded-lg border border-default bg-main-bg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {searchQuery && patientsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted" />
            </div>
          ) : !searchQuery.trim() ? (
            <p className="text-xs text-muted text-center py-8">Type to search patients</p>
          ) : patients.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No patients found</p>
          ) : (
            patients.map(p => (
              <button
                key={p._id}
                onClick={() => { setSelectedPatient(p); setSearchQuery(''); }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  selectedPatient?._id === p._id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-hover text-foreground'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted truncate">{p.phone}{p.age ? ` · ${p.age}yrs` : ''}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main – Timeline */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {!selectedPatient ? (
          <div className="rounded-xl border border-default bg-card-bg p-16 text-center">
            <Activity className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Select a Patient</h3>
            <p className="text-sm text-muted">Search and select a patient from the sidebar to view their medical records timeline.</p>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-default bg-card-bg p-5 space-y-3">
                <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl border border-default bg-card-bg p-16 text-center">
            <FileText className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Medical Records</h3>
            <p className="text-sm text-muted">No records found for {selectedPatient.name}.</p>
          </div>
        ) : (
          <>
            {/* Patient Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg font-bold">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{selectedPatient.name}</h1>
                <p className="text-sm text-muted">
                  {selectedPatient.phone}
                  {selectedPatient.age && ` · ${selectedPatient.age} years`}
                  {selectedPatient.gender && ` · ${selectedPatient.gender}`}
                  {selectedPatient.riskScore && (
                    <span className={cn(
                      'ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                      selectedPatient.riskScore === 'critical' ? 'bg-red-500/10 text-red-600' :
                      selectedPatient.riskScore === 'high' ? 'bg-orange-500/10 text-orange-600' :
                      selectedPatient.riskScore === 'moderate' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-green-500/10 text-green-600'
                    )}>
                      {selectedPatient.riskScore}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-8 before:absolute before:left-[17px] before:top-0 before:bottom-0 before:w-[2px] before:bg-border">
              {grouped.map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-muted" />
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">{group.date}</span>
                  </div>
                  <div className="space-y-3 ml-2">
                    {group.entries.map(record => {
                      const config = TYPE_CONFIG[record.type] || TYPE_CONFIG.doctor_note;
                      const Icon = config.icon;
                      return (
                        <div
                          key={record._id}
                          className="relative rounded-xl border border-default bg-card-bg p-4 hover:border-primary/20 transition-all ml-6 before:absolute before:-left-[26px] before:top-5 before:w-2.5 before:h-2.5 before:rounded-full before:border-2 before:border-border before:bg-card-bg"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', config.bg)}>
                                <Icon className={cn('w-4 h-4', config.color)} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', config.bg, config.color)}>
                                    {config.label}
                                  </span>
                                  {record.doctor?.name && (
                                    <span className="text-xs text-muted flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      Dr. {record.doctor.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-foreground mt-1">{record.title}</p>
                                {record.description && (
                                  <p className="text-xs text-muted mt-1 line-clamp-3">{record.description}</p>
                                )}
                                {record.hospital?.name && (
                                  <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {record.hospital.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted shrink-0">
                              <Clock className="w-3 h-3" />
                              {new Date(record.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
