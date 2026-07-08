'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService, referenceService } from '@/services/doctorApi.service';
import toast from 'react-hot-toast';
import {
  Loader2, ToggleLeft, ToggleRight, DollarSign, User, Award,
  BookOpen, Globe, Camera, Save, Plus, Trash2, Pencil,
} from 'lucide-react';

export default function DoctorSettingsPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated, updateDoctor } = useDoctorAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [newService, setNewService] = useState({ name: '', description: '', price: 0 });
  const [editing, setEditing] = useState(false);

  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', specialization: '', department: '',
    state: '', lga: '', qualification: '', biography: '',
  });

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (doctor) {
      setForm({
        name: doctor.name || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        specialization: doctor.specialization || '',
        department: (doctor as { department?: string }).department || '',
        state: doctor.state || '',
        lga: doctor.lga || '',
        qualification: (doctor as { qualification?: string }).qualification || '',
        biography: (doctor as { biography?: string }).biography || '',
      });
    }
  }, [doctor]);

  useEffect(() => {
    referenceService.getStates().then(r => setStates(r.data.data)).catch(() => {});
    referenceService.getSpecializations().then(r => setSpecializations(r.data.data)).catch(() => {});
    referenceService.getDepartments().then(r => setDepartments(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.state) {
      referenceService.getLGAs(form.state).then(r => setLgas(r.data.data)).catch(() => setLgas([]));
    } else {
      setLgas([]);
    }
  }, [form.state]);

  const handleToggleAvailability = async () => {
    if (!doctor) return;
    setLoading(true);
    try {
      const newVal = !doctor.isAvailable;
      const res = await doctorService.toggleAvailability(doctor._id, newVal);
      updateDoctor({ isAvailable: res.data.data.isAvailable });
      toast.success(`You are now ${newVal ? 'available' : 'unavailable'}`);
    } catch {
      toast.error('Failed to update');
    }
    setLoading(false);
  };

  const addLanguage = () => {
    if (!newLanguage.trim() || !doctor) return;
    const updated = [...(doctor.languages || []), newLanguage.trim()];
    updateDoctor({ languages: updated });
    setNewLanguage('');
  };

  const removeLanguage = (idx: number) => {
    if (!doctor) return;
    updateDoctor({ languages: doctor.languages.filter((_, i) => i !== idx) });
  };

  const addService = () => {
    if (!newService.name || !doctor) return;
    const updated = [...(doctor.services || []), { ...newService }];
    updateDoctor({ services: updated });
    setNewService({ name: '', description: '', price: 0 });
  };

  const removeService = (idx: number) => {
    if (!doctor) return;
    updateDoctor({ services: doctor.services.filter((_, i) => i !== idx) });
  };

  const saveAll = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      await doctorService.updateProfile(doctor._id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        specialization: form.specialization,
        department: form.department,
        state: form.state,
        lga: form.lga,
        qualification: form.qualification,
        biography: form.biography,
        languages: doctor.languages,
        consultationFee: doctor.consultationFee,
        services: doctor.services,
      });
      updateDoctor({
        name: form.name, phone: form.phone, email: form.email,
        specialization: form.specialization, state: form.state, lga: form.lga,
      });
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (!_hydrated || !isAuthenticated || !doctor) return null;

  const selectClass = 'rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
          <p className="text-sm text-muted mt-1">Manage your professional profile</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-default hover:bg-main-bg text-sm font-medium transition-colors">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : (
            <>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-default hover:bg-main-bg text-sm font-medium transition-colors">
                Cancel
              </button>
              <button onClick={saveAll} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Availability Status</h2>
            <p className="text-xs text-muted mt-1">
              {doctor.isAvailable ? 'Accepting new consultations' : 'Not accepting consultations'}
            </p>
          </div>
          <button onClick={handleToggleAvailability} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-default hover:bg-main-bg text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
              doctor.isAvailable ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-muted" />}
            {doctor.isAvailable ? 'Available' : 'Unavailable'}
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Profile Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs text-muted mb-1">Full Name</label>
            {editing ? (
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={selectClass} />
            ) : (
              <p className="font-medium text-foreground">{doctor.name}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Phone</label>
            {editing ? (
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className={selectClass} />
            ) : (
              <p className="font-medium text-foreground">{doctor.phone}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            {editing ? (
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className={selectClass} />
            ) : (
              <p className="font-medium text-foreground">{doctor.email || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Specialization</label>
            {editing ? (
              <select value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}
                className={selectClass}>
                <option value="">Select specialization</option>
                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <p className="font-medium text-foreground">{doctor.specialization || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Department</label>
            {editing ? (
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className={selectClass}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <p className="font-medium text-foreground">{(doctor as { department?: string }).department || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Qualification</label>
            {editing ? (
              <input value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))}
                className={selectClass} placeholder="e.g. MBBS, MD, FWACS" />
            ) : (
              <p className="font-medium text-foreground">{(doctor as { qualification?: string }).qualification || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">State</label>
            {editing ? (
              <select value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
                className={selectClass}>
                <option value="">Select state</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <p className="font-medium text-foreground">{doctor.state || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">LGA</label>
            {editing ? (
              <select value={form.lga} onChange={e => setForm(p => ({ ...p, lga: e.target.value }))}
                className={selectClass} disabled={!form.state}>
                <option value="">{!form.state ? 'Select state first' : 'Select LGA'}</option>
                {lgas.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (
              <p className="font-medium text-foreground">{doctor.lga || 'Not set'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Years of Experience</label>
            <p className="font-medium text-foreground">{doctor.yearsOfExperience || 0} years</p>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Medical License</label>
            <p className="font-medium text-foreground">{doctor.medicalLicense}</p>
          </div>
        </div>
        {editing && (
          <div className="mt-4">
            <label className="block text-xs text-muted mb-1">Biography</label>
            <textarea value={form.biography} onChange={e => setForm(p => ({ ...p, biography: e.target.value }))}
              rows={3} placeholder="Brief professional biography..."
              className="rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-full" />
          </div>
        )}
      </div>

      {/* Languages */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Languages
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {(doctor.languages || []).map((lang, i) => (
            <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {lang}
              <button onClick={() => removeLanguage(i)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newLanguage} onChange={e => setNewLanguage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLanguage()} placeholder="Add language..."
            className="flex-1 rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={addLanguage}
            className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Consultation Fee */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Base Consultation Fee
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₦</span>
            <input type="number" value={doctor.consultationFee}
              onChange={e => updateDoctor({ consultationFee: parseInt(e.target.value) || 0 })}
              className="w-40 rounded-lg border border-default bg-main-bg pl-8 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <span className="text-xs text-muted">per consultation</span>
        </div>
      </div>

      {/* Services */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Services & Pricing
        </h2>
        {(doctor.services || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {doctor.services.map((svc, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-main-bg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{svc.name}</p>
                  {svc.description && <p className="text-xs text-muted">{svc.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">₦{svc.price.toLocaleString()}</span>
                  <button onClick={() => removeService(i)}
                    className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input type="text" value={newService.name} onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
            placeholder="Service name"
            className="rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="text" value={newService.description} onChange={e => setNewService(p => ({ ...p, description: e.target.value }))}
            placeholder="Description"
            className="rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="number" value={newService.price || ''} onChange={e => setNewService(p => ({ ...p, price: parseInt(e.target.value) || 0 }))}
            placeholder="Price (₦)"
            className="rounded-lg border border-default bg-main-bg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={addService}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Schedule Summary */}
      {doctor.schedule && doctor.schedule.length > 0 && (
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Weekly Schedule</h2>
          <div className="space-y-2 text-sm">
            {doctor.schedule.map((day, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-default last:border-0">
                <span className="font-medium capitalize text-foreground">{day.day}</span>
                {day.isAvailable ? (
                  <span className="text-xs text-green-600">{day.startTime} - {day.endTime} ({day.type || 'both'})</span>
                ) : (
                  <span className="text-xs text-muted">Unavailable</span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <a href="/dashboard/doctor/schedule" className="text-xs text-primary hover:underline">Edit Schedule →</a>
          </div>
        </div>
      )}
    </div>
  );
}
