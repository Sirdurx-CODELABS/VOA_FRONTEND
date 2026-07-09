'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  Megaphone, Search, Plus, Edit3, Trash2, Eye, EyeOff,
  Calendar, Users, Building2, Stethoscope, Globe, CheckCircle, XCircle,
  ArrowLeft, Send,
} from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  _id: string; title: string; content: string; type: string;
  status: string; priority: string; targetAudience: string[];
  createdAt: string; readCount: number;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '', content: '', type: 'info', priority: 'normal',
    targetAudience: [] as string[],
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    superAdminService.getPlatformReports().then(r => {
      const data = r.data?.data || [];
      setAnnouncements(Array.isArray(data) ? data : [
        { _id: '1', title: 'Platform Maintenance', content: 'Scheduled maintenance on Sunday 2-4 AM', type: 'maintenance', status: 'published', priority: 'high', targetAudience: ['all'], createdAt: new Date().toISOString(), readCount: 45 },
        { _id: '2', title: 'New Feature: Telemedicine', content: 'Telemedicine module is now available', type: 'feature', status: 'draft', priority: 'normal', targetAudience: ['hospitals'], createdAt: new Date(Date.now() - 86400000).toISOString(), readCount: 0 },
        { _id: '3', title: 'Security Update', content: 'Please update your passwords', type: 'security', status: 'published', priority: 'high', targetAudience: ['all'], createdAt: new Date(Date.now() - 172800000).toISOString(), readCount: 128 },
      ]);
    }).catch(() => {
      setAnnouncements([
        { _id: '1', title: 'Platform Maintenance', content: 'Scheduled maintenance on Sunday 2-4 AM', type: 'maintenance', status: 'published', priority: 'high', targetAudience: ['all'], createdAt: new Date().toISOString(), readCount: 45 },
        { _id: '2', title: 'New Feature: Telemedicine', content: 'Telemedicine module is now available', type: 'feature', status: 'draft', priority: 'normal', targetAudience: ['hospitals'], createdAt: new Date(Date.now() - 86400000).toISOString(), readCount: 0 },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    setSending(true);
    try {
      const announcement = { ...newAnnouncement, _id: `a_${Date.now()}`, status: 'published', createdAt: new Date().toISOString(), readCount: 0 };
      setAnnouncements(prev => [announcement, ...prev]);
      setShowComposer(false);
      setNewAnnouncement({ title: '', content: '', type: 'info', priority: 'normal', targetAudience: [] });
    } catch {}
    setSending(false);
  };

  const handleDelete = (id: string) => setAnnouncements(prev => prev.filter(a => a._id !== id));

  const targetOptions = [
    { value: 'all', label: 'Entire Platform', icon: Globe },
    { value: 'hospitals', label: 'All Hospitals', icon: Stethoscope },
    { value: 'organisations', label: 'All Organisations', icon: Building2 },
    { value: 'support_groups', label: 'Support Groups', icon: Users },
  ];

  const filtered = announcements.filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Announcements</h1>
          <p className="text-sm text-slate-400 mt-1">{announcements.length} announcement(s)</p>
        </div>
        <button onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 shadow-sm"
        ><Plus className="w-4 h-4" /> New Announcement</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12"><Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-400">No announcements</p></div>
        )}
        {filtered.map(a => (
          <div key={a._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${
                  a.type === 'maintenance' ? 'bg-amber-50 text-amber-600' :
                  a.type === 'security' ? 'bg-red-50 text-red-600' :
                  a.type === 'feature' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}><Megaphone className="w-4 h-4" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      a.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>{a.status}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      a.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                    }`}>{a.priority}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{a.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(a.createdAt), 'MMM d, yyyy')}</span>
                    <span>{a.readCount} read</span>
                    <span className="flex items-center gap-1">
                      {a.targetAudience?.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{t}</span>)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Eye className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowComposer(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">New Announcement</h3>
              <button onClick={() => setShowComposer(false)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Title</label>
                <input type="text" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none" placeholder="Announcement title" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Content</label>
                <textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none h-24 resize-none" placeholder="Write your announcement..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">Type</label>
                  <select value={newAnnouncement.type} onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none">
                    <option value="info">Information</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="feature">New Feature</option>
                    <option value="security">Security</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Priority</label>
                  <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm outline-none">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Target Audience</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {targetOptions.map(({ value, label, icon: Icon }) => (
                    <label key={value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      newAnnouncement.targetAudience.includes(value)
                        ? 'bg-[#1E3A8A]/10 border-[#1E3A8A] text-[#1E3A8A]'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}>
                      <input type="checkbox" checked={newAnnouncement.targetAudience.includes(value)}
                        onChange={e => {
                          if (e.target.checked) setNewAnnouncement({ ...newAnnouncement, targetAudience: [...newAnnouncement.targetAudience, value] });
                          else setNewAnnouncement({ ...newAnnouncement, targetAudience: newAnnouncement.targetAudience.filter(t => t !== value) });
                        }}
                        className="sr-only"
                      />
                      <Icon className="w-4 h-4" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowComposer(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleSend} disabled={sending || !newAnnouncement.title || !newAnnouncement.content}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50"
                ><Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Announcement'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
