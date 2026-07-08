'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { patientService, consultationService } from '@/services/doctorApi.service';
import toast from 'react-hot-toast';
import {
  Loader2, UserPlus, Search, Stethoscope, FileText, ChevronDown, Activity,
} from 'lucide-react';

interface FormData {
  name: string; phone: string; age: string; gender: string;
  state: string; lga: string; hospital: string;
  weight: string; height: string; temperature: string;
  bloodPressureSystolic: string; bloodPressureDiastolic: string;
  pulse: string; respiration: string;
  diagnosis: string; chiefComplaint: string; history: string;
  currentMedication: string; allergies: string;
  artNumber: string; fileNumber: string;
}

const emptyForm: FormData = {
  name: '', phone: '', age: '', gender: 'male',
  state: '', lga: '', hospital: '',
  weight: '', height: '', temperature: '',
  bloodPressureSystolic: '', bloodPressureDiastolic: '',
  pulse: '', respiration: '',
  diagnosis: '', chiefComplaint: '', history: '',
  currentMedication: '', allergies: '',
  artNumber: '', fileNumber: '',
};

export default function WalkInConsultationPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ _id: string; name: string; phone: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [foundPatient, setFoundPatient] = useState<{ _id: string; name: string; phone: string } | null>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
  }, [isAuthenticated]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await patientService.search(searchQuery);
      setSearchResults(res.data.data || []);
    } catch {
      try {
        const res = await patientService.getByPhone(searchQuery);
        setSearchResults([{ _id: res.data.data._id, name: res.data.data.name, phone: res.data.data.phone }]);
      } catch {
        setSearchResults([]);
      }
    }
    setSearching(false);
  };

  const selectPatient = (p: { _id: string; name: string; phone: string }) => {
    setFoundPatient(p);
    setForm(prev => ({ ...prev, name: p.name, phone: p.phone }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const updateField = (field: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast.error('Patient name and phone are required');
      return;
    }
    setSubmitting(true);
    try {
      let patientId = foundPatient?._id;

      if (!patientId) {
        const regRes = await patientService.register({
          name: form.name,
          phone: form.phone,
          age: form.age ? parseInt(form.age) : undefined,
          gender: form.gender as 'male' | 'female' | 'other',
          state: form.state,
          lga: form.lga,
          artNumber: form.artNumber,
          fileNumber: form.fileNumber,
        });
        patientId = regRes.data.data._id;
      }

      if (patientId) {
        const consRes = await consultationService.accept(patientId);
        toast.success('Walk-in consultation created');
        router.push(`/dashboard/doctor/consultations/${consRes.data.data._id}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create consultation';
      toast.error(msg);
    }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated || !doctor) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Walk-in Consultation</h1>
        <p className="text-sm text-muted mt-1">Register a walk-in patient and start a consultation</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s)}
              className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                step === s ? 'bg-primary text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-muted'
              }`}
            >
              {step > s ? '✓' : s}
            </button>
            <span className={`text-xs ${step === s ? 'text-foreground font-medium' : 'text-muted'}`}>
              {s === 1 ? 'Search / Patient' : s === 2 ? 'Vitals' : 'Review & Submit'}
            </span>
            {s < 3 && <ChevronDown className="w-3 h-3 text-muted -rotate-90" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          {/* Search existing */}
          <div className="rounded-xl border border-default bg-card-bg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Search Existing Patient
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, phone, ART number, or file number..."
                className="flex-1 rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-3 space-y-1">
                {searchResults.map(p => (
                  <button
                    key={p._id}
                    onClick={() => selectPatient(p)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-hover text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted">{p.phone}</p>
                    </div>
                    {foundPatient?._id === p._id && (
                      <span className="ml-auto text-xs text-green-500 font-medium">Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Patient Form */}
          <div className="rounded-xl border border-default bg-card-bg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              {foundPatient ? 'Patient Found — Update Details' : 'New Patient Details'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted block mb-1">Full Name *</label>
                <input
                  type="text" value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Patient name"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Phone *</label>
                <input
                  type="text" value={form.phone}
                  onChange={e => updateField('phone', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Age</label>
                <input
                  type="number" value={form.age}
                  onChange={e => updateField('age', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Age"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => updateField('gender', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">State</label>
                <input
                  type="text" value={form.state}
                  onChange={e => updateField('state', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">LGA</label>
                <input
                  type="text" value={form.lga}
                  onChange={e => updateField('lga', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="LGA"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">ART Number</label>
                <input
                  type="text" value={form.artNumber}
                  onChange={e => updateField('artNumber', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="ART number"
                />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">File Number</label>
                <input
                  type="text" value={form.fileNumber}
                  onChange={e => updateField('fileNumber', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="File number"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Next: Vitals →
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Vital Signs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={e => updateField('weight', e.target.value)}
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Height (cm)</label>
              <input type="number" value={form.height} onChange={e => updateField('height', e.target.value)}
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Temperature (°C)</label>
              <input type="number" step="0.1" value={form.temperature} onChange={e => updateField('temperature', e.target.value)}
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Pulse (bpm)</label>
              <input type="number" value={form.pulse} onChange={e => updateField('pulse', e.target.value)}
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Systolic BP</label>
              <input type="number" value={form.bloodPressureSystolic} onChange={e => updateField('bloodPressureSystolic', e.target.value)}
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="120" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Diastolic BP</label>
              <input type="number" value={form.bloodPressureDiastolic} onChange={e => updateField('bloodPressureDiastolic', e.target.value)}
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="80" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Respiration</label>
              <input type="number" value={form.respiration} onChange={e => updateField('respiration', e.target.value)}
                className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-default text-sm text-muted hover:bg-hover transition-colors">
              ← Back
            </button>
            <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
              Next: Clinical Info →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-default bg-card-bg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Clinical Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted block mb-1">Chief Complaint</label>
                <textarea value={form.chiefComplaint} onChange={e => updateField('chiefComplaint', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-y"
                  placeholder="Patient's main reason for visit" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">History</label>
                <textarea value={form.history} onChange={e => updateField('history', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-y"
                  placeholder="History of present illness" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Current Medication</label>
                <textarea value={form.currentMedication} onChange={e => updateField('currentMedication', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px] resize-y"
                  placeholder="Current medications" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Allergies</label>
                <textarea value={form.allergies} onChange={e => updateField('allergies', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px] resize-y"
                  placeholder="Known allergies" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Diagnosis</label>
                <textarea value={form.diagnosis} onChange={e => updateField('diagnosis', e.target.value)}
                  className="w-full rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-y"
                  placeholder="Preliminary diagnosis" />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-default bg-card-bg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Summary
            </h2>
            <div className="text-xs text-muted space-y-1">
              <p>Patient: <span className="font-medium text-foreground">{form.name || '—'}</span></p>
              <p>Phone: <span className="font-medium text-foreground">{form.phone || '—'}</span></p>
              <p>Type: <span className="font-medium text-foreground">Walk-in (In-person)</span></p>
              {form.chiefComplaint && <p>Complaint: <span className="font-medium text-foreground">{form.chiefComplaint}</span></p>}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-default text-sm text-muted hover:bg-hover transition-colors">
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.name || !form.phone}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stethoscope className="w-4 h-4" />}
              {submitting ? 'Creating...' : 'Start Consultation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
