'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWebsiteStore } from '@/store/websiteStore';
import {
  Globe, Search, Plus, Copy, Eye, CheckCircle, XCircle,
  Layers, MoreHorizontal, Download, ArrowLeft, Star, Edit3,
} from 'lucide-react';

export default function WebsiteTemplatesPage() {
  const router = useRouter();
  const { templates, loading, fetchTemplates } = useWebsiteStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const categories = ['all', ...new Set(templates.map(t => t.category))];
  const filtered = templates.filter(t =>
    (category === 'all' || t.category === category) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin/templates')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Website Templates</h1>
            <p className="text-sm text-slate-400 mt-1">{templates.length} template(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Download className="w-4 h-4" /> Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${category === c ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600'}`}
          >{c}</button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
              <Globe className="w-14 h-14 text-slate-300 dark:text-slate-600" />
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/80 dark:bg-slate-800/80 text-slate-600">{t.category}</span>
              {t.isDefault && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Star className="w-3 h-3" /> Default</span>}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{t.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span>{t.pages?.length || 0} pages</span>
                <span>v{t.version || 1}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => router.push(`/dashboard/admin/websites/editor?templateId=${t._id}`)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg text-xs font-semibold hover:bg-[#1E3A8A]/20"
                ><Eye className="w-3.5 h-3.5" /> Preview</button>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Copy className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><MoreHorizontal className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No website templates found</p>
          </div>
        )}
      </div>
    </div>
  );
}
