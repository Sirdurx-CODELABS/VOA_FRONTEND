'use client';
import { useEffect, useState, useCallback } from 'react';
import { userService } from '@/services/api.service';
import { User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate, getInitials } from '@/lib/utils';
import { Search, UserPlus, CheckCircle, XCircle, Shield } from 'lucide-react';
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
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ page, limit: 10, search, role: roleFilter || undefined, status: statusFilter || undefined });
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    await userService.approve(id);
    toast.success('User approved');
    load();
  };

  const handleReject = async (id: string) => {
    await userService.reject(id);
    toast.success('User rejected');
    load();
  };

  const handleAssignRole = async () => {
    if (!roleModal || !newRole) return;
    await userService.assignRole(roleModal._id, { role: newRole });
    toast.success('Role assigned');
    setRoleModal(null);
    load();
  };

  const columns = [
    {
      key: 'fullName', header: 'Member',
      render: (u: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
            {getInitials(u.fullName)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{u.fullName}</p>
            <p className="text-xs text-gray-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role', header: 'Role',
      render: (u: User) => <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{u.isVice ? 'Vice ' : ''}{u.role.replace(/_/g, ' ')}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (u: User) => <Badge variant={statusBadge(u.status)}>{u.status}</Badge>,
    },
    {
      key: 'engagementScore', header: 'Score',
      render: (u: User) => <Badge variant="purple">{u.engagementScore} pts</Badge>,
    },
    {
      key: 'createdAt', header: 'Joined',
      render: (u: User) => <span className="text-sm text-gray-500">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions', header: 'Actions',
      render: (u: User) => (
        <div className="flex items-center gap-2">
          {u.status === 'inactive' && hasPermission(me, PERMISSIONS.MANAGE_USERS) && (
            <>
              <button onClick={() => handleApprove(u._id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={() => handleReject(u._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {hasPermission(me, PERMISSIONS.CHANGE_ROLE_DIRECT) && canAssignRole(me?.role || 'member', u.role) && (
            <button onClick={() => { setRoleModal(u); setNewRole(u.role); }} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Assign Role">
              <Shield className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all organization members</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search members..." className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <Table columns={columns} data={users} loading={loading} emptyMessage="No users found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      {/* Assign Role Modal */}
      <Modal open={!!roleModal} onClose={() => setRoleModal(null)} title={`Assign Role — ${roleModal?.fullName}`}>
        <div className="space-y-4">
          <Select label="Role" value={newRole} onChange={(e) => setNewRole(e.target.value)}
            options={(ASSIGNABLE_ROLES[me?.role || ''] || ROLES).map((r) => ({ value: r, label: r.replace(/_/g, ' ') }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button onClick={handleAssignRole}>Assign Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
