'use client';
import { useEffect, useState } from 'react';
import { socialChannelService } from '@/services/api.service';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, X, Globe, MessageCircle, Send, Hash } from 'lucide-react';

interface SocialChannel {
  _id: string;
  name: string;
  type: string;
  identifier: string;
  description: string;
  isActive: boolean;
}

const CHANNEL_TYPES = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'facebook', label: 'Facebook', icon: '👍' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'twitter', label: 'Twitter / X', icon: '🐦' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'other', label: 'Other', icon: '📡' },
];

const typeIcon = (t: string) => CHANNEL_TYPES.find(c => c.value === t)?.icon || '📡';

export function SocialChannelsTab() {
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SocialChannel | null>(null);
  const [form, setForm] = useState({ name: '', type: 'whatsapp', identifier: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await socialChannelService.getAll();
      setChannels(r.data.data);
    } catch { toast.error('Failed to load social channels'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'whatsapp', identifier: '', description: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (ch: SocialChannel) => {
    setEditing(ch);
    setForm({ name: ch.name, type: ch.type, identifier: ch.identifier, description: ch.description, isActive: ch.isActive });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.identifier) return toast.error('Name and identifier are required');
    setSaving(true);
    try {
      if (editing) {
        await socialChannelService.update(editing._id, form);
        toast.success('Channel updated');
      } else {
        await socialChannelService.create(form);
        toast.success('Channel created');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this social channel?')) return;
    try { await socialChannelService.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] outline-none transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Social Channels / Groups</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage channels where announcements are shared (WhatsApp groups, social media, etc.)</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-[#1E3A8A]/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Channel
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white">{editing ? 'Edit Channel' : 'New Channel'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Channel Name *</label>
              <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. VOA Main WhatsApp" />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {CHANNEL_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Identifier / Link *</label>
              <input className={inputCls} value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))} placeholder="WhatsApp invite link, URL, handle..." />
            </div>
            <div>
              <label className={labelCls}>Active</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-[#22C55E]" />
                <span className="text-sm text-slate-600 dark:text-slate-400">This channel is active for sharing</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description (optional)</label>
              <textarea className={inputCls + ' resize-none'} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this channel/group..." />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-[#1E3A8A]/90 transition-colors disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}</div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Hash className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No social channels added yet</p>
          <p className="text-xs mt-1">Add WhatsApp groups, social media pages, and other sharing destinations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map(ch => (
            <div key={ch._id} className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shrink-0">
                {typeIcon(ch.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{ch.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-slate-100 dark:bg-slate-800 text-slate-500">{ch.type}</span>
                  {!ch.isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500">Inactive</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{ch.identifier}</p>
                {ch.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{ch.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(ch)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(ch._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
