'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { organizationService } from '@/services/api.service';
import { Building2, Save, Globe, Mail, Phone, MapPin, Palette, Link as LinkIcon, Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all';

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function OrganizationPage() {
  const { user, organization, updateUser } = useAuthStore();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    organizationName: '', shortName: '', description: '',
    address: '', district: '', state: '', country: '',
    contactEmail: '', contactPhone: '', website: '',
    primaryColor: '#1E3A8A', secondaryColor: '#F97316', accentColor: '#22C55E',
    systemInfo: {
      email: '', phone: '', address: '', website: '',
      socialMedia: { facebook: '', instagram: '', youtube: '', twitter: '', linkedin: '', tiktok: '' },
    },
  });

  useEffect(() => {
    organizationService.getMyOrganization()
      .then(r => {
        const d = r.data.data;
        setOrg(d);
        setForm({
          organizationName: d.organizationName || '',
          shortName: d.shortName || '',
          description: d.description || '',
          address: d.address || '',
          district: d.district || '',
          state: d.state || '',
          country: d.country || '',
          contactEmail: d.contactEmail || '',
          contactPhone: d.contactPhone || '',
          website: d.website || '',
          primaryColor: d.primaryColor || '#1E3A8A',
          secondaryColor: d.secondaryColor || '#F97316',
          accentColor: d.accentColor || '#22C55E',
          systemInfo: {
            email: d.systemInfo?.email || '',
            phone: d.systemInfo?.phone || '',
            address: d.systemInfo?.address || '',
            website: d.systemInfo?.website || '',
            socialMedia: {
              facebook: d.systemInfo?.socialMedia?.facebook || '',
              instagram: d.systemInfo?.socialMedia?.instagram || '',
              youtube: d.systemInfo?.socialMedia?.youtube || '',
              twitter: d.systemInfo?.socialMedia?.twitter || '',
              linkedin: d.systemInfo?.socialMedia?.linkedin || '',
              tiktok: d.systemInfo?.socialMedia?.tiktok || '',
            },
          },
        });
      })
      .catch(() => toast.error('Failed to load organization'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await organizationService.updateMyOrganization(form);
      setOrg(res.data.data);
      toast.success('Organization profile updated!');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const setSocial = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      systemInfo: {
        ...prev.systemInfo,
        socialMedia: { ...prev.systemInfo.socialMedia, [key]: value },
      },
    }));
  };

  if (!user || !['chairman', 'vice_chairman', 'super_admin'].includes(user.role)) {
    return <div className="text-center py-20 text-slate-400">Access denied.</div>;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#1e4db7] to-[#1a3fa8] p-6 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-orange-300 text-xs font-bold uppercase tracking-wider">Organization Profile</span>
            <h1 className="text-2xl font-extrabold">{org?.organizationName || 'Organization'}</h1>
            <p className="text-white/60 text-sm mt-0.5">Manage your organization information, branding, and social media</p>
          </div>
          <div className="ml-auto hidden sm:block">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold" style={{ color: form.primaryColor }}>
              {org?.shortName || 'ORG'}
            </div>
          </div>
        </div>
      </div>

      {/* — Basic Information — */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#1E3A8A]" />
          <h2 className="font-bold text-slate-800 dark:text-white">Basic Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization Name">
              <input className={inputCls} value={form.organizationName} onChange={e => setForm(p => ({ ...p, organizationName: e.target.value }))} placeholder="Full organization name" />
            </Field>
            <Field label="Short Name / Acronym">
              <input className={inputCls} value={form.shortName} onChange={e => setForm(p => ({ ...p, shortName: e.target.value }))} placeholder="e.g. VOA" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={3} className={cn(inputCls, 'resize-none')} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the organization" />
          </Field>
        </div>
      </div>

      {/* — Contact & Location — */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#F97316]" />
          <h2 className="font-bold text-slate-800 dark:text-white">Contact & Location</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={cn(inputCls, 'pl-9')} type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="org@example.com" />
              </div>
            </Field>
            <Field label="Contact Phone">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={cn(inputCls, 'pl-9')} value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="+234 800 000 0000" />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="District">
              <input className={inputCls} value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} placeholder="e.g. Kano Municipal" />
            </Field>
            <Field label="State">
              <input className={inputCls} value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="e.g. Kano State" />
            </Field>
            <Field label="Country">
              <input className={inputCls} value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="Nigeria" />
            </Field>
          </div>
          <Field label="Address">
            <input className={inputCls} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
          </Field>
          <Field label="Website">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={cn(inputCls, 'pl-9')} value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="www.example.com" />
            </div>
          </Field>
        </div>
      </div>

      {/* — System Info (for website/socials) — */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-[#22C55E]" />
          <h2 className="font-bold text-slate-800 dark:text-white">System Info & Social Media</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-400 mb-2">This information is used on the public-facing website and contact forms.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="System Email">
              <input className={inputCls} type="email" value={form.systemInfo.email} onChange={e => setForm(p => ({ ...p, systemInfo: { ...p.systemInfo, email: e.target.value } }))} placeholder="info@example.com" />
            </Field>
            <Field label="System Phone">
              <input className={inputCls} value={form.systemInfo.phone} onChange={e => setForm(p => ({ ...p, systemInfo: { ...p.systemInfo, phone: e.target.value } }))} placeholder="+234 800 000 0000" />
            </Field>
          </div>
          <Field label="System Address">
            <input className={inputCls} value={form.systemInfo.address} onChange={e => setForm(p => ({ ...p, systemInfo: { ...p.systemInfo, address: e.target.value } }))} placeholder="Full address for public display" />
          </Field>
          <Field label="System Website">
            <input className={inputCls} value={form.systemInfo.website} onChange={e => setForm(p => ({ ...p, systemInfo: { ...p.systemInfo, website: e.target.value } }))} placeholder="www.example.com" />
          </Field>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Social Media Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/yourpage' },
                { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/yourpage' },
                { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@yourchannel' },
                { key: 'twitter', label: 'Twitter / X', placeholder: 'x.com/yourhandle' },
                { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/company/yourpage' },
                { key: 'tiktok', label: 'TikTok', placeholder: 'tiktok.com/@yourhandle' },
              ].map(sm => (
                <Field key={sm.key} label={sm.label}>
                  <input className={inputCls} value={(form.systemInfo.socialMedia as any)[sm.key]} onChange={e => setSocial(sm.key, e.target.value)} placeholder={sm.placeholder} />
                </Field>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* — Organization Logo — */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#F97316]" />
          <h2 className="font-bold text-slate-800 dark:text-white">Organization Logo</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 shrink-0">
              {org?.logoUrl ? (
                <img src={org.logoUrl} alt="Organization logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="space-y-3">
              <label className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all',
                'bg-[#1E3A8A] hover:bg-[#1e3480] text-white shadow-sm'
              )}>
                <Upload className="w-4 h-4" />
                {org?.logoUrl ? 'Change Logo' : 'Upload Logo'}
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image must be less than 5MB');
                      return;
                    }
                    const fd = new FormData();
                    fd.append('logo', file);
                    try {
                      const res = await organizationService.uploadLogo(fd);
                      setOrg((prev: any) => ({ ...prev, logoUrl: res.data.data.logoUrl, logo: res.data.data.logo }));
                      // Update auth store organization
                      const { useAuthStore } = await import('@/store/authStore');
                      useAuthStore.getState().setAuth(
                        useAuthStore.getState().user!,
                        useAuthStore.getState().token!,
                        { ...useAuthStore.getState().organization!, logoUrl: res.data.data.logoUrl, logo: res.data.data.logo } as any
                      );
                      toast.success('Logo uploaded successfully!');
                    } catch {
                      toast.error('Failed to upload logo');
                    }
                  }} />
              </label>
              {org?.logoUrl && (
                <button onClick={async () => {
                  try {
                    await organizationService.removeLogo();
                    setOrg((prev: any) => ({ ...prev, logoUrl: '', logo: '' }));
                    const { useAuthStore } = await import('@/store/authStore');
                    useAuthStore.getState().setAuth(
                      useAuthStore.getState().user!,
                      useAuthStore.getState().token!,
                      { ...useAuthStore.getState().organization!, logoUrl: '', logo: '' } as any
                    );
                    toast.success('Logo removed');
                  } catch {
                    toast.error('Failed to remove logo');
                  }
                }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                  <X className="w-4 h-4" /> Remove Logo
                </button>
              )}
              <p className="text-xs text-slate-400">Supported formats: JPEG, PNG, GIF, WebP. Max 5MB.</p>
            </div>
          </div>
        </div>
      </div>

      {/* — Branding / Colors — */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Palette className="w-4 h-4 text-purple-500" />
          <h2 className="font-bold text-slate-800 dark:text-white">Branding Colors</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'primaryColor', label: 'Primary', value: form.primaryColor },
              { key: 'secondaryColor', label: 'Secondary', value: form.secondaryColor },
              { key: 'accentColor', label: 'Accent', value: form.accentColor },
            ].map(c => (
              <div key={c.key}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{c.label}</label>
                <div className="flex items-center gap-3">
                  <input type="color" className="w-10 h-10 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer" value={c.value}
                    onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))} />
                  <input className={inputCls} value={c.value} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))} placeholder="#000000" />
                </div>
              </div>
            ))}
          </div>
          {/* Color preview */}
          <div className="mt-4 flex gap-2 h-3 rounded-full overflow-hidden">
            <div className="flex-1" style={{ backgroundColor: form.primaryColor }} />
            <div className="flex-1" style={{ backgroundColor: form.secondaryColor }} />
            <div className="flex-1" style={{ backgroundColor: form.accentColor }} />
          </div>
        </div>
      </div>

      {/* — Save — */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white font-bold px-8 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-[0.98]">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Organization Profile
        </button>
      </div>
    </div>
  );
}
