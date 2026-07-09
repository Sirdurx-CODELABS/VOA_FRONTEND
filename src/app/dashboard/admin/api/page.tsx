'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
  _id: string; name: string; key: string; status: string;
  lastUsed?: string; createdAt: string; permissions: string[];
}

export default function ApiManagementPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    superAdminService.getApiKeys().then(r => setApiKeys(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await superAdminService.createApiKey({ name: newKeyName });
      if (res.data?.data) setApiKeys(prev => [...prev, res.data.data]);
      setNewKeyName('');
      setShowCreate(false);
      setToast('API key created');
    } catch { setToast('Failed to create'); }
    setTimeout(() => setToast(null), 3000);
  };

  const revokeKey = async (id: string) => {
    try {
      await superAdminService.revokeApiKey(id);
      setApiKeys(prev => prev.filter(k => k._id !== id));
      setToast('Key revoked');
    } catch { setToast('Failed to revoke'); }
    setTimeout(() => setToast(null), 3000);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setToast('Copied to clipboard');
    setTimeout(() => setToast(null), 2000);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading API keys...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">API Management</h1>
          <p className="text-sm text-slate-400 mt-1">{apiKeys.length} API key(s)</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 transition-colors shadow-sm"
        ><Plus className="w-4 h-4" /> New Key</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">API Key</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Created</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Last Used</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No API keys</td></tr>}
            {apiKeys.map(k => (
              <tr key={k._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3.5 font-semibold text-sm text-slate-800 dark:text-white">{k.name}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                      {showKey === k._id ? k.key : `${k.key?.substring(0, 12)}...${k.key?.slice(-4)}`}
                    </code>
                    <button onClick={() => setShowKey(showKey === k._id ? null : k._id)} className="p-1 rounded hover:bg-slate-100 text-slate-400">
                      {showKey === k._id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button onClick={() => copyKey(k.key)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><Copy className="w-3 h-3" /></button>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${k.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {k.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {k.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-500">{format(new Date(k.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3.5 text-sm text-slate-500">{k.lastUsed ? format(new Date(k.lastUsed), 'MMM d, yyyy') : 'Never'}</td>
                <td className="px-4 py-3.5 text-right">
                  <button onClick={() => revokeKey(k._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors" title="Revoke">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">New API Key</h3>
            <input type="text" placeholder="Key name..." value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none mb-4"
              onKeyDown={e => e.key === 'Enter' && createKey()}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={createKey} disabled={!newKeyName.trim()} className="px-4 py-2 text-sm font-semibold bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90 disabled:opacity-50">Create Key</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-lg">{toast}</div>}
    </div>
  );
}
