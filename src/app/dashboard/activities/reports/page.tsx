'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { activityService } from '@/services/api.service';
import { Activity, ActivityReport } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, truncate, cn } from '@/lib/utils';
import { FileText, Paperclip, Eye, Calendar, Activity as ActivityIcon, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const REPORT_TYPES_BY_ACTIVITY: Record<string, { value: string; label: string }[]> = {
  meeting: [
    { value: 'meeting_minutes', label: 'Meeting Minutes' },
    { value: 'attendance_summary', label: 'Attendance Summary' },
    { value: 'executive_summary', label: 'Executive Summary' },
  ],
  event: [
    { value: 'event_report', label: 'Event Report' },
    { value: 'feedback_report', label: 'Feedback Report' },
    { value: 'summary', label: 'Summary' },
  ],
  community_outreach: [
    { value: 'outreach_report', label: 'Outreach Report' },
    { value: 'impact_report', label: 'Impact Report' },
  ],
  community_visit: [
    { value: 'visit_report', label: 'Visit Report' },
  ],
  welfare_visit: [
    { value: 'welfare_report', label: 'Welfare Report' },
    { value: 'assessment_report', label: 'Assessment Report' },
  ],
  health_awareness: [
    { value: 'health_report', label: 'Health Report' },
    { value: 'awareness_report', label: 'Awareness Report' },
  ],
  training: [
    { value: 'training_report', label: 'Training Report' },
    { value: 'assessment_report', label: 'Assessment Report' },
  ],
  workshop: [
    { value: 'workshop_report', label: 'Workshop Report' },
    { value: 'feedback_report', label: 'Feedback Report' },
  ],
  field_activity: [
    { value: 'field_report', label: 'Field Report' },
    { value: 'activity_report', label: 'Activity Report' },
  ],
  other: [
    { value: 'general_report', label: 'General Report' },
    { value: 'custom_report', label: 'Custom Report' },
  ],
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  meeting_minutes: 'Meeting Minutes',
  attendance_summary: 'Attendance Summary',
  executive_summary: 'Executive Summary',
  event_report: 'Event Report',
  feedback_report: 'Feedback Report',
  summary: 'Summary',
  outreach_report: 'Outreach Report',
  impact_report: 'Impact Report',
  visit_report: 'Visit Report',
  welfare_report: 'Welfare Report',
  assessment_report: 'Assessment Report',
  health_report: 'Health Report',
  awareness_report: 'Awareness Report',
  training_report: 'Training Report',
  workshop_report: 'Workshop Report',
  field_report: 'Field Report',
  activity_report: 'Activity Report',
  general_report: 'General Report',
  custom_report: 'Custom Report',
};

const typeVariant: Record<string, 'info' | 'warning' | 'default' | 'success'> = {
  meeting_minutes: 'info',
  event_report: 'warning',
  summary: 'default',
  outreach_report: 'success',
};

const CREATOR_ROLES = ['super_admin', 'chairman', 'vice_chairman', 'program_coordinator', 'secretary'];

export default function ActivityReportsPage() {
  const { user: me } = useAuthStore();
  const [reports, setReports] = useState<(ActivityReport & { activity?: Activity })[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTarget, setViewTarget] = useState<(ActivityReport & { activity?: Activity }) | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [reportForm, setReportForm] = useState({ title: '', content: '', reportType: '' });
  const [reportFiles, setReportFiles] = useState<FileList | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const canCreate = CREATOR_ROLES.includes(me?.role || '') || !!me?.isVice;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await activityService.getAll({ limit: 100 });
      const activities: Activity[] = r.data.data;
      setAllActivities(activities);
      const allReports: (ActivityReport & { activity?: Activity })[] = [];
      for (const act of activities) {
        try {
          const detail = await activityService.getById(act._id);
          const data = detail.data.data;
          if (data.reports?.length) {
            data.reports.forEach((rep: ActivityReport) => {
              allReports.push({ ...rep, activity: data.activity });
            });
          }
        } catch { /* skip */ }
      }
      allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReports(allReports);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openCreate = () => {
    if (allActivities.length === 0) {
      setActivitiesLoading(true);
      activityService.getAll({ limit: 100 })
        .then(r => setAllActivities(r.data.data))
        .finally(() => setActivitiesLoading(false));
    }
    setCreateModal(true);
    setSelectedActivityId('');
    setReportForm({ title: '', content: '', reportType: '' });
    setReportFiles(null);
  };

  const handleActivityChange = (activityId: string) => {
    setSelectedActivityId(activityId);
    const act = allActivities.find(a => a._id === activityId);
    const types = act ? (REPORT_TYPES_BY_ACTIVITY[act.type] || REPORT_TYPES_BY_ACTIVITY.other) : REPORT_TYPES_BY_ACTIVITY.other;
    setReportForm({ title: '', content: '', reportType: types[0]?.value || 'general_report' });
  };

  const handleCreateReport = async () => {
    if (!selectedActivityId) return toast.error('Select an activity');
    if (!reportForm.title || !reportForm.reportType) return toast.error('Title and report type are required');
    setReportSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', reportForm.title);
      fd.append('content', reportForm.content);
      fd.append('reportType', reportForm.reportType);
      if (reportFiles) Array.from(reportFiles).forEach(f => fd.append('attachments', f));
      await activityService.createReport(selectedActivityId, fd);
      toast.success('Report created');
      setCreateModal(false);
      loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to create report');
    } finally { setReportSubmitting(false); }
  };

  const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]';
  const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title text-slate-800 dark:text-white">Activity Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Reports attached to activities across VOA</p>
        </div>
        {canCreate && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Create Report
          </button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No activity reports yet</p>
            <p className="text-xs mt-1">Create an activity and add reports to it</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((r) => (
              <div key={r._id} className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.title}</p>
                    <Badge variant={typeVariant[r.reportType] || 'default'}>{REPORT_TYPE_LABELS[r.reportType] || r.reportType.replace(/_/g, ' ')}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{truncate(r.content, 100)}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><ActivityIcon className="w-3 h-3" />{r.activity?.title || '—'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(r.createdAt)}</span>
                    {r.attachments?.length > 0 && <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" />{r.attachments.length}</span>}
                    <span>by {r.createdBy?.fullName}</span>
                  </div>
                </div>
                <button onClick={() => setViewTarget(r)}
                  className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.title} size="xl">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={typeVariant[viewTarget.reportType] || 'default'}>{REPORT_TYPE_LABELS[viewTarget.reportType] || viewTarget.reportType.replace(/_/g, ' ')}</Badge>
              <span className="text-xs text-slate-400">{formatDate(viewTarget.createdAt)} · {viewTarget.createdBy?.fullName}</span>
            </div>
            {viewTarget.activity && (
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <ActivityIcon className="w-3 h-3" /> Activity: {viewTarget.activity.title}
              </p>
            )}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viewTarget.content}</p>
            </div>
            {viewTarget.attachments?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Attachments</p>
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

      {/* Create Report Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); setSelectedActivityId(''); setReportForm({ title: '', content: '', reportType: '' }); setReportFiles(null); }} title="Create Report" size="lg">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Activity *</label>
            {activitiesLoading ? (
              <div className="skeleton h-11 w-full rounded-xl" />
            ) : (
              <select value={selectedActivityId} onChange={e => handleActivityChange(e.target.value)} className={inputCls}>
                <option value="">-- Select an activity --</option>
                {allActivities.map(a => (
                  <option key={a._id} value={a._id}>{a.title} ({a.type?.replace(/_/g, ' ')})</option>
                ))}
              </select>
            )}
          </div>
          {selectedActivityId && (
            <>
              <div>
                <label className={labelCls}>Report Title *</label>
                <input value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Meeting Minutes" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Report Type *</label>
                <select value={reportForm.reportType} onChange={e => setReportForm(f => ({ ...f, reportType: e.target.value }))} className={inputCls}>
                  {(() => {
                    const act = allActivities.find(a => a._id === selectedActivityId);
                    return (act ? (REPORT_TYPES_BY_ACTIVITY[act.type] || REPORT_TYPES_BY_ACTIVITY.other) : REPORT_TYPES_BY_ACTIVITY.other).map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <label className={labelCls}>Content</label>
                <textarea value={reportForm.content} onChange={e => setReportForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Report details..." className={cn(inputCls, 'resize-none')} />
              </div>
              <div>
                <label className={labelCls}>Attachments (images, PDF, DOC, XLSX)</label>
                <input type="file" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx" onChange={e => setReportFiles(e.target.files)}
                  className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1E3A8A]/10 file:text-[#1E3A8A] hover:file:bg-[#1E3A8A]/20" />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setCreateModal(false); setSelectedActivityId(''); setReportForm({ title: '', content: '', reportType: '' }); setReportFiles(null); }}>Cancel</Button>
                <Button onClick={handleCreateReport} loading={reportSubmitting}>Create Report</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
