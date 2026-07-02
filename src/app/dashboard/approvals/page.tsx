'use client';
import { useEffect, useState } from 'react';
import { documentApprovalService } from '@/services/api.service';
import { DocumentApproval } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { CheckCircle, XCircle, Eye, FileText, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATE_LABELS: Record<string, string> = {
  letterhead: 'Letterhead', membership_card: 'Membership Card', meeting_agenda: 'Meeting Agenda',
  official_invitation: 'Official Invitation', financial_request: 'Financial Request',
  activity_report: 'Activity Report', official_receipt: 'Official Receipt', mou: 'MOU',
  email_signature: 'Email Signature', certificate: 'Certificate',
};

export default function ApprovalsPage() {
  const { user: me } = useAuthStore();
  const [items, setItems] = useState<DocumentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionModal, setActionModal] = useState<{ item: DocumentApproval; action: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await documentApprovalService.getMyPending({ page, limit: 20 });
      setItems(res.data.data.items);
      setTotalPages(res.data.data.pagination.totalPages);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const handleAction = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      if (actionModal.action === 'approve') {
        await documentApprovalService.approve(actionModal.item._id, { comment });
        toast.success('Document approved');
      } else {
        await documentApprovalService.reject(actionModal.item._id, comment);
        toast.success('Document rejected');
      }
      setActionModal(null);
      setComment('');
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed');
    } finally { setSubmitting(false); }
  };

  if (!me) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Document Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve document requests assigned to you</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No pending approvals</p>
          <p className="text-sm text-slate-400 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 dark:text-white truncate">
                        {item.documentId?.name || 'Untitled Document'}
                      </h3>
                      <Badge variant={statusBadge('pending')}>Pending</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {TEMPLATE_LABELS[item.templateType] || item.templateType} &middot; {item.label}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>by {item.requestedBy?.fullName || 'Unknown'}</span>
                      <span>&middot;</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => setActionModal({ item, action: 'approve' })}
                    className="flex items-center gap-1.5 !bg-green-500 hover:!bg-green-600 !text-white !text-xs !px-3 !py-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button
                    onClick={() => setActionModal({ item, action: 'reject' })}
                    variant="secondary"
                    className="flex items-center gap-1.5 !text-xs !px-3 !py-1.5 !text-red-500 !border-red-200 hover:!bg-red-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                    page === i + 1
                      ? 'bg-[#1E3A8A] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!actionModal}
        onClose={() => { setActionModal(null); setComment(''); }}
      >
        {actionModal && (
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                actionModal.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
              )}>
                {actionModal.action === 'approve'
                  ? <CheckCircle className="w-5 h-5 text-green-600" />
                  : <XCircle className="w-5 h-5 text-red-500" />
                }
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                  {actionModal.action === 'approve' ? 'Approve Document' : 'Reject Document'}
                </h3>
                <p className="text-sm text-slate-500">{actionModal.item.documentId?.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm">
              <p><strong>Type:</strong> {TEMPLATE_LABELS[actionModal.item.templateType]}</p>
              <p><strong>Action:</strong> {actionModal.item.label}</p>
              <p><strong>Requested by:</strong> {actionModal.item.requestedBy?.fullName}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comment {actionModal.action === 'reject' ? '(required)' : '(optional)'}
              </label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={actionModal.action === 'reject' ? 'Reason for rejection...' : 'Optional comment...'}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => { setActionModal(null); setComment(''); }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={submitting || (actionModal.action === 'reject' && !comment.trim())}
                className={cn(
                  'flex items-center gap-2',
                  actionModal.action === 'approve'
                    ? '!bg-green-500 hover:!bg-green-600 !text-white'
                    : '!bg-red-500 hover:!bg-red-600 !text-white'
                )}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
