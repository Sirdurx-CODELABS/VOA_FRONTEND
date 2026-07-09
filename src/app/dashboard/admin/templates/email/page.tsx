'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Search, Plus, Copy, Eye, Edit3, Trash2, CheckCircle, XCircle, ArrowLeft, Star } from 'lucide-react';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [templates] = useState([
    { id: '1', name: 'Welcome Email', category: 'onboarding', status: 'active', version: 2, description: 'Sent when a new user registers' },
    { id: '2', name: 'Password Reset', category: 'security', status: 'active', version: 1, description: 'Password reset instructions' },
    { id: '3', name: 'Appointment Reminder', category: 'notifications', status: 'active', version: 3, description: 'Appointment confirmation and reminder' },
    { id: '4', name: 'Subscription Renewal', category: 'billing', status: 'inactive', version: 1, description: 'Subscription renewal notice' },
  ]);

  const filtered = templates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin/templates')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
          <div><h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Email Templates</h1><p className="text-sm text-slate-400 mt-1">{templates.length} template(s)</p></div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" /> New Template</button>
      </div>
      <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search email templates..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 text-sm outline-none" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600" /></div>
                <div><h3 className="text-sm font-bold text-slate-800">{t.name}</h3><p className="text-xs text-slate-400">{t.description}</p></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 capitalize">{t.category}</span>
              <span>v{t.version}</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${t.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
            </div>
            <div className="flex gap-1.5 pt-3 border-t border-slate-100">
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg text-xs font-semibold"><Eye className="w-3.5 h-3.5" /> Preview</button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
