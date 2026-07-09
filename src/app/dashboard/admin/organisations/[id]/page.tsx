'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  ArrowLeft, Save, Building2, Mail, Phone, MapPin,
  Globe, User, CreditCard, Edit3, Trash2, CheckCircle, XCircle, Archive,
  RefreshCw, Eye, Stethoscope, Calendar, Heart, Handshake, Settings,
} from 'lucide-react';
import { format } from 'date-fns';

export default function OrganisationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'hospitals' | 'website' | 'settings'>('overview');
  const [org, setOrg] = useState<any>({ name: '', email: '', phone: '', address: '', type: 'organisation', status: 'active' });
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', type: 'organisation' });

  useEffect(() => {
    superAdminService.getOrganizationById(orgId).then(r => {
      const d = r.data?.data || {};
      setOrg(d);
      setForm({ name: d.name || '', email: d.email || '', phone: d.phone || '', address: d.address || '', type: d.type || 'organisation' });
    }).catch(() => setToast('Not found')).finally(() => setLoading(false));
  }, [orgId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateOrganization(orgId, form);
      setOrg({ ...org, ...form });
      setToast('Updated');
    } catch { setToast('Update failed'); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3000); }
  };

  const toggleStatus = async () => {
    const newStatus = org.status === 'active' ? 'inactive' : 'active';
    try {
      await superAdminService.updateOrganization(orgId, { status: newStatus });
      setOrg({ ...org, status: newStatus });
      setToast(`Organisation ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch { setToast('Status change failed'); }
    setTimeout(() => setToast(null), 3000);
  };

  const toggleArchive = async () => {
    try {
      if (org.status === 'archived') {
        await superAdminService.restoreOrganization(orgId);
        setOrg({ ...org, status: 'active' });
        setToast('Restored');
      } else {
        await superAdminService.archiveOrganization(orgId);
        setOrg({ ...org, status: 'archived' });
        setToast('Archived');
      }
    } catch { setToast('Operation failed'); }
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await superAdminService.deleteOrganization(orgId);
      router.push('/dashboard/admin/organisations');
    } catch { setToast('Delete failed'); setSaving(false); }
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Loading...</div>;

  const TypeIcon = org.type === 'ngo' ? Heart : org.type === 'alliance' ? Handshake : Building2;

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin/organisations')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><TypeIcon className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">{org.name}</h1>
            <p className="text-sm text-slate-400 capitalize">{org.type}</p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${org.status === 'active' ? 'bg-green-50 text-green-700' : org.status === 'archived' ? 'bg-yellow-50 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>{org.status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${org.status === 'active' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}
          >{org.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />} {org.status === 'active' ? 'Deactivate' : 'Activate'}</button>
          <button onClick={toggleArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold text-slate-500 hover:bg-slate-50"
          ><Archive className="w-3.5 h-3.5" /> {org.status === 'archived' ? 'Restore' : 'Archive'}</button>
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
          ><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Hospitals', value: org.hospitalsCount || 0, icon: Stethoscope },
          { label: 'Members', value: org.usersCount || 0, icon: User },
          { label: 'Created', value: org.createdAt ? format(new Date(org.createdAt), 'MMM d, yyyy') : '—', icon: Calendar },
          { label: 'Type', value: org.type, icon: TypeIcon },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
            <p className="text-lg font-extrabold text-slate-800">{typeof value === 'number' ? value : value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['overview', 'edit', 'hospitals', 'website', 'settings'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize whitespace-nowrap ${activeTab === tab ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
          >{tab}</button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-6 shadow-sm">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Name', value: org.name, icon: Building2 },
              { label: 'Email', value: org.email, icon: Mail },
              { label: 'Phone', value: org.phone, icon: Phone },
              { label: 'Address', value: org.address, icon: MapPin },
              { label: 'Type', value: org.type, icon: TypeIcon },
              { label: 'Status', value: org.status, icon: CheckCircle },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50"><Icon className="w-4 h-4 text-slate-400" /></div>
                <div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-800 capitalize">{value || '—'}</p></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Name', key: 'name', icon: Building2 },
                { label: 'Email', key: 'email', icon: Mail, type: 'email' },
                { label: 'Phone', key: 'phone', icon: Phone },
                { label: 'Type', key: 'type', icon: Building2, type: 'select', options: ['organisation', 'ngo', 'alliance', 'support_group', 'foundation', 'community'] },
              ].map((item: { label: string; key: string; icon?: React.ElementType; type?: string; options?: string[] }) => (
                <div key={item.key}>
                  <label className="text-xs font-medium text-slate-500">{item.label}</label>
                  {item.type === 'select' ? (
                    <select value={(form as any)[item.key]} onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none"
                    >{item.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                  ) : (
                    <div className="relative mt-1">{item.icon && <item.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                      <input type={item.type || 'text'} value={(form as any)[item.key]} onChange={e => setForm({ ...form, [item.key]: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none" /></div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Address</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none h-20" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 disabled:opacity-50"
              ><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        )}

        {activeTab === 'website' && (
          <div className="text-center py-8">
            <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-3">Manage this organisation's website</p>
            <button onClick={() => router.push(`/dashboard/admin/websites/editor?entityId=${orgId}&type=organisation`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 hover:bg-purple-700"
            ><Globe className="w-4 h-4" /> Open Website Builder</button>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="text-center py-8 text-sm text-slate-400">
            <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            Hospitals under this organisation will be listed here
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-8 text-sm text-slate-400">
            <Settings className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            Additional settings will appear here
          </div>
        )}
      </div>

      {toast && <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-lg">{toast}</div>}
    </div>
  );
}
