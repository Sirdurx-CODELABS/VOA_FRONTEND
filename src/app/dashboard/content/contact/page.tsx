'use client';
import { useEffect, useState, useCallback } from 'react';
import { contactService } from '@/services/api.service';
import { ContactMessage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { Search, Eye, Reply, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type ReplyFormData = {
  content: string;
};

export default function ContactPage() {
  const { user: me } = useAuthStore();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewModal, setViewModal] = useState<ContactMessage | null>(null);
  const [replyModal, setReplyModal] = useState<ContactMessage | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReplyFormData>();

  const canManage = ['chairman', 'pro', 'secretary'].includes(me?.role || '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactService.getAll({ page, limit: 10, search, status: statusFilter || undefined });
      setMessages(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleReplySubmit = async (data: ReplyFormData) => {
    if (!replyModal) return;
    try {
      await contactService.replyToMessage(replyModal._id, data.content);
      toast.success('Reply sent');
      setReplyModal(null);
      reset();
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send reply');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await contactService.updateStatus(id, status);
      toast.success('Status updated');
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await contactService.delete(id);
    toast.success('Message deleted');
    load();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'warning';
      case 'in-progress': return 'default';
      case 'replied': return 'success';
      case 'closed': return 'danger';
      default: return 'default';
    }
  };

  const columns = [
    { key: 'name', header: 'From', render: (msg: ContactMessage) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{msg.name}</p>
        <p className="text-xs text-gray-400">{msg.email}</p>
      </div>
    )},
    { key: 'subject', header: 'Subject', render: (msg: ContactMessage) => <span className="text-sm text-gray-600 dark:text-gray-400">{msg.subject}</span> },
    { key: 'status', header: 'Status', render: (msg: ContactMessage) => <Badge variant={getStatusBadgeVariant(msg.status)}>{msg.status}</Badge> },
    { key: 'date', header: 'Date', render: (msg: ContactMessage) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(msg.createdAt)}</span> },
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (msg: ContactMessage) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewModal(msg)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={() => { setReplyModal(msg); }} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Reply"><Reply className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(msg._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Manage contact form submissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search messages..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="replied">Replied</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardHeader>
        <Table columns={columns} data={messages} loading={loading} emptyMessage="No contact messages found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Contact Message" size="xl">
        {viewModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">From</p>
                <p className="text-gray-900 dark:text-white font-medium">{viewModal.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{viewModal.email}</p>
                {viewModal.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{viewModal.phone}</p>}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-gray-900 dark:text-white">{formatDate(viewModal.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Subject</p>
              <p className="text-gray-900 dark:text-white font-medium">{viewModal.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Message</p>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewModal.message}</p>
            </div>
            {viewModal.replies.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Replies</p>
                <div className="space-y-3">
                  {viewModal.replies.map((reply) => (
                    <div key={reply._id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-gray-900 dark:text-white">{reply.createdBy.fullName}</p>
                        <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Status:</span>
                <select
                  value={viewModal.status}
                  onChange={(e) => handleUpdateStatus(viewModal._id, e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!replyModal} onClose={() => { setReplyModal(null); reset(); }} title="Reply to Message" size="lg">
        {replyModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-gray-900 dark:text-white">{replyModal.name}</p>
                <span className="text-xs text-gray-500">{formatDate(replyModal.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">{replyModal.subject}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{replyModal.message}</p>
            </div>
            <form onSubmit={handleSubmit(handleReplySubmit)} className="space-y-4">
              <Textarea
                label="Your Reply"
                placeholder="Type your reply here..."
                rows={6}
                error={errors.content?.message}
                {...register('content', { required: 'Reply is required' })}
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" type="button" onClick={() => { setReplyModal(null); reset(); }}>Cancel</Button>
                <Button type="submit" loading={isSubmitting}>Send Reply</Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
