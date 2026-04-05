'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { roleChangeService, userService } from '@/services/api.service';
import { hasPermission, PERMISSIONS, ASSIGNABLE_ROLES } from '@/lib/permissions';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select, Textarea, Input } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import { GitBranch, Plus, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RCR {
  _id: string;
  userId: { fullName: string; email: string; role: string };
  requestedRole: string;
  initiatedBy: { fullName: string; role: string };
  reason: string;
  status: string;
  note?: string;
  createdAt: string;
}

export default function RoleChangesPage() {
  const { user: me } = useAuthStore();
  const [requests, setRequests] = useState<RCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [decideModal, setDecideModal] = useState<RCR | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [users, setUsers] = useState<{ _id: string; fullName: string; role: string }[]>([]);
  const [form, setForm] = useState({ userId: '', requestedRole: 'secretary', reason: '' });

  const canCreate = hasPermission(me, PERMISSIONS.INITIATE_ROLE_CHANGE);
  const canApprove = hasPermission(me, PERMISSIONS.APPROVE_ROLE_CHANGE) || me?.role === 'super_admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roleChangeService.getAll({ page, limit: 10 });
      setRequests(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (canCreate) {
      userService.getAll({ status: 'active', limit: 100 }).then(r => setUsers(r.data.data));
    }
  }, [canCreate]);

  const handleCreate = async () => {
    if (!form.userId || !form.reason.trim()) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await roleChangeService.create(form);
      toast.success('Role change request submitted to Chairman');
      setCreateModal(false);
      setForm({ userId: '', requestedRole: 'secretary', reason: '' });
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleDecide = async (decision: 'approve' | 'reject') => {
    if (!decideModal) return;
    setSubmitting(true);
    try {
      if (me?.role === 'super_admin') {
        await roleChangeService.superAdminApprove(decideModal._id);
        toast.success('Role changed by Super Admin');
      } else {
        await roleChangeService.chairmanApprove(decideModal._id, { decision, note });
        toast.success(decision === 'approve' ? 'Role change approved!' : 'Request rejected');
      }
      setDecideModal(null);
      setNote('');
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const assignable = me ? (ASSIGNABLE_ROLES[me.role] || []) : [];

  const columns = [
    { key: 'user', header: 'Member', render: (r: RCR) => (
      <div><p className="font-semibold text-sm text-slate-800 dark:text-white">{r.userId?.fullName}</p><p className="text-xs text-slate-400 capitalize">{r.userId?.role?.replace(/_/g, ' ')}</p></div>
    )},
    { key: 'requestedRole', header: 'Requested Role', render: (r: RCR) => <span className="text-sm font-medium text-[#1E3A8A] dark:text-blue-400 capitalize">{r.requestedRole?.replace(/_/g, ' ')}</span> },
    { key: 'initiatedBy', header: 'Initiated By', render: (r: RCR) => <span className="text-xs text-slate-500">{r.initiatedBy?.fullName}</span> },
    { key: 'status', header: 'Status', render: (r: RCR) => <Badge variant={statusBadge(r.status === 'pending_chairman' ? 'pending' : r.status)}>{r.status?.replace(/_/g, ' ')}</Badge> },
    { key: 'date', header: 'Date', render: (r: RCR) => <span className="text-xs text-slate-400">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: '', render: (r: RCR) => (
      <div className="flex gap-2">
        {(canApprove || me?.role === 'super_admin') && r.status === 'pending_chairman' && (
          <button onClick={() => { setDecideModal(r); setNote(''); }} className="text-xs text-[#22C55E] hover:underline font-semibold">Decide</button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Role Change Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Manage member role transitions with Chairman approval</p>
        </div>
        {canCreate && <Button onClick={() => setCreateModal(true)} size="sm"><Plus className="w-4 h-4" /> New Request</Button>}
      </div>

      <Card>
        <Table columns={columns} data={requests} loading={loading} emptyMessage="No role change requests" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Request Role Change" subtitle="Requires Chairman approval">
        <div className="space-y-4">
          <Select label="Member" value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
            options={[{ value: '', label: 'Select member...' }, ...users.map(u => ({ value: u._id, label: `${u.fullName} (${u.role.replace(/_/g, ' ')})` }))]} />
          <Select label="New Role" value={form.requestedRole} onChange={e => setForm(f => ({ ...f, requestedRole: e.target.value }))}
            options={assignable.map(r => ({ value: r, label: r.replace(/_/g, ' ') }))} />
          <Textarea label="Reason" placeholder="Why should this member's role change? (min. 10 characters)" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={submitting}>Submit Request</Button>
          </div>
        </div>
      </Modal>

      {/* Decide Modal */}
      <Modal open={!!decideModal} onClose={() => setDecideModal(null)} title="Role Change Decision" size="sm">
        {decideModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-sm"><strong>{decideModal.userId?.fullName}</strong> → <strong className="text-[#1E3A8A] dark:text-blue-400 capitalize">{decideModal.requestedRole?.replace(/_/g, ' ')}</strong></p>
              <p className="text-xs text-slate-500">{decideModal.reason}</p>
            </div>
            {me?.role !== 'super_admin' && (
              <Textarea label="Note (optional)" placeholder="Add a note..." rows={2} value={note} onChange={e => setNote(e.target.value)} />
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDecideModal(null)}>Cancel</Button>
              {me?.role === 'super_admin' ? (
                <Button onClick={() => handleDecide('approve')} loading={submitting}>Force Approve</Button>
              ) : (
                <>
                  <Button variant="danger" onClick={() => handleDecide('reject')} loading={submitting}>Reject</Button>
                  <Button variant="success" onClick={() => handleDecide('approve')} loading={submitting}>Approve</Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
