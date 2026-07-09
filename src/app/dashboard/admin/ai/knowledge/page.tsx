'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import { Database, Search, Plus, Edit3, Save, Trash2, ChevronRight, ArrowLeft, BookOpen } from 'lucide-react';

interface KnowledgeEntry {
  _id: string; title: string; content: string; category: string;
  tags: string[]; updatedAt: string;
}

export default function AiKnowledgePage() {
  const router = useRouter();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    superAdminService.getKnowledgeBase().then(r => setEntries(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(entries.map(e => e.category))];
  const filtered = entries.filter(e =>
    (category === 'all' || e.category === category) &&
    (!search || e.title.toLowerCase().includes(search.toLowerCase()) || e.tags?.some(t => t.includes(search)))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/admin/ai')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Knowledge Base</h1>
          <p className="text-sm text-slate-400 mt-1">{entries.length} entries</p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${category === 'all' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
        >All</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize ${category === c ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}
          >{c}</button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search knowledge base..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <div key={entry._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1E3A8A]" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{entry.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">{entry.category}</span>
                </div>
                <div className="flex gap-1">
                  <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Edit3 className="w-3 h-3" /></button>
                  <button className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{entry.content}</p>
              {entry.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-400">{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
