'use client';
import { useEffect, useState } from 'react';
import { superAdminService } from '@/services/api.service';
import {
  Users, Search, Mail, Shield, Ban, CheckCircle,
  MoreHorizontal, UserCheck, UserX, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

interface PlatformUser {
  _id: string; name: string; email: string; role: string;
  status: string; createdAt: string; lastLogin?: string;
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    superAdminService.getUsers({})
      .then(r => setUsers(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id: string, current: string) => {
    try {
      await superAdminService.updateUser(id, { status: current === 'active' ? 'inactive' : 'active' });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    } catch {}
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading users...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-400 mt-1">{users.length} platform user(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {users.filter(u => u.status === 'active').length} active · {users.filter(u => u.status === 'inactive').length} inactive
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search users by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Login</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No users found</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-xs font-bold text-[#1E3A8A]">
                        {u.name?.charAt(0) || u.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{u.name || 'N/A'}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-[#1E3A8A]/20 dark:text-blue-300">
                      <Shield className="w-3 h-3" /> {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      u.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {u.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, yyyy HH:mm') : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleStatus(u._id, u.status)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.status === 'active'
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-slate-400 hover:text-green-600'
                        }`}
                        title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
