'use client';
import { useEffect, useState, useCallback } from 'react';
import { userService } from '@/services/api.service';
import { User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { calcAge, formatDOB, membershipTypeLabel } from '@/lib/utils';
import { Search, CheckCircle, XCircle, Shield, Clock, Users } from 'lucide-react';
import { hasPermission, PERMISSIONS, ASSIGNABLE_ROLES, canAssignRole } from '@/lib/permissions';
import toast from 'react-hot-toast';

const ROLES = ['chairman','vice_chairman','secretary','treasurer','pro','program_coordinator','membership_coordinator','welfare_officer','member'];

export default function UsersPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [approveModal, setApproveModal] = useState<User | null>(null);
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('member');
  const [isVice, setIsVice] = useState(false);
  const [approving, setApproving] = useState(false);

  const canManage = hasPermission(me, PERMISSIONS.MANAGE_USERS);
  const canAssign = hasPermission(me, PERMISSIONS.CHANGE_ROLE_DIRECT);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ page, limit: 10, search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined, membershipType: membershipFilter || undefined });
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Approve with optional role assignment
  const handleApprove = async () => {
    if (!approveModal) return;
    setApproving(true);
    try {
      await userService.approve(approveModal._id, { role: newRole, isVice });
      toast.success(`${approveModal.fullName} approved as ${isVice ? 'Vice ' : ''}${newRole.replace(/_/g, ' ')}!`);
      setApproveModal(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setApproving(false); }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this account?')) return;
    try {
      await userService.reject(id);
      toast.success('Account rejected');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleAssignRole = async () => {
    if (!roleModal || !newRole) return;
    try {
      await userService.assignRole(roleModal._id, { role: newRole, isVice });
      toast.success('Role updated');
      setRoleModal(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const assignableRoles = me ? (ASSIGNABLE_ROLES[me.role] || ROLES) : ROLES;

  const columns = [
    {
      key: 'fullName', header: 'Member',
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(u.fullName)}
          </div>
          <div>
            <p className="font-semibold text-sm text-slate-800 dark:text-white">{u.fullName}</p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Role',
      render: (u: User) => (
        <div>
          <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
            {u.isVice ? <span className="text-[#F97316]">Vice </span> : ''}{u.role?.replace(/_/g, ' ')}
          </span>
          {u.membershipType && (
            <p className="text-[10px] text-slate-400 capitalize mt-0.5">{membershipTypeLabel(u.membershipType)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (u: User) => (
        <Badge variant={u.status === 'pending' ? 'warning' : statusBadge(u.status)}>
          {u.status === 'pending' ? '⏳ Pending' : u.status}
        </Badge>
      ),
    },
    { key: 'score', header: 'Score', render: (u: User) => <Badge variant="orange">{u.engagementScore} pts</Badge> },
    {
      key: 'dob', header: 'Age / DOB',
      render: (u: User) => {
        const age = calcAge(u.dob);
        return (
          <div>
            {age !== null ? <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{age} yrs</p> : <p className="text-xs text-slate-400">—</p>}
            {u.dob && <p className="text-[10px] text-slate-400">{formatDOB(u.dob)}</p>}
          </div>
        );
      },
    },
    { key: 'joined', header: 'Joined', render: (u: User) => <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (u: User) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Pending accounts — show Approve + Reject */}
          {u.status === 'pending' && canManage && (
            <>
              <button
                onClick={() => { setApproveModal(u); setNewRole('member'); setIsVice(false); }}
                className="flex items-center gap-1 text-xs font-semibold text-[#22C55E] hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded-lg transition-colors"
                title="Approve account">
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleReject(u._id)}
                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                title="Reject account">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          )}
          {/* Active accounts — show role assignment */}
          {u.status === 'active' && canAssign && canAssignRole(me?.role || 'member', u.role) && (
            <button
              onClick={() => { setRoleModal(u); setNewRole(u.role); setIsVice(u.isVice); }}
              className="flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded-lg transition-colors"
              title="Assign role">
              <Shield className="w-3.5 h-3.5" /> Role
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title text-slate-800 dark:text-white">Members</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all organization members and approvals</p>
        </div>
      </div>

      {/* Pending approvals alert */}
      {pendingCount > 0 && canManage && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {pendingCount} account{pendingCount > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Review and approve new member registrations below
            </p>
          </div>
          <button onClick={() => setStatusFilter('pending')}
            className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap">
            View pending →
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1E3A8A]" /> All Members
            </CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search members..."
                  className="w-full sm:w-44 pl-8 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
              </div>
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
                <option value="">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select value={membershipFilter} onChange={e => { setMembershipFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
                <option value="">All Types</option>
                <option value="adolescent">🧒 Adolescent</option>
                <option value="adult">👤 Adult</option>
                <option value="parent_guardian">👨‍👧 Parent/Guardian</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <Table columns={columns} data={users} loading={loading} emptyMessage="No members found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      {/* Approve Modal — with role assignment */}
      <Modal open={!!approveModal} onClose={() => setApproveModal(null)}
        title="Approve Account"
        subtitle={`Approving: ${approveModal?.fullName}`}>
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-white">{approveModal?.fullName}</p>
            <p className="text-xs mt-0.5">{approveModal?.email}</p>
            <p className="text-xs mt-0.5">Registered: {approveModal ? formatDate(approveModal.createdAt) : ''}</p>
          </div>

          <Select label="Assign Role" value={newRole} onChange={e => setNewRole(e.target.value)}
            options={assignableRoles.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))} />

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <input type="checkbox" checked={isVice} onChange={e => setIsVice(e.target.checked)} className="w-4 h-4 rounded accent-[#1E3A8A]" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vice Role</p>
              <p className="text-xs text-slate-400">Vice roles inherit permissions with limited write access</p>
            </div>
          </label>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-400">
            ✅ Approving will activate the account and allow the member to log in.
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setApproveModal(null)}>Cancel</Button>
            <Button variant="success" onClick={handleApprove} loading={approving}>
              <CheckCircle className="w-4 h-4" /> Approve & Activate
            </Button>
          </div>
        </div>
      </Modal>

      {/* Role Assignment Modal */}
      <Modal open={!!roleModal} onClose={() => setRoleModal(null)}
        title="Assign Role"
        subtitle={`Changing role for: ${roleModal?.fullName}`}>
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400">
            Current role: <span className="font-bold text-[#1E3A8A] dark:text-blue-400 capitalize">{roleModal?.role?.replace(/_/g, ' ')}</span>
          </div>
          <Select label="New Role" value={newRole} onChange={e => setNewRole(e.target.value)}
            options={assignableRoles.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))} />
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <input type="checkbox" checked={isVice} onChange={e => setIsVice(e.target.checked)} className="w-4 h-4 rounded accent-[#1E3A8A]" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Vice Role</p>
              <p className="text-xs text-slate-400">Limited write access</p>
            </div>
          </label>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button onClick={handleAssignRole}>Apply Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
