'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Plus, Edit3, Trash2, Eye, ArrowLeft, CheckCircle, XCircle, Smartphone, Globe, Mail } from 'lucide-react';

export default function NotificationTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [templates] = useState([
    { id: '1', name: 'Appointment Reminder', channels: ['push', 'sms'], status: 'active', category: 'appointments' },
    { id: '2', name: 'Lab Result Ready', channels: ['push', 'email'], status: 'active', category: 'laboratory' },
    { id: '3', name: 'Medication Reminder', channels: ['push', 'sms'], status: 'active', category: 'pharmacy' },
    { id: '4', name: 'Welcome Notification', channels: ['push', 'email', 'sms'], status: 'active', category: 'onboarding' },
  ]);

  const channelIcons: Record<string, React.ElementType> = { push: Smartphone, email: Mail, sms: Globe };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard/admin/templates')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
        <div><h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Notification Templates</h1><p className="text-sm text-slate-400 mt-1">{templates.length} template(s)</p></div>
      </div>
      <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-sm outline-none" /></div>
      <div className="space-y-2">
        {templates.filter(t => !search || t.name.toLowerCase().includes(search)).map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <div><h3 className="text-sm font-bold text-slate-800">{t.name}</h3><p className="text-xs text-slate-400 capitalize">{t.category}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">{t.channels.map(ch => { const Icon = channelIcons[ch]; return <Icon key={ch} className="w-3.5 h-3.5 text-slate-400" />; })}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><Eye className="w-3.5 h-3.5" /></button>
                <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
