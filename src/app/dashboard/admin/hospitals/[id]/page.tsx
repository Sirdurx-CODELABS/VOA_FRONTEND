'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  ArrowLeft, Save, Building2, Stethoscope, Mail, Phone, MapPin,
  Globe, User, CreditCard, Layers, Edit3, Trash2, CheckCircle, XCircle,
  RefreshCw, Archive, Eye, Users, Calendar, DollarSign, Activity,
} from 'lucide-react';
import { format } from 'date-fns';

export default function HospitalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const hospitalId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'users' | 'subscription' | 'website'>('overview');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', type: 'general', status: 'active',
  });

  useEffect(() => {
    superAdminService.getHospitalById(hospitalId).then(r => {
      const h = r.data?.data || {};
      setForm({
        name: h.name || '', email: h.email || '', phone: h.phone || '',
        address: h.address || '', type: h.type || 'general', status: h.status || 'active',
      });
    }).catch(() => { setToast('Hospital not found'); }).finally(() => setLoading(false));
  }, [hospitalId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateUser(hospitalId, form);
      setToast('Hospital updated');
      setEditing(false);
    } catch { setToast('Update failed'); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3000); }
  };

  const toggleStatus = async () => {
    try {
      const newStatus = form.status === 'active' ? 'inactive' : 'active';
      await superAdminService.updateUser(hospitalId, { status: newStatus });
      setForm(prev => ({ ...prev, status: newStatus }));
      setToast(`Hospital ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch { setToast('Status change failed'); }
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await superAdminService.deleteHospital(hospitalId);
      router.push('/dashboard/admin/hospitals');
    } catch { setToast('Delete failed'); setSaving(false); }
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading hospital details...</div>;

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin/hospitals')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{form.name}</h1>
            <p className="text-sm text-slate-400 capitalize">{form.type} Hospital</p>
          </div>
          <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            form.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-slate-100 text-slate-500'
          }`}>{form.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              form.status === 'active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >{form.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />} {form.status === 'active' ? 'Deactivate' : 'Activate'}</button>
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition-colors"
          ><Edit3 className="w-3.5 h-3.5" /> Edit</button>
          <button onClick={() => setDeleting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
          ><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Staff', value: '—', icon: Users },
          { label: 'Patients', value: '—', icon: Activity },
          { label: 'Revenue', value: '—', icon: DollarSign },
          { label: 'Created', value: format(new Date(), 'MMM d, yyyy'), icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['overview', 'edit', 'users', 'subscription', 'website'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab as typeof activeTab); if (tab === 'edit') setEditing(true); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >{tab}</button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Email', value: form.email, icon: Mail },
              { label: 'Phone', value: form.phone, icon: Phone },
              { label: 'Address', value: form.address, icon: MapPin },
              { label: 'Type', value: form.type, icon: Building2 },
              { label: 'Status', value: form.status, icon: Activity },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800"><Icon className="w-4 h-4 text-slate-400" /></div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white capitalize">{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Hospital Name', key: 'name', icon: Building2 },
                { label: 'Email', key: 'email', icon: Mail, type: 'email' },
                { label: 'Phone', key: 'phone', icon: Phone },
                { label: 'Type', key: 'type', icon: Building2, type: 'select', options: ['general', 'specialist', 'teaching', 'clinic'] },
              ].map((item: { label: string; key: string; icon: React.ElementType; type?: string; options?: string[] }) => (
                <div key={item.key}>
                  <label className="text-xs font-medium text-slate-500">{item.label}</label>
                  {item.type === 'select' ? (
                    <select value={form[item.key as keyof typeof form]} onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                    >{item.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                  ) : (
                    <div className="relative mt-1">
                      <item.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={item.type || 'text'} value={form[item.key as keyof typeof form]} onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Address</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none h-20" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 disabled:opacity-50"
              ><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="text-center py-8 text-sm text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            Staff management for this hospital will appear here
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="text-center py-8 text-sm text-slate-400">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            Subscription details and plan management will appear here
          </div>
        )}

        {activeTab === 'website' && (
          <div className="text-center py-8">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-3">Manage this hospital's website</p>
            <button onClick={() => router.push(`/dashboard/admin/websites/editor?entityId=${hospitalId}&type=hospital`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 hover:bg-purple-700"
            ><Globe className="w-4 h-4" /> Open Website Builder</button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDeleting(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">Delete Hospital?</h3>
            <p className="text-sm text-slate-400 text-center mb-6">This action is permanent. All data for {form.name} will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >{saving ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-lg z-50">{toast}</div>}
    </div>
  );
}
