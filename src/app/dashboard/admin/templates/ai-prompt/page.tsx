'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Search, Plus, Edit3, Trash2, Eye, ArrowLeft, Copy, Star, Code } from 'lucide-react';

export default function AiPromptTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [templates] = useState([
    { id: '1', name: 'Clinical Diagnosis Assistant', category: 'clinical', version: 3, status: 'active', author: 'System' },
    { id: '2', name: 'Patient Communication', category: 'communication', version: 2, status: 'active', author: 'Admin' },
    { id: '3', name: 'Lab Result Interpretation', category: 'laboratory', version: 1, status: 'active', author: 'System' },
    { id: '4', name: 'Treatment Plan Generator', category: 'clinical', version: 4, status: 'active', author: 'Admin' },
    { id: '5', name: 'Medical Translation', category: 'translation', version: 2, status: 'inactive', author: 'System' },
  ]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard/admin/templates')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
        <div><h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">AI Prompt Templates</h1><p className="text-sm text-slate-400 mt-1">{templates.length} template(s)</p></div>
      </div>
      <div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search prompt templates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.filter(t => !search || t.name.toLowerCase().includes(search)).map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <BrainCircuit className="w-5 h-5 text-rose-500" />
                <div><h3 className="text-sm font-bold text-slate-800">{t.name}</h3><p className="text-xs text-slate-400 capitalize">{t.category} · v{t.version} · by {t.author}</p></div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
            </div>
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100">
              <button className="flex-1 px-3 py-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg text-xs font-semibold"><Code className="w-3.5 h-3.5 inline mr-1" />View Prompt</button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Copy className="w-3.5 h-3.5" /></button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
