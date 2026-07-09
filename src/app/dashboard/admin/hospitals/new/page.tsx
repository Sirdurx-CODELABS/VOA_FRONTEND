'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  ArrowLeft, Save, Building2, Stethoscope, Mail, Phone, MapPin,
  Globe, User, CreditCard, Layers, CheckCircle,
} from 'lucide-react';

export default function CreateHospitalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '',
    country: 'Nigeria', website: '', type: 'general', status: 'active',
    adminName: '', adminEmail: '', adminPhone: '',
    subscriptionPlan: 'basic', templateId: '',
  });
  const [subscriptions, setSubscriptions] = useState<{ _id: string; planName: string; amount: number; billingCycle: string }[]>([]);
  const [templates, setTemplates] = useState<{ _id: string; name: string; category: string }[]>([]);

  useState(() => {
    Promise.all([
      superAdminService.getSubscriptions().then(r => setSubscriptions(r.data?.data || [])).catch(() => {}),
      superAdminService.getWebsiteTemplates().then(r => setTemplates(r.data?.data || [])).catch(() => {}),
    ]);
  });

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        address: `${form.address}, ${form.city}, ${form.state}, ${form.country}`,
        website: form.website, type: form.type, status: form.status,
        admin: { name: form.adminName, email: form.adminEmail, phone: form.adminPhone },
        subscriptionPlan: form.subscriptionPlan,
        templateId: form.templateId,
      };
      await superAdminService.createHospital(payload);
      setToast('Hospital created successfully!');
      setTimeout(() => router.push('/dashboard/admin/hospitals'), 1500);
    } catch { setToast('Failed to create hospital'); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3000); }
  };

  const steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Admin' },
    { num: 3, label: 'Subscription' },
    { num: 4, label: 'Review' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Register New Hospital</h1>
          <p className="text-sm text-slate-400 mt-1">Onboard a new hospital to the platform</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {steps.map(s => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s.num ? 'bg-[#1E3A8A] text-white' :
              step > s.num ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-medium ${step === s.num ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>{s.label}</span>
            {s.num < 4 && <div className="w-12 h-px bg-slate-200 dark:bg-slate-700 mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><Building2 className="w-4 h-4" /> Hospital Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Hospital Name', key: 'name', icon: Building2, required: true },
                { label: 'Email Address', key: 'email', icon: Mail, type: 'email' },
                { label: 'Phone Number', key: 'phone', icon: Phone },
                { label: 'Hospital Type', key: 'type', type: 'select', options: ['general', 'specialist', 'teaching', 'clinic', 'maternity', 'psychiatric'] },
              ].map(({ label, key, icon: Icon, type, options, required }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-500">{label} {required && '*'}</label>
                  {type === 'select' ? (
                    <select value={form[key as keyof typeof form]} onChange={e => updateField(key, e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                    >{options?.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}</select>
                  ) : (
                    <div className="relative mt-1">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type={type || 'text'} value={form[key as keyof typeof form]} onChange={e => updateField(key, e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Address</label>
              <textarea value={form.address} onChange={e => updateField('address', e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none h-20" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['City', 'State', 'Country'].map(f => (
                <div key={f}>
                  <label className="text-xs font-medium text-slate-500">{f}</label>
                  <input type="text" value={form[f.toLowerCase() as keyof typeof form]} onChange={e => updateField(f.toLowerCase(), e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Website</label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="url" value={form.website} onChange={e => updateField('website', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" placeholder="https://" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><User className="w-4 h-4" /> Hospital Administrator</h3>
            <p className="text-xs text-slate-400">Assign a primary administrator for this hospital</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Admin Name', key: 'adminName', icon: User },
                { label: 'Admin Email', key: 'adminEmail', icon: Mail, type: 'email' },
                { label: 'Admin Phone', key: 'adminPhone', icon: Phone },
              ].map(({ label, key, icon: Icon, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-500">{label}</label>
                  <div className="relative mt-1">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={type || 'text'} value={form[key as keyof typeof form]} onChange={e => updateField(key, e.target.value)}
                      className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><CreditCard className="w-4 h-4" /> Subscription & Template</h3>
            <div>
              <label className="text-xs font-medium text-slate-500">Subscription Plan</label>
              <select value={form.subscriptionPlan} onChange={e => updateField('subscriptionPlan', e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
              >
                <option value="basic">Basic - Free</option>
                <option value="standard">Standard - $99/mo</option>
                <option value="professional">Professional - $249/mo</option>
                <option value="enterprise">Enterprise - $499/mo</option>
                {subscriptions.map(s => (
                  <option key={s._id} value={s._id}>{s.planName} - ${s.amount}/{s.billingCycle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Website Template (Optional)</label>
              <select value={form.templateId} onChange={e => updateField('templateId', e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
              >
                <option value="">No template (start from scratch)</option>
                {templates.map(t => (
                  <option key={t._id} value={t._id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> The selected template will be used to pre-populate the hospital's website. This can be changed later.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Review & Confirm</h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              {[
                { label: 'Hospital Name', value: form.name },
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone },
                { label: 'Type', value: form.type },
                { label: 'Address', value: `${form.address}, ${form.city}` },
                { label: 'Admin', value: form.adminName || 'Not assigned' },
                { label: 'Admin Email', value: form.adminEmail || 'Not set' },
                { label: 'Plan', value: form.subscriptionPlan },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white capitalize">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >{step > 1 ? 'Previous' : 'Cancel'}</button>
        <button onClick={() => step < 4 ? setStep(step + 1) : handleSubmit()} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 disabled:opacity-50 transition-colors shadow-sm"
        ><Save className="w-4 h-4" /> {step < 4 ? 'Next' : saving ? 'Creating...' : 'Create Hospital'}</button>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg z-50 bg-green-600 text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
