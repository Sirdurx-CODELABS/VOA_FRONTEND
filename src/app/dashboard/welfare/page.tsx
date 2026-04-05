'use client';
import { useEffect, useState, useCallback } from 'react';
import { welfareService } from '@/services/api.service';
import { WelfareRequest } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate, truncate } from '@/lib/utils';
import { Plus, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type CreateForm = { type: string; message: string };

export default function WelfarePage() {
  const { user: me } = useAuthStore();
  const [items, setItems] = useState<WelfareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState<WelfareRequest | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canManage = ['chairman', 'welfare_officer'].includes(me?.role || '');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({ defaultValues: { type: 'financial' } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await welfareService.getAll({ page, limit: 10, status: statusFilter || undefined });
      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: CreateForm) => {
    try {
      const fd = new FormData();
      fd.append('type', data.type);
      fd.append('message', data.message);
      await welfareService.create(fd);
      toast.success('Request submitted');
      setCreateModal(false);
      reset();
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await welfareService.updateStatus(id, status);
    toast.success('Status updated');
    if (detailModal?._id === id) {
      const res = await welfareService.getById(id);
      setDetailModal(res.data.data);
    }
    load();
  };

  const handleFollowUp = async () => {
    if (!detailModal || !followUpNote.trim()) return;
    await welfareService.addFollowUp(detailModal._id, followUpNote);
    toast.success('Follow-up added');
    setFollowUpNote('');
    const res = await welfareService.getById(detailModal._id);
    setDetailModal(res.data.data);
  };

  const columns = [
    { key: 'userId', header: 'Member', render: (w: WelfareRequest) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{w.userId?.fullName}</p>
        <p className="text-xs text-gray-400">{w.userId?.email}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (w: WelfareRequest) => <Badge variant="default" className="capitalize">{w.type}</Badge> },
    { key: 'message', header: 'Message', render: (w: WelfareRequest) => <span className="text-sm text-gray-600 dark:text-gray-400">{truncate(w.message, 50)}</span> },
    { key: 'status', header: 'Status', render: (w: WelfareRequest) => <Badge variant={statusBadge(w.status)}>{w.status}</Badge> },
    { key: 'createdAt', header: 'Date', render: (w: WelfareRequest) => <span className="text-sm text-gray-500">{formatDate(w.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: (w: WelfareRequest) => (
        <button onClick={() => setDetailModal(w)} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
          <MessageSquare className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welfare</h1>
          <p className="text-sm text-gray-500 mt-1">Support requests and welfare tracking</p>
        </div>
        <Button onClick={() => setCreateModal(true)} size="sm"><Plus className="w-4 h-4" /> Submit Request</Button>
      </div>

      <Card>
        <CardHeader>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </CardHeader>
        <Table columns={columns} data={items} loading={loading} emptyMessage="No welfare requests" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); reset(); }} title="Submit Welfare Request">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Type" options={[{ value: 'financial', label: 'Financial' }, { value: 'personal', label: 'Personal' }, { value: 'other', label: 'Other' }]} {...register('type')} />
          <Textarea label="Message" placeholder="Describe your request..." rows={4} error={errors.message?.message} {...register('message', { required: 'Required' })} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => { setCreateModal(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Welfare Request Detail" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="default" className="capitalize">{detailModal.type}</Badge>
              <Badge variant={statusBadge(detailModal.status)}>{detailModal.status}</Badge>
              <span className="text-xs text-gray-400">{formatDate(detailModal.createdAt)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">{detailModal.message}</p>
            </div>

            {canManage && (
              <div className="flex gap-2 flex-wrap">
                {['pending', 'in-progress', 'resolved'].map((s) => (
                  <Button key={s} size="sm" variant={detailModal.status === s ? 'primary' : 'outline'}
                    onClick={() => handleStatusUpdate(detailModal._id, s)} className="capitalize">{s}</Button>
                ))}
              </div>
            )}

            {/* Follow-ups */}
            {detailModal.followUps?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Follow-ups</p>
                {detailModal.followUps.map((f, i) => (
                  <div key={i} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{f.note}</p>
                    <p className="text-xs text-gray-400 mt-1">{f.addedBy?.fullName} · {formatDate(f.addedAt)}</p>
                  </div>
                ))}
              </div>
            )}

            {canManage && (
              <div className="flex gap-2">
                <textarea value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Add a follow-up note..." rows={2}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900 dark:text-white" />
                <Button onClick={handleFollowUp} size="sm">Add</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
