'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { clinicalService } from '@/services/clinical.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users, Loader2, AlertTriangle, CheckCircle, Search,
  X, User, Mail, Phone, Shield, Plus,
} from 'lucide-react';

const CLINICAL_ROLES = ['doctor', 'nurse', 'pharmacist', 'lab_scientist', 'adherence_counselor', 'case_manager', 'receptionist', 'data_officer', 'hospital_admin'];

export default function HospitalStaffPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: 'nurse', gender: 'other', specialization: '', staffId: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canManage = hasPermission(user, PERMISSIONS.MANAGE_STAFF as any);

  const fetch = useCallback(async () => {
    try {
      const res = await clinicalService.listStaff();
      setStaff(res.data?.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAuthenticated) fetch(); }, [isAuthenticated, fetch]);

  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password || !form.phone) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await clinicalService.registerStaff(form);
      toast.success('Staff account created');
      setShowForm(false);
      setForm({ fullName: '', email: '', password: '', phone: '', role: 'nurse', gender: 'other', specialization: '', staffId: '' });
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create staff'); }
    setSubmitting(false);
  };

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted mt-1">Manage clinical staff accounts and profiles</p>
        </div>
        {canManage && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          ><Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add Staff'}</button>
        )}
      </div>

      {!canManage && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have staff management permissions.</p>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-default bg-card-bg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Register New Staff</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InputField label="Full Name" value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))} />
            <InputField label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} type="email" />
            <InputField label="Password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} type="password" />
            <InputField label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
            <div>
              <label className="text-xs text-muted block mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm"
              >
                {CLINICAL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
              </select>
            </div>
            <InputField label="Specialization" value={form.specialization} onChange={v => setForm(p => ({ ...p, specialization: v }))} />
            <InputField label="Staff ID" value={form.staffId} onChange={v => setForm(p => ({ ...p, staffId: v }))} />
          </div>
          <button onClick={handleRegister} disabled={submitting}
            className="px-6 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
          >{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted" /></div>
      ) : (
        <div className="rounded-xl border border-default bg-card-bg divide-y divide-default">
          {staff.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">No staff registered yet</p>
            </div>
          ) : (
            staff.map((s: any) => (
              <div key={s._id} className="flex items-center justify-between p-4 hover:bg-hover transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {(s.user?.fullName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.user?.fullName || 'Unknown'}</p>
                    <p className="text-xs text-muted flex items-center gap-3">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.user?.email || '—'}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.user?.phone || '—'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
                    {s.role?.replace(/_/g, ' ') || s.user?.role?.replace(/_/g, ' ')}
                  </span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium',
                    s.status === 'active' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                  )}>{s.status || s.user?.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-muted block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
