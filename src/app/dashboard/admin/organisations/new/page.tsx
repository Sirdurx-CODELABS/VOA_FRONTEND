'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  ArrowLeft, Save, Building2, Mail, Phone, MapPin,
  Globe, User, CreditCard, Layers, CheckCircle,
  Heart, Users, Handshake, Tent,
} from 'lucide-react';

const ORG_TYPES = [
  { value: 'organisation', label: 'Organisation', icon: Building2 },
  { value: 'ngo', label: 'NGO', icon: Heart },
  { value: 'support_group', label: 'Support Group', icon: Users },
  { value: 'alliance', label: 'Alliance', icon: Handshake },
  { value: 'foundation', label: 'Foundation', icon: Tent },
  { value: 'community', label: 'Community Group', icon: Users },
];

export default function CreateOrganisationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '',
    country: 'Nigeria', website: '', type: 'organisation', status: 'active',
    adminName: '', adminEmail: '', adminPhone: '',
    subscriptionPlan: 'basic', templateId: '',
  });

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await superAdminService.createOrganization({
        name: form.name, email: form.email, phone: form.phone,
        address: `${form.address}, ${form.city}, ${form.state}, ${form.country}`,
        website: form.website, type: form.type, status: form.status,
        admin: { name: form.adminName, email: form.adminEmail, phone: form.adminPhone },
        subscriptionPlan: form.subscriptionPlan,
        templateId: form.templateId,
      });
      setToast('Organisation created successfully!');
      setTimeout(() => router.push('/dashboard/admin/organisations'), 1500);
    } catch { setToast('Failed to create'); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3000); }
  };

  const TypeIcon = ORG_TYPES.find(t => t.value === form.type)?.icon || Building2;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Create New Organisation</h1>
          <p className="text-sm text-slate-400 mt-1">Register a new entity on the platform</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[1,2,3,4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? 'bg-[#1E3A8A] text-white' : step > s ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs font-medium ${step === s ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>{['Details','Admin','Plan','Review'][s-1]}</span>
            {s < 4 && <div className="w-12 h-px bg-slate-200 dark:bg-slate-700" />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><TypeIcon className="w-4 h-4" /> Organisation Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Name *</label>
                <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Type</label>
                <select value={form.type} onChange={e => updateField('type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                >{ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Email</label>
                <div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Phone</label>
                <div className="relative mt-1"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={form.phone} onChange={e => updateField('phone', e.target.value)} className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" /></div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Address</label>
              <textarea value={form.address} onChange={e => updateField('address', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none h-20" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['City','State','Country'].map(f => (
                <div key={f}>
                  <label className="text-xs font-medium text-slate-500">{f}</label>
                  <input type="text" value={form[f.toLowerCase() as keyof typeof form]} onChange={e => updateField(f.toLowerCase(), e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><User className="w-4 h-4" /> Administrator</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Admin Name', key: 'adminName', icon: User },
                { label: 'Admin Email', key: 'adminEmail', icon: Mail, type: 'email' },
                { label: 'Admin Phone', key: 'adminPhone', icon: Phone },
              ].map(({ label, key, icon: Icon, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-500">{label}</label>
                  <div className="relative mt-1"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={type || 'text'} value={form[key as keyof typeof form]} onChange={e => updateField(key, e.target.value)}
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><CreditCard className="w-4 h-4" /> Plan & Website</h3>
            <div>
              <label className="text-xs font-medium text-slate-500">Subscription Plan</label>
              <select value={form.subscriptionPlan} onChange={e => updateField('subscriptionPlan', e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
              >
                <option value="basic">Basic - Free</option>
                <option value="standard">Standard - $49/mo</option>
                <option value="professional">Professional - $149/mo</option>
                <option value="enterprise">Enterprise - $299/mo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Website Template</label>
              <select value={form.templateId} onChange={e => updateField('templateId', e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
              >
                <option value="">No template (start from scratch)</option>
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Review</h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              {[
                { label: 'Name', value: form.name },
                { label: 'Type', value: form.type },
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone },
                { label: 'Address', value: `${form.address}, ${form.city}` },
                { label: 'Admin', value: form.adminName || 'Not assigned' },
                { label: 'Plan', value: form.subscriptionPlan },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50"
        >{step > 1 ? 'Previous' : 'Cancel'}</button>
        <button onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 disabled:opacity-50 shadow-sm"
        ><Save className="w-4 h-4" /> {step < 4 ? 'Next' : saving ? 'Creating...' : 'Create'}</button>
      </div>

      {toast && <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white shadow-lg">{toast}</div>}
    </div>
  );
}
