'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { positionService } from '@/services/api.service';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Briefcase, Plus, CheckCircle, XCircle, ChevronRight, Clock, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const POSITIONS = [
  { value: 'vice_chairman', label: 'Vice Chairman' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'pro', label: 'Public Relations Officer' },
  { value: 'program_coordinator', label: 'Program Coordinator' },
  { value: 'membership_coordinator', label: 'Membership Coordinator' },
  { value: 'welfare_officer', label: 'Welfare Officer' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_membership_review: { label: 'Awaiting Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  pending_chairman_approval: { label: 'Awaiting Chairman', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: ChevronRight },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

interface Application {
  _id: string;
  applicantId: { fullName: string; email: string; role: string; engagementScore: number };
  appliedPosition: string;
  reasonStatement: string;
  experience?: string;
  skills?: string[];
  status: string;
  membershipReviewBy?: { fullName: string };
  membershipReviewNote?: string;
  chairmanDecisionBy?: { fullName: string };
  chairmanDecisionNote?: string;
  createdAt: string;
}

export default function PositionsPage() {
  const { user: me } = useAuthStore();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applyModal, setApplyModal] = useState(false);
  const [reviewModal, setReviewModal] = useState<Application | null>(null);
  const [detailModal, setDetailModal] = useState<Application | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const canApply = hasPermission(me, PERMISSIONS.SUBMIT_POSITION_APPLICATION);
  const canReview = hasPermission(me, PERMISSIONS.REVIEW_POSITION_APPLICATION);
  const canApprove = hasPermission(me, PERMISSIONS.APPROVE_POSITION_APPLICATION) || me?.role === 'super_admin';

  const [form, setForm] = useState({ appliedPosition: 'secretary', reasonStatement: '', experience: '', skills: '', availability: '', supportingNote: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await positionService.getAll({ page, limit: 10 });
      setApps(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async () => {
    if (!form.reasonStatement.trim()) return toast.error('Reason statement is required');
    setSubmitting(true);
    try {
      await positionService.submit({
        appliedPosition: form.appliedPosition,
        reasonStatement: form.reasonStatement,
        experience: form.experience || undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        availability: form.availability || undefined,
        supportingNote: form.supportingNote || undefined,
      });
      toast.success('Application submitted!');
      setApplyModal(false);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleMembershipReview = async (decision: 'accept' | 'reject') => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await positionService.membershipReview(reviewModal._id, { decision, note: reviewNote });
      toast.success(decision === 'accept' ? 'Escalated to Chairman' : 'Application rejected');
      setReviewModal(null);
      setReviewNote('');
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleChairmanReview = async (decision: 'approve' | 'reject') => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await positionService.chairmanReview(reviewModal._id, { decision, note: reviewNote });
      toast.success(decision === 'approve' ? '🎉 Role approved and updated!' : 'Application rejected');
      setReviewModal(null);
      setReviewNote('');
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleSuperAdminApprove = async (id: string) => {
    try {
      await positionService.superAdminApprove(id);
      toast.success('Approved and role updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    { key: 'applicant', header: 'Applicant', render: (a: Application) => (
      <div>
        <p className="font-semibold text-sm text-slate-800 dark:text-white">{a.applicantId?.fullName}</p>
        <p className="text-xs text-slate-400 capitalize">{a.applicantId?.role?.replace(/_/g, ' ')}</p>
      </div>
    )},
    { key: 'position', header: 'Applied For', render: (a: Application) => (
      <span className="text-sm font-medium text-[#1E3A8A] dark:text-blue-400 capitalize">{a.appliedPosition?.replace(/_/g, ' ')}</span>
    )},
    { key: 'status', header: 'Status', render: (a: Application) => {
      const cfg = statusConfig[a.status] || statusConfig.pending_membership_review;
      const Icon = cfg.icon;
      return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg.color)}>
          <Icon className="w-3 h-3" /> {cfg.label}
        </span>
      );
    }},
    { key: 'date', header: 'Applied', render: (a: Application) => <span className="text-xs text-slate-400">{formatDate(a.createdAt)}</span> },
    { key: 'actions', header: '', render: (a: Application) => (
      <div className="flex gap-2">
        <button onClick={() => setDetailModal(a)} className="text-xs text-[#1E3A8A] dark:text-blue-400 hover:underline">View</button>
        {canReview && a.status === 'pending_membership_review' && (
          <button onClick={() => { setReviewModal(a); setReviewNote(''); }} className="text-xs text-[#F97316] hover:underline">Review</button>
        )}
        {canApprove && a.status === 'pending_chairman_approval' && me?.role !== 'super_admin' && (
          <button onClick={() => { setReviewModal(a); setReviewNote(''); }} className="text-xs text-[#22C55E] hover:underline">Decide</button>
        )}
        {me?.role === 'super_admin' && ['pending_membership_review', 'pending_chairman_approval'].includes(a.status) && (
          <button onClick={() => handleSuperAdminApprove(a._id)} className="text-xs text-amber-600 hover:underline">Force Approve</button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Position Applications</h1>
          <p className="text-sm text-slate-500 mt-1">Apply for a leadership role in VOA</p>
        </div>
        {canApply && <Button onClick={() => setApplyModal(true)} size="sm"><Plus className="w-4 h-4" /> Apply for Position</Button>}
      </div>

      {/* Workflow steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { step: '1', label: 'Member Applies', desc: 'Fill application form', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          { step: '2', label: 'Membership Review', desc: 'Coordinator accepts/rejects', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
          { step: '3', label: 'Chairman Approval', desc: 'Final decision', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
          { step: '4', label: 'Role Updated', desc: 'Position assigned', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
        ].map(({ step, label, desc, color }) => (
          <div key={step} className={`rounded-xl border p-3 ${color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-extrabold text-slate-700 dark:text-slate-300 shadow-sm">{step}</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</p>
            </div>
            <p className="text-xs text-slate-500 pl-8">{desc}</p>
          </div>
        ))}
      </div>

      <Card>
        <Table columns={columns} data={apps} loading={loading} emptyMessage="No applications yet" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      {/* Apply Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Apply for a Position" subtitle="Your application will be reviewed by the Membership Coordinator" size="lg">
        <div className="space-y-4">
          <Select label="Position Applying For" value={form.appliedPosition} onChange={e => set('appliedPosition', e.target.value)} options={POSITIONS} />
          <Textarea label="Why do you want this position? *" placeholder="Describe your motivation and what you'll bring to this role (min. 20 characters)..." rows={4} value={form.reasonStatement} onChange={e => set('reasonStatement', e.target.value)} />
          <Input label="Relevant Experience" placeholder="Previous roles, achievements..." value={form.experience} onChange={e => set('experience', e.target.value)} />
          <Input label="Skills (comma-separated)" placeholder="Leadership, Communication, Planning..." value={form.skills} onChange={e => set('skills', e.target.value)} />
          <Input label="Availability" placeholder="Full-time, Part-time, Weekends..." value={form.availability} onChange={e => set('availability', e.target.value)} />
          <Textarea label="Supporting Note (optional)" placeholder="Any additional information..." rows={2} value={form.supportingNote} onChange={e => set('supportingNote', e.target.value)} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setApplyModal(false)}>Cancel</Button>
            <Button onClick={handleApply} loading={submitting}>Submit Application</Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title={reviewModal?.status === 'pending_membership_review' ? 'Membership Review' : 'Chairman Decision'} size="lg">
        {reviewModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{reviewModal.applicantId?.fullName}</p>
              <p className="text-xs text-slate-500 capitalize">Applying for: <strong className="text-[#1E3A8A] dark:text-blue-400">{reviewModal.appliedPosition?.replace(/_/g, ' ')}</strong></p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{reviewModal.reasonStatement}</p>
              {reviewModal.experience && <p className="text-xs text-slate-500"><strong>Experience:</strong> {reviewModal.experience}</p>}
              {reviewModal.skills?.length ? <p className="text-xs text-slate-500"><strong>Skills:</strong> {reviewModal.skills.join(', ')}</p> : null}
            </div>
            <Textarea label="Note (optional)" placeholder="Add a note for the applicant..." rows={2} value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setReviewModal(null)}>Cancel</Button>
              {reviewModal.status === 'pending_membership_review' ? (
                <>
                  <Button variant="danger" onClick={() => handleMembershipReview('reject')} loading={submitting}>Reject</Button>
                  <Button variant="success" onClick={() => handleMembershipReview('accept')} loading={submitting}>Accept & Escalate</Button>
                </>
              ) : (
                <>
                  <Button variant="danger" onClick={() => handleChairmanReview('reject')} loading={submitting}>Reject</Button>
                  <Button variant="success" onClick={() => handleChairmanReview('approve')} loading={submitting}>Approve & Update Role</Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Application Details" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-sm font-bold">{detailModal.applicantId?.fullName?.charAt(0)}</div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{detailModal.applicantId?.fullName}</p>
                <p className="text-xs text-slate-400 capitalize">{detailModal.applicantId?.role?.replace(/_/g, ' ')} · {detailModal.applicantId?.engagementScore} pts</p>
              </div>
              <div className="ml-auto">
                {(() => { const cfg = statusConfig[detailModal.status]; const Icon = cfg?.icon || Clock; return <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', cfg?.color)}><Icon className="w-3 h-3" />{cfg?.label}</span>; })()}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
              <div><p className="text-xs text-slate-400 uppercase tracking-wider">Applied Position</p><p className="font-bold text-[#1E3A8A] dark:text-blue-400 capitalize">{detailModal.appliedPosition?.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs text-slate-400 uppercase tracking-wider">Reason</p><p className="text-sm text-slate-700 dark:text-slate-300">{detailModal.reasonStatement}</p></div>
              {detailModal.membershipReviewNote && <div><p className="text-xs text-slate-400 uppercase tracking-wider">Membership Note</p><p className="text-sm text-slate-600 dark:text-slate-400">{detailModal.membershipReviewNote}</p></div>}
              {detailModal.chairmanDecisionNote && <div><p className="text-xs text-slate-400 uppercase tracking-wider">Chairman Note</p><p className="text-sm text-slate-600 dark:text-slate-400">{detailModal.chairmanDecisionNote}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
