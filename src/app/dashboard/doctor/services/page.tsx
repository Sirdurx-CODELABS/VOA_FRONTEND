'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService } from '@/services/doctorApi.service';
import { DoctorService } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Loader2, Plus, Save, Pencil, Trash2, X, DollarSign, Stethoscope,
} from 'lucide-react';

const emptyService = (): DoctorService => ({ name: '', description: '', price: 0 });

export default function DoctorServicesPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated, updateDoctor } = useDoctorAuthStore();
  const [services, setServices] = useState<DoctorService[]>([]);
  const [baseFee, setBaseFee] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<DoctorService>(emptyService());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!doctor) return;
    setServices(doctor.services || []);
    setBaseFee(doctor.consultationFee || 0);
    setLoading(false);
  }, [doctor]);

  const resetForm = () => {
    setForm(emptyService());
    setEditingIndex(null);
    setShowForm(false);
  };

  const handleEdit = (i: number) => {
    setForm({ ...services[i] });
    setEditingIndex(i);
    setShowForm(true);
  };

  const handleDelete = (i: number) => {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
    if (editingIndex === i) resetForm();
  };

  const handleAddOrUpdate = () => {
    if (!form.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (form.price < 0) {
      toast.error('Price must be 0 or greater');
      return;
    }
    if (editingIndex !== null) {
      setServices((prev) => prev.map((s, i) => i === editingIndex ? { ...form } : s));
    } else {
      setServices((prev) => [...prev, { ...form }]);
    }
    resetForm();
  };

  const handleSaveAll = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      const res = await doctorService.updateProfile(doctor._id, {
        services,
        consultationFee: baseFee,
      } as Partial<import('@/types').Doctor>);
      updateDoctor({
        services: res.data.data.services,
        consultationFee: res.data.data.consultationFee,
      });
      toast.success('Services saved successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save services';
      toast.error(msg);
    }
    setSaving(false);
  };

  if (!_hydrated || !isAuthenticated || !doctor) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services & Pricing</h1>
          <p className="text-sm text-muted mt-1">Manage the services you offer to patients</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        )}
      </div>

      {/* Base Consultation Fee */}
      <div className="rounded-xl border border-default bg-card-bg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Base Consultation Fee</p>
              <p className="text-xs text-muted">Default fee charged per consultation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">₦</span>
            <input
              type="number"
              min={0}
              value={baseFee}
              onChange={(e) => setBaseFee(Math.max(0, Number(e.target.value)))}
              className="w-24 bg-main-bg border border-default rounded-lg px-2.5 py-1.5 text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-default bg-card-bg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              {editingIndex !== null ? 'Edit Service' : 'New Service'}
            </h2>
            <button onClick={resetForm} className="p-1 rounded-lg hover:bg-hover transition-colors">
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1">Service Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. General Checkup"
                className="w-full bg-main-bg border border-default rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted/50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the service"
                rows={3}
                className="w-full bg-main-bg border border-default rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Price (₦)</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Math.max(0, Number(e.target.value)) }))}
                placeholder="0"
                className="w-full bg-main-bg border border-default rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-default text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddOrUpdate}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              {editingIndex !== null ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Your Services ({services.length})
        </h2>

        {services.length === 0 ? (
          <div className="py-10 text-center">
            <Stethoscope className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">No services added yet</p>
            <p className="text-xs text-muted/60 mt-1">Click "Add Service" to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((svc, i) => (
              <div
                key={i}
                className="flex items-start justify-between p-3 rounded-lg border border-default hover:border-primary/20 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                  {svc.description && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{svc.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-bold text-foreground">₦{svc.price.toLocaleString()}</span>
                  <button
                    onClick={() => handleEdit(i)}
                    className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {baseFee > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-default">
            <span className="text-xs font-medium text-muted">Base Consultation Fee</span>
            <span className="text-sm font-semibold text-primary">₦{baseFee.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
