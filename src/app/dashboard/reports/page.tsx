'use client';
import { useEffect, useState, useCallback } from 'react';
import { reportService } from '@/services/api.service';
import { Report } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate, truncate } from '@/lib/utils';
import { Plus, Paperclip, Pencil, Trash2, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = { title: string; content: string; type: string };

export default function ReportsPage() {
  const { user: me } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [viewTarget, setViewTarget] = useState<Report | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const canManage = ['chairman', 'secretary'].includes(me?.role || '');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ defaultValues: { type: 'general' } });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportService.getAll({ page, limit: 10 });
      setReports(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: FormData) => {
    try {
      const fd = new FormData();
      fd.append('title', data.title);
      fd.append('content', data.content);
      fd.append('type', data.type);
      if (files) Array.from(files).forEach((f) => fd.append('attachments', f));
      await reportService.create(fd);
      toast.success('Report created');
      setCreateModal(false);
      reset();
      setFiles(null);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    await reportService.delete(id);
    toast.success('Report deleted');
    load();
  };

  const typeVariant: Record<string, 'info' | 'warning' | 'default'> = {
    meeting_minutes: 'info', event_report: 'warning', general: 'default',
  };

  const columns = [
    { key: 'title', header: 'Report', render: (r: Report) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{r.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{truncate(r.content, 60)}</p>
      </div>
    )},
    { key: 'type', header: 'Type', render: (r: Report) => <Badge variant={typeVariant[r.type] || 'default'}>{r.type.replace(/_/g, ' ')}</Badge> },
    { key: 'attachments', header: 'Files', render: (r: Report) => r.attachments.length > 0 ? (
      <div className="flex items-center gap-1 text-xs text-gray-500"><Paperclip className="w-3 h-3" />{r.attachments.length}</div>
    ) : <span className="text-xs text-gray-400">—</span> },
    { key: 'createdBy', header: 'By', render: (r: Report) => <span className="text-sm text-gray-500">{r.createdBy?.fullName}</span> },
    { key: 'createdAt', header: 'Date', render: (r: Report) => <span className="text-sm text-gray-500">{formatDate(r.createdAt)}</span> },
    {
      key: 'actions', header: '',
      render: (r: Report) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewTarget(r)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
          {canManage && <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Meeting minutes, event reports and documents</p>
        </div>
        {canManage && <Button onClick={() => { setCreateModal(true); reset(); }} size="sm"><Plus className="w-4 h-4" /> New Report</Button>}
      </div>

      <Card>
        <Table columns={columns} data={reports} loading={loading} emptyMessage="No reports found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal open={createModal} onClose={() => { setCreateModal(false); reset(); }} title="Create Report" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" placeholder="Report title" error={errors.title?.message} {...register('title', { required: 'Required' })} />
          <Select label="Type" options={[{ value: 'general', label: 'General' }, { value: 'meeting_minutes', label: 'Meeting Minutes' }, { value: 'event_report', label: 'Event Report' }]} {...register('type')} />
          <Textarea label="Content" placeholder="Report content..." rows={6} error={errors.content?.message} {...register('content', { required: 'Required' })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Attachments</label>
            <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => setFiles(e.target.files)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-900/20 dark:file:text-indigo-400" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => { setCreateModal(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Report</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.title} size="xl">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={typeVariant[viewTarget.type] || 'default'}>{viewTarget.type.replace(/_/g, ' ')}</Badge>
              <span className="text-xs text-gray-400">{formatDate(viewTarget.createdAt)} · {viewTarget.createdBy?.fullName}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{viewTarget.content}</p>
            </div>
            {viewTarget.attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments</p>
                <div className="space-y-1">
                  {viewTarget.attachments.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                      <Paperclip className="w-3.5 h-3.5" /> Attachment {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
