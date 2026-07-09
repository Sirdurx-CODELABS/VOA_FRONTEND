'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWebsiteStore } from '@/store/websiteStore';
import { Globe, Search, Check, Grid3X3, Hospital, Building2, Users, Heart, Handshake, Megaphone } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  hospital: Hospital, organisation: Building2, ngo: Heart,
  support_group: Users, alliance: Handshake, medical: Hospital,
  community: Users, landing: Globe, campaign: Megaphone,
};

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, loading, fetchTemplates } = useWebsiteStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const categories = [...new Set(templates.map(t => t.category))];

  const filtered = templates.filter(t =>
    (selectedCategory === 'all' || t.category === selectedCategory) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Website Templates</h1>
          <p className="text-sm text-slate-400 mt-1">Start with a pre-built template</p>
        </div>
        <button onClick={() => router.push('/dashboard/admin/websites')}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Back to Websites
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'all' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >All</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              selectedCategory === cat ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search templates..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const CatIcon = CATEGORY_ICONS[t.category] || Globe;
            return (
              <div key={t._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                  <CatIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{t.category}</span>
                    <span>{t.pages?.length || 0} pages</span>
                    {t.isDefault && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 font-semibold">Default</span>}
                  </div>
                  <button onClick={() => router.push(`/dashboard/admin/websites/editor?templateId=${t._id}`)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-[#1E3A8A]/90 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Use Template
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
