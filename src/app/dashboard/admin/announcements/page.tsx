'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import { Megaphone, Search, Plus, Edit3, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  _id: string; title: string; content: string; type: string;
  status: string; createdAt: string; targetAudience: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    superAdminService.getPlatformReports().then(r => setAnnouncements(r.data?.data || [])).catch(() => { setAnnouncements([]); }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await superAdminService.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Announcements</h1>
          <p className="text-sm text-slate-400 mt-1">Platform-wide announcements and notices</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" /> New Announcement</button>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5" />
        <input type="text" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" />
      </div>
      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-[#1E3A8A]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{a.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{a.content?.substring(0, 120)}...</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(a.createdAt), 'MMM d, yyyy')}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">{a.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
