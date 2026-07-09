'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Search, Plus, Edit3, Trash2, Eye, ArrowLeft, Download } from 'lucide-react';

export default function CertificateTemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [templates] = useState([
    { id: '1', name: 'Completion Certificate', category: 'training', status: 'active' },
    { id: '2', name: 'Training Certificate', category: 'education', status: 'active' },
    { id: '3', name: 'Achievement Award', category: 'recognition', status: 'active' },
    { id: '4', name: 'Membership Certificate', category: 'membership', status: 'inactive' },
  ]);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard/admin/templates')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
        <div><h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Certificate Templates</h1><p className="text-sm text-slate-400 mt-1">{templates.length} template(s)</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.filter(t => !search || t.name.toLowerCase().includes(search)).map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-8 h-8 text-orange-500" />
              <div><h3 className="text-sm font-bold">{t.name}</h3><p className="text-xs text-slate-400 capitalize">{t.category}</p></div>
            </div>
            <div className="flex gap-1.5">
              <button className="flex-1 px-3 py-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg text-xs font-semibold"><Eye className="w-3.5 h-3.5 inline mr-1" />Preview</button>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
