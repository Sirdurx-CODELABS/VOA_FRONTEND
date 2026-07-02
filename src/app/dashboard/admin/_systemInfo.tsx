'use client';
import { useEffect, useState } from 'react';
import { systemInfoService } from '@/services/api.service';
import toast from 'react-hot-toast';
import { Save, Globe, Mail, Phone, MapPin, Link as LinkIcon } from 'lucide-react';

interface SocialMedia {
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
  linkedin: string;
  tiktok: string;
}

interface SystemInfo {
  _id: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  contactNumbers: string[];
  socialMedia: SocialMedia;
  documentSystemUrl: string;
}

export function SystemInfoTab() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    systemInfoService.get()
      .then(r => setInfo(r.data.data))
      .catch(() => toast.error('Failed to load system info'))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: string, value: unknown) => {
    if (!info) return;
    setInfo({ ...info, [field]: value });
  };

  const updateSocial = (field: keyof SocialMedia, value: string) => {
    if (!info) return;
    setInfo({ ...info, socialMedia: { ...info.socialMedia, [field]: value } });
  };

  const addContact = () => {
    if (!info) return;
    setInfo({ ...info, contactNumbers: [...info.contactNumbers, ''] });
  };

  const updateContact = (i: number, v: string) => {
    if (!info) return;
    const c = [...info.contactNumbers];
    c[i] = v;
    setInfo({ ...info, contactNumbers: c });
  };

  const removeContact = (i: number) => {
    if (!info) return;
    setInfo({ ...info, contactNumbers: info.contactNumbers.filter((_, idx) => idx !== i) });
  };

  const handleSave = async () => {
    if (!info) return;
    setSaving(true);
    try {
      await systemInfoService.update(info);
      toast.success('System info saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] outline-none transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Organization Information</h2>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-[#1E3A8A]/90 transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}><Mail className="w-3 h-3 inline mr-1" /> Email</label>
          <input className={inputCls} value={info?.email || ''} onChange={e => update('email', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}><Phone className="w-3 h-3 inline mr-1" /> Primary Phone</label>
          <input className={inputCls} value={info?.phone || ''} onChange={e => update('phone', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}><Globe className="w-3 h-3 inline mr-1" /> Website</label>
          <input className={inputCls} value={info?.website || ''} onChange={e => update('website', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}><LinkIcon className="w-3 h-3 inline mr-1" /> Document System URL</label>
          <input className={inputCls} value={info?.documentSystemUrl || ''} onChange={e => update('documentSystemUrl', e.target.value)} placeholder="http://localhost:5173" />
        </div>
      </div>

      <div>
        <label className={labelCls}><MapPin className="w-3 h-3 inline mr-1" /> Address</label>
        <textarea className={inputCls + ' resize-none'} rows={2} value={info?.address || ''} onChange={e => update('address', e.target.value)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + ' mb-0'}><Phone className="w-3 h-3 inline mr-1" /> Additional Contact Numbers</label>
          <button onClick={addContact} className="text-xs text-[#1E3A8A] font-bold hover:underline">+ Add</button>
        </div>
        <div className="space-y-2">
          {info?.contactNumbers.map((num, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} value={num} onChange={e => updateContact(i, e.target.value)} placeholder="+234 ..." />
              <button onClick={() => removeContact(i)} className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">Social Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['facebook', 'Facebook'],
            ['instagram', 'Instagram'],
            ['youtube', 'YouTube'],
            ['twitter', 'Twitter / X'],
            ['linkedin', 'LinkedIn'],
            ['tiktok', 'TikTok'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input className={inputCls} value={(info?.socialMedia as any)?.[key] || ''}
                onChange={e => updateSocial(key as keyof SocialMedia, e.target.value)}
                placeholder={`https://${key}.com/...`} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm mb-2">Preview</h3>
        <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
          <p>📧 {info?.email}</p>
          <p>📞 {info?.phone}</p>
          <p>🌐 {info?.website}</p>
          <p>📍 {info?.address}</p>
          {info && info.contactNumbers.filter(Boolean).length > 0 && (
            <p>📞 Contact: {info.contactNumbers.filter(Boolean).join(' | ')}</p>
          )}
          {info && Object.entries(info.socialMedia || {}).filter(([, v]) => v).length > 0 && (
            <p>🔗 Social: {Object.entries(info.socialMedia).filter(([, v]) => v).map(([k]) => k).join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
