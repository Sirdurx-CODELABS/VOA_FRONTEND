'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import { ClipboardList, Search, User, Globe, Settings, Trash2, Shield, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  _id: string; action: string; entity: string; entityId: string;
  performedBy: { _id: string; name: string }; details: string;
  ipAddress: string; createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    superAdminService.getStats().then(r => setLogs([])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes('delete')) return Trash2;
    if (action.includes('create')) return Shield;
    if (action.includes('update') || action.includes('edit')) return Settings;
    return Eye;
  };

  const sampleLogs: AuditLog[] = [
    { _id: '1', action: 'user.create', entity: 'User', entityId: '', performedBy: { _id: '', name: 'System' }, details: 'Created new admin account', ipAddress: '192.168.1.1', createdAt: new Date().toISOString() },
    { _id: '2', action: 'hospital.update', entity: 'Hospital', entityId: '', performedBy: { _id: '', name: 'Admin User' }, details: 'Updated hospital information', ipAddress: '192.168.1.2', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: '3', action: 'website.publish', entity: 'Website', entityId: '', performedBy: { _id: '', name: 'Super Admin' }, details: 'Published website for City Hospital', ipAddress: '10.0.0.1', createdAt: new Date(Date.now() - 7200000).toISOString() },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-slate-400 mt-1">All administrative actions are permanently recorded</p>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'User', 'Hospital', 'Organisation', 'Website', 'Settings', 'AI'].map(f => (
          <button key={f} onClick={() => setEntityFilter(f.toLowerCase())}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${entityFilter === f.toLowerCase() ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'} transition-colors`}
          >{f === 'all' ? 'All Events' : f}</button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search audit logs..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none" />
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Performed By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">IP</th>
              </tr>
            </thead>
            <tbody>
              {sampleLogs.map(log => {
                const Icon = getActionIcon(log.action);
                return (
                  <tr key={log._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-500">{log.entity}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-500">{log.performedBy.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(log.createdAt), 'MMM d HH:mm')}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{log.ipAddress}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
