'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import { Settings, Save, Globe, Mail, Bell, Shield, Palette, Monitor, Smartphone } from 'lucide-react';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: 'VOA Platform',
    supportEmail: 'support@voa.com',
    supportPhone: '',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    maintenanceMode: false,
    registrationOpen: true,
    emailVerificationRequired: true,
    defaultLanguage: 'en',
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    superAdminService.getSystemSettings().then(r => {
      if (r.data?.data) setSettings(prev => ({ ...prev, ...r.data.data }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateSystemSettings(settings);
      setToast('Settings saved');
    } catch { setToast('Failed to save'); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3000); }
  };

  const sections = [
    {
      title: 'General', icon: Globe,
      fields: [
        { label: 'Platform Name', key: 'platformName', type: 'text' },
        { label: 'Default Language', key: 'defaultLanguage', type: 'select', options: ['en', 'fr', 'es', 'ar', 'pt'] },
        { label: 'Timezone', key: 'timezone', type: 'select', options: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Dubai', 'Africa/Lagos'] },
        { label: 'Date Format', key: 'dateFormat', type: 'select', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] },
      ],
    },
    {
      title: 'Contact', icon: Mail,
      fields: [
        { label: 'Support Email', key: 'supportEmail', type: 'text' },
        { label: 'Support Phone', key: 'supportPhone', type: 'text' },
      ],
    },
    {
      title: 'Security', icon: Shield,
      fields: [
        { label: 'Session Timeout (minutes)', key: 'sessionTimeout', type: 'number' },
        { label: 'Max Login Attempts', key: 'maxLoginAttempts', type: 'number' },
      ],
      toggles: [
        { label: 'Email Verification Required', key: 'emailVerificationRequired' },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">System Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Configure global platform settings</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 disabled:opacity-50 transition-colors shadow-sm"
        ><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}</button>
      </div>

      {sections.map(section => (
        <div key={section.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <section.icon className="w-4 h-4 text-[#1E3A8A]" /> {section.title}
          </h3>
          <div className="space-y-4">
              {section.fields?.map((field: { label: string; key: string; type: string; options?: string[] }) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-slate-500">{field.label}</label>
                  {field.type === 'select' ? (
                    <select value={(settings as any)[field.key]} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                    >{field.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>
                ) : (
                  <input type={field.type} value={(settings as any)[field.key]} onChange={e => setSettings({ ...settings, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none" />
                )}
              </div>
            ))}
            {section.toggles?.map(({ label, key }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={(settings as any)[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} className="rounded border-slate-300" />
                {label}
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4"><Palette className="w-4 h-4 text-[#1E3A8A]" /> Maintenance</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })} className="rounded border-slate-300" />
            Maintenance Mode
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={settings.registrationOpen} onChange={e => setSettings({ ...settings, registrationOpen: e.target.checked })} className="rounded border-slate-300" />
            Allow New Registrations
          </label>
        </div>
      </div>

      {toast && <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-lg">{toast}</div>}
    </div>
  );
}
