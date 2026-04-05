'use client';
import { useState, useCallback } from 'react';
import { superAdminService } from '@/services/api.service';
import { User } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { formatDate, getInitials } from '@/lib/utils';
import { Users, Plus, Pencil, Trash2, Key, ToggleLeft, ToggleRight, Lock, Search, AlertTriangle } from 'lucide-react';
import { ASSIGNABLE_ROLES } from '@/lib/permissions';
import toast from 'react-hot-toast';

const ROLES = ASSIGNABLE_ROLES['super_admin'] || [];

interface Props { users: User[]; loading: boolean; page: number; totalPages: number; search: string; onSearch: (s: string) => void; onPage: (p: number) => void; onRefresh: () => void; }

export function UsersTab({ users, loading, page, totalPages, search, onSearch, onPage, onRefresh }: Props) {
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [pwTarget, setPwTarget] = useState<User | null>(null);
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: 'member', status: 'active', password: '' });
  const [newRole, setNewRole] = useState('');
  const [isVice, setIsVice] = useState(false);
  const [newPw, setNewPw] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await superAdminService.createUser(form);
      toast.success('User created!');
      setCreateModal(false);
      setForm({ fullName: '', email: '', phone: '', role: 'member', status: 'active', password: '' });
      onRefresh();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await superAdminService.updateUser(editTarget._id, form);
      toast.success('User updated');
      setEditTarget(null);
      onRefresh();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await superAdminService.deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      onRefresh();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (u: User) => {
    try {
      const res = await superAdminService.toggleStatus(u._id);
      toast.success(res.data.message);
      onRefresh();
    } catch { toast.error('Failed'); }
  };

  const handleRole = async () => {
    if (!roleTarget) return;
    try {
      await superAdminService.updateUser(roleTarget._id, { role: newRole, isVice });
      toast.success('Role updated');
      setRoleTarget(null);
      onRefresh();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
  };

  const handlePw = async () => {
    if (!pwTarget || !newPw) return;
    try {
      await superAdminService.resetPassword(pwTarget._id, newPw);
      toast.success('Password reset');
      setPwTarget(null);
      setNewPw('');
    } catch { toast.error('Failed'); }
  };

  const openEdit = (u: User) => { setEditTarget(u); setForm({ fullName: u.fullName, email: u.email, phone: u.phone || '', role: u.role, status: u.status, password: '' }); };

  const columns = [
    { key: 'user', header: 'Member', render: (u: User) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-xs font-bold shrink-0">{getInitials(u.fullName)}</div>
        <div><p className="font-semibold text-sm text-slate-800 dark:text-white">{u.fullName}</p><p className="text-xs text-slate-400">{u.email}</p></div>
      </div>
    )},
    { key: 'role', header: 'Role', render: (u: User) => <span className="text-xs capitalize font-medium text-slate-700 dark:text-slate-300">{u.isVice ? '⚡ Vice ' : ''}{u.role.replace(/_/g, ' ')}</span> },
    { key: 'status', header: 'Status', render: (u: User) => <Badge variant={statusBadge(u.status)}>{u.status}</Badge> },
    { key: 'score', header: 'Score', render: (u: User) => <span className="text-xs font-bold text-[#F97316]">{u.engagementScore} pts</span> },
    { key: 'joined', header: 'Joined', render: (u: User) => <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span> },
    { key: 'actions', header: 'Actions', render: (u: User) => (
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setRoleTarget(u); setNewRole(u.role); setIsVice(u.isVice); }} className="p-1.5 rounded-lg text-[#1E3A8A] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Role"><Key className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleToggle(u)} className="p-1.5 rounded-lg text-[#22C55E] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Toggle status">
          {u.status === 'active' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
        </button>
        <button onClick={() => setPwTarget(u)} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Reset password"><Lock className="w-3.5 h-3.5" /></button>
        {u.role !== 'super_admin' && <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
      </div>
    )},
  ];

  const UserForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="John Doe" />
        <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08012345678" />
        <Input label="Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Leave blank for default" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Role" value={form.role} onChange={e => set('role', e.target.value)} options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))} />
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => { setCreateModal(false); setEditTarget(null); }}>Cancel</Button>
        <Button onClick={editTarget ? handleEdit : handleCreate} loading={submitting}>{editTarget ? 'Update' : 'Create'} User</Button>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-[#1E3A8A]" /> All Users</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 w-44" />
              </div>
              <Button size="sm" onClick={() => setCreateModal(true)}><Plus className="w-3.5 h-3.5" /> Add User</Button>
            </div>
          </div>
        </CardHeader>
        <Table columns={columns} data={users} loading={loading} emptyMessage="No users found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={onPage} />
      </Card>

      <Modal open={createModal || !!editTarget} onClose={() => { setCreateModal(false); setEditTarget(null); }} title={editTarget ? 'Edit User' : 'Create User'} size="lg"><UserForm /></Modal>

      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title="Assign Role" subtitle={roleTarget?.fullName}>
        <div className="space-y-4">
          <Select label="Role" value={newRole} onChange={e => setNewRole(e.target.value)} options={ROLES.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))} />
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <input type="checkbox" checked={isVice} onChange={e => setIsVice(e.target.checked)} className="w-4 h-4 accent-[#1E3A8A]" />
            <div><p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vice Role</p><p className="text-xs text-slate-400">Limited write access</p></div>
          </label>
          <div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setRoleTarget(null)}>Cancel</Button><Button onClick={handleRole}>Apply</Button></div>
        </div>
      </Modal>

      <Modal open={!!pwTarget} onClose={() => setPwTarget(null)} title="Reset Password" subtitle={pwTarget?.fullName} size="sm">
        <div className="space-y-4">
          <Input label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
          <div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setPwTarget(null)}>Cancel</Button><Button onClick={handlePw}>Reset</Button></div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">Delete <strong>{deleteTarget?.fullName}</strong>? This cannot be undone.</p>
          </div>
          <div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete} loading={submitting}>Delete</Button></div>
        </div>
      </Modal>
    </>
  );
}
