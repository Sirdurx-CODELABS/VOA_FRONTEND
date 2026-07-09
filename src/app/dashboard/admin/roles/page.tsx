'use client';
import { useState } from 'react';
import { Shield, Plus, Edit3, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';

interface Role {
  _id: string; name: string; description: string; type: string;
  userCount: number; isSystem: boolean; permissions: string[];
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([
    { _id: '1', name: 'Super Admin', description: 'Full platform access', type: 'system', userCount: 2, isSystem: true, permissions: ['*'] },
    { _id: '2', name: 'Hospital Admin', description: 'Manage hospital settings and staff', type: 'hospital', userCount: 15, isSystem: true, permissions: ['hospital.*', 'users.*'] },
    { _id: '3', name: 'Organisation Admin', description: 'Manage organisation settings', type: 'organisation', userCount: 8, isSystem: true, permissions: ['organisation.*', 'users.read'] },
    { _id: '4', name: 'Doctor', description: 'Clinical workflow access', type: 'hospital', userCount: 45, isSystem: true, permissions: ['workflow.*', 'patients.*'] },
    { _id: '5', name: 'Content Manager', description: 'Website content management', type: 'organisation', userCount: 6, isSystem: false, permissions: ['websites.*', 'media.*'] },
  ]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleDelete = (id: string) => setRoles(prev => prev.filter(r => r._id !== id));

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Roles & Permissions</h1>
          <p className="text-sm text-slate-400 mt-1">{roles.length} role(s) defined</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(role => (
          <div key={role._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#1E3A8A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{role.name}</h3>
                  <p className="text-xs text-slate-400">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingRole(role); setShowEditor(true); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Edit3 className="w-3.5 h-3.5" /></button>
                {!role.isSystem && <button onClick={() => handleDelete(role._id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-400"><Users className="w-3 h-3" /> {role.userCount} users</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold ${role.isSystem ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {role.isSystem ? 'System' : 'Custom'}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Permissions ({role.permissions.length})</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 4).map(p => (
                  <span key={p} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-50 dark:bg-slate-800 text-slate-500">{p}</span>
                ))}
                {role.permissions.length > 4 && <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-400">+{role.permissions.length - 4}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
