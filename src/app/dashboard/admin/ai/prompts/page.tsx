'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import { FileText, Search, Plus, Edit3, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Prompt {
  _id: string; name: string; content: string; category: string;
  variables: string[]; updatedAt: string;
}

export default function AiPromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    superAdminService.getPrompts().then(r => setPrompts(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleEdit = (prompt: Prompt) => {
    setEditingId(prompt._id);
    setEditContent(prompt.content);
  };

  const handleSave = async (id: string) => {
    try {
      await superAdminService.updatePrompt(id, { content: editContent });
      setPrompts(prev => prev.map(p => p._id === id ? { ...p, content: editContent } : p));
      setEditingId(null);
    } catch {}
  };

  const filtered = prompts.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/admin/ai')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">System Prompts</h1>
          <p className="text-sm text-slate-400 mt-1">Manage AI prompt templates</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prompt => (
            <div key={prompt._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1E3A8A]" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{prompt.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">{prompt.category}</span>
                </div>
                {editingId !== prompt._id && (
                  <button onClick={() => handleEdit(prompt)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                )}
              </div>
              {prompt.variables?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {prompt.variables.map(v => <span key={v} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300">{`{${v}}`}</span>)}
                </div>
              )}
              {editingId === prompt._id ? (
                <div className="space-y-2">
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none font-mono h-32 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={() => handleSave(prompt._id)} className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  </div>
                </div>
              ) : (
                <pre className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono">{prompt.content}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
