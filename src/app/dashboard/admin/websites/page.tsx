'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWebsiteStore } from '@/store/websiteStore';
import { superAdminService } from '@/services/api.service';
import {
  Globe, Search, Plus, Edit, Trash2, ExternalLink,
  Eye, EyeOff, Copy, MoreHorizontal, Stethoscope, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Website } from '@/types';

export default function WebsitesPage() {
  const router = useRouter();
  const { websites, loading, fetchWebsites, publishWebsite } = useWebsiteStore();
  const [search, setSearch] = useState('');

  useEffect(() => { fetchWebsites(); }, [fetchWebsites]);

  const filtered = websites.filter(w =>
    !search || w.title.toLowerCase().includes(search.toLowerCase()) || w.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handlePublish = async (id: string, current: string) => {
    try {
      if (current === 'published') {
        await superAdminService.unpublishWebsite(id);
      } else {
        await publishWebsite(id);
      }
      fetchWebsites();
    } catch {}
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading websites...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Website Builder</h1>
          <p className="text-sm text-slate-400 mt-1">{websites.length} website(s) · Create and manage entity websites</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/dashboard/admin/websites/templates')}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-4 h-4" /> Templates
          </button>
          <button onClick={() => router.push('/dashboard/admin/websites/editor')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Website
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search websites by name or slug..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No websites yet</p>
            <button onClick={() => router.push('/dashboard/admin/websites/editor')}
              className="mt-3 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Website
            </button>
          </div>
        )}
        {filtered.map(w => (
          <div key={w._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
              <Globe className={`w-10 h-10 ${w.status === 'published' ? 'text-green-400' : 'text-slate-300'}`} />
              <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                w.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                w.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>{w.status}</span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">{w.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">/{w.slug}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  {w.entityType === 'hospital' ? <Stethoscope className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  {w.entityType}
                </span>
                <span>·</span>
                <span>v{w.version}</span>
                <span>·</span>
                <span>{w.pages?.length || 0} pages</span>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => router.push(`/dashboard/admin/websites/editor?id=${w._id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A]/10 text-[#1E3A8A] rounded-lg text-xs font-semibold hover:bg-[#1E3A8A]/20 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handlePublish(w._id, w.status)}
                  className="flex items-center justify-center px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {w.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                </button>
                <button className="flex items-center justify-center px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
