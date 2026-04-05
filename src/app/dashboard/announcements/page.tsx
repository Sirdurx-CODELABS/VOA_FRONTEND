'use client';
import { useEffect, useState, useCallback } from 'react';
import { announcementService } from '@/services/api.service';
import { Announcement } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate, truncate } from '@/lib/utils';
import { Plus, Pencil, Trash2, Pin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = { title: string; message: string; visibility: string };

export default function AnnouncementsPage() {
  const { user: me } = useAuthStore();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [viewTarget, setViewTarget] = useState<Announcement | null>(null);

  const canManage = ['chairman', 'pro'].includes(me?.role || '');
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { visibility: 'internal' } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAll({ page, limit: 10 });
      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (a: Announcement) => {
    setEditTarget(a);
    setValue('title', a.title);
    setValue('message', a.message);
    setValue('visibility', a.visibility);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v));
      if (editTarget) {
        await announcementService.update(editTarget._id, data);
        toast.success('Announcement updated');
        setEditTarget(null);
      } else {
        await announcementService.create(fd);
        toast.success('Announcement created');
        setCreateModal(false);
      }
      reset();
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await announcementService.delete(id);
    toast.success('Deleted');
    load();
  };

  const columns = [
    { key: 'title', header: 'Title', render: (a: Announcement) => (
      <div>
        <div className="flex items-center gap-2">
          {a.isPinned && <Pin className="w-3 h-3 text-indigo-500" />}
          <p className="font-medium text-gray-900 dark:text-white text-sm">{a.title}</p>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{truncate(a.message, 60)}</p>
      </div>
    )},
    { key: 'visibility', header: 'Visibility', render: (a: Announcement) => <Badge variant={statusBadge(a.visibility)}>{a.visibility}</Badge> },
    { key: 'createdBy', header: 'By', render: (a: Announcement) => <span className="text-sm text-gray-500">{a.createdBy?.fullName}</span> },
    { key: 'createdAt', header: 'Date', render: (a: Announcement) => <span className="text-sm text-gray-500">{formatDate(a.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: (a: Announcement) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewTarget(a)} className="text-xs text-indigo-600 hover:underline">View</button>
          {canManage && (
            <>
              <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      ),
    },
  ];

  const AnnouncementForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title" placeholder="Announcement title" error={errors.title?.message} {...register('title', { required: 'Required' })} />
      <Textarea label="Message" placeholder="Write your announcement..." rows={5} error={errors.message?.message} {...register('message', { required: 'Required' })} />
      <Select label="Visibility" options={[{ value: 'internal', label: 'Internal (Members only)' }, { value: 'public', label: 'Public (Website)' }]} {...register('visibility')} />
      <div className="flex gap-3 justify-end">
        <Button variant="outline" type="button" onClick={() => { setCreateModal(false); setEditTarget(null); reset(); }}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{editTarget ? 'Update' : 'Publish'}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Manage internal and public announcements</p>
        </div>
        {canManage && <Button onClick={() => { setCreateModal(true); reset(); }} size="sm"><Plus className="w-4 h-4" /> New Announcement</Button>}
      </div>

      <Card>
        <Table columns={columns} data={items} loading={loading} emptyMessage="No announcements found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal open={createModal || !!editTarget} onClose={() => { setCreateModal(false); setEditTarget(null); reset(); }} title={editTarget ? 'Edit Announcement' : 'New Announcement'} size="lg">
        <AnnouncementForm />
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.title} size="lg">
        {viewTarget && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusBadge(viewTarget.visibility)}>{viewTarget.visibility}</Badge>
              <span className="text-xs text-gray-400">{formatDate(viewTarget.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewTarget.message}</p>
            <p className="text-xs text-gray-400">Posted by {viewTarget.createdBy?.fullName}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
