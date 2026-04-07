'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { activityService, userService } from '@/services/api.service';
import { Activity, ActivityParticipant, User } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate, calcAge, membershipTypeLabel, cn } from '@/lib/utils';
import {
  Plus, Calendar, MapPin, Users, Clock, CheckCircle, XCircle,
  AlertCircle, Filter, ChevronDown, ChevronUp, Upload, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTIVITY_TYPES = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'event', label: 'Event' },
  { value: 'community_outreach', label: 'Community Outreach' },
  { value: 'community_visit', label: 'Community Visit' },
  { value: 'welfare_visit', label: 'Welfare Visit' },
  { value: 'health_awareness', label: 'Health Awareness' },
  { value: 'training', label: 'Training' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'field_activity', label: 'Field Activity' },
  { value: 'other', label: 'Other' },
];

const CREATOR_ROLES = ['super_admin', 'chairman', 'vice_chairman', 'program_coordinator', 'secretary'];

const statusColor = (s: string) => ({
  published: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ongoing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}[s] ?? 'bg-slate-100 text-slate-600');

const responseColor = (s: string) => ({
  accepted: 'text-[#22C55E]', declined: 'text-red-500', absent: 'text-[#F97316]', pending: 'text-slate-400',
}[s] ?? 'text-slate-400');

export default function ActivitiesPage() {
  const { user: me } = useAuthStore();
  const searchParams = useSearchParams();
  const viewMine = searchParams.get('view') === 'mine';
  const openCreate = searchParams.get('action') === 'create';

  const canCreate = CREATOR_ROLES.includes(me?.role || '') || !!me?.isVice;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [myParticipants, setMyParticipants] = useState<ActivityParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'mine'>(viewMine ? 'mine' : 'all');
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<{ activity: Activity; participants: ActivityParticipant[] } | null>(null);
  const [createModal, setCreateModal] = useState(openCreate);
  const [respondModal, setRespondModal] = useState<ActivityParticipant | null>(null);
  const [attendModal, setAttendModal] = useState<ActivityParticipant | null>(null);
  const [filterPreview, setFilterPreview] = useState<User[]>([]);
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'meeting', description: '', date: '', startTime: '', endTime: '',
    venue: '', peopleNeeded: '', targetMembershipType: 'all', targetGender: 'all',
    targetAgeMin: '', targetAgeMax: '', customConditions: '', status: 'published',
  });
  const [respondForm, setRespondForm] = useState({ responseStatus: 'accepted', responseReason: '' });
  const [attendForm, setAttendForm] = useState({ attendanceStatus: 'present', attendanceReason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (view === 'mine') {
        const r = await activityService.getMy();
        setMyParticipants(r.data.data);
      } else {
        const r = await activityService.getAll();
        setActivities(r.data.data);
      }
    } finally { setLoading(false); }
  }, [view]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    setDetailModal(id);
    try {
      const r = await activityService.getById(id);
      setDetailData(r.data.data);
    } catch { toast.error('Failed to load activity'); }
  };

  const runFilter = async () => {
    setFilterLoading(true);
    try {
      const r = await activityService.filterMembers({
        targetMembershipType: form.targetMembershipType,
        targetGender: form.targetGender,
        targetAgeMin: form.targetAgeMin ? parseInt(form.targetAgeMin) : undefined,
        targetAgeMax: form.targetAgeMax ? parseInt(form.targetAgeMax) : undefined,
      });
      setFilterPreview(r.data.data);
      setSelectedInvitees(r.data.data.map((u: User) => u._id));
    } finally { setFilterLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.title || !form.date) return toast.error('Title and date are required');
    setSubmitting(true);
    try {
      await activityService.create({ ...form, invitedUserIds: selectedInvitees });
      toast.success('Activity created and invitations sent!');
      setCreateModal(false);
      setSelectedInvitees([]);
      setFilterPreview([]);
      setForm({ title: '', type: 'meeting', description: '', date: '', startTime: '', endTime: '', venue: '', peopleNeeded: '', targetMembershipType: 'all', targetGender: 'all', targetAgeMin: '', targetAgeMax: '', customConditions: '', status: 'published' });
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleRespond = async () => {
    if (!respondModal) return;
    if (['declined', 'absent'].includes(respondForm.responseStatus) && !respondForm.responseReason) {
      return toast.error('Please provide a reason');
    }
    setSubmitting(true);
    try {
      const actId = typeof respondModal.activityId === 'string' ? respondModal.activityId : (respondModal.activityId as Activity)._id;
      await activityService.respond(actId, respondForm);
      toast.success('Response recorded');
      setRespondModal(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const handleAttend = async () => {
    if (!attendModal) return;
    if (attendForm.attendanceStatus === 'absent' && !attendForm.attendanceReason) return toast.error('Please provide a reason');
    setSubmitting(true);
    try {
      const actId = typeof attendModal.activityId === 'string' ? attendModal.activityId : (attendModal.activityId as Activity)._id;
      await activityService.markAttendance(actId, attendForm);
      toast.success('Attendance marked');
      setAttendModal(null);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]';
  const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title text-slate-800 dark:text-white">Activities</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and participate in VOA activities</p>
        </div>
        {canCreate && (
          <button onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Create Activity
          </button>
        )}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1.5 w-fit">
        {[{ id: 'all', label: 'All Activities' }, { id: 'mine', label: 'My Invitations' }].map(v => (
          <button key={v.id} onClick={() => setView(v.id as 'all' | 'mine')}
            className={cn('px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              view === v.id ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {v.label}
          </button>
        ))}
      </div>

      {/* All Activities */}
      {view === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <div className="skeleton h-5 w-3/4" /><div className="skeleton h-4 w-1/2" /><div className="skeleton h-4 w-full" />
            </div>
          )) : activities.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No activities yet</p>
            </div>
          ) : activities.map(a => (
            <div key={a._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{a.title}</p>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">{a.type?.replace(/_/g, ' ')}</p>
                </div>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full shrink-0', statusColor(a.status))}>{a.status}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{formatDate(a.date)}{a.startTime ? ` · ${a.startTime}` : ''}</div>
                {a.venue && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{a.venue}</div>}
                {a.peopleNeeded ? <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{a.peopleNeeded} people needed</div> : null}
              </div>
              <button onClick={() => openDetail(a._id)}
                className="mt-4 w-full flex items-center justify-center gap-2 border border-[#1E3A8A]/30 text-[#1E3A8A] dark:text-blue-400 text-xs font-bold py-2 rounded-xl hover:bg-[#1E3A8A]/5 transition-colors">
                <Eye className="w-3.5 h-3.5" /> View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My Invitations */}
      {view === 'mine' && (
        <div className="space-y-3">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="skeleton h-5 w-1/2" /><div className="skeleton h-4 w-3/4" />
            </div>
          )) : myParticipants.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No invitations yet</p>
            </div>
          ) : myParticipants.map(p => {
            const act = p.activityId as Activity;
            const isPast = act?.date && new Date(act.date) < new Date();
            return (
              <div key={p._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white">{act?.title}</p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">{act?.type?.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{act?.date ? formatDate(act.date) : '—'}</span>
                      {act?.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{act.venue}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn('text-xs font-bold', responseColor(p.responseStatus))}>
                      {p.responseStatus === 'pending' ? '⏳ Pending' : p.responseStatus === 'accepted' ? '✅ Accepted' : p.responseStatus === 'declined' ? '❌ Declined' : '⚠️ Absent'}
                    </span>
                    {p.attendanceStatus !== 'pending' && (
                      <span className={cn('text-xs font-semibold', p.attendanceStatus === 'present' ? 'text-[#22C55E]' : 'text-[#F97316]')}>
                        {p.attendanceStatus === 'present' ? '✅ Present' : '⚠️ Absent'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {p.responseStatus === 'pending' && (
                    <button onClick={() => { setRespondModal(p); setRespondForm({ responseStatus: 'accepted', responseReason: '' }); }}
                      className="flex items-center gap-1.5 bg-[#1E3A8A] hover:bg-[#1e3480] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                      Respond
                    </button>
                  )}
                  {p.responseStatus === 'accepted' && p.attendanceStatus === 'pending' && isPast && (
                    <button onClick={() => { setAttendModal(p); setAttendForm({ attendanceStatus: 'present', attendanceReason: '' }); }}
                      className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                      Mark Attendance
                    </button>
                  )}
                  <button onClick={() => openDetail(typeof act === 'string' ? act : act._id)}
                    className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Eye className="w-3 h-3" /> Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity Detail Modal */}
      <Modal open={!!detailModal} onClose={() => { setDetailModal(null); setDetailData(null); }} title={detailData?.activity.title || 'Activity'} size="xl">
        {detailData && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Type', value: detailData.activity.type?.replace(/_/g, ' ') },
                { label: 'Date', value: formatDate(detailData.activity.date) },
                { label: 'Time', value: detailData.activity.startTime ? `${detailData.activity.startTime}${detailData.activity.endTime ? ` – ${detailData.activity.endTime}` : ''}` : '—' },
                { label: 'Venue', value: detailData.activity.venue || '—' },
                { label: 'Status', value: detailData.activity.status },
                { label: 'Created by', value: (detailData.activity.createdBy as User)?.fullName || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            {detailData.activity.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{detailData.activity.description}</p>
            )}
            {/* Participants */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Participants ({detailData.participants.length})
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detailData.participants.map(p => (
                  <div key={p._id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{(p.userId as User)?.fullName}</p>
                      <p className="text-xs text-slate-400 capitalize">{membershipTypeLabel((p.userId as User)?.membershipType)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-bold', responseColor(p.responseStatus))}>{p.responseStatus}</span>
                      {p.attendanceStatus !== 'pending' && (
                        <span className={cn('text-xs font-semibold', p.attendanceStatus === 'present' ? 'text-[#22C55E]' : 'text-[#F97316]')}>{p.attendanceStatus}</span>
                      )}
                    </div>
                  </div>
                ))}
                {detailData.participants.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No participants yet</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Respond Modal */}
      <Modal open={!!respondModal} onClose={() => setRespondModal(null)} title="Respond to Invitation" size="sm">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Your Response</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ v: 'accepted', label: '✅ Accept', color: 'border-[#22C55E] bg-green-50 dark:bg-green-900/20 text-[#22C55E]' },
                { v: 'declined', label: '❌ Decline', color: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500' },
                { v: 'absent', label: '⚠️ Absent', color: 'border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]' }].map(opt => (
                <button key={opt.v} type="button" onClick={() => setRespondForm(f => ({ ...f, responseStatus: opt.v }))}
                  className={cn('py-2.5 rounded-xl border-2 text-xs font-bold transition-all',
                    respondForm.responseStatus === opt.v ? opt.color : 'border-slate-200 dark:border-slate-700 text-slate-500')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {['declined', 'absent'].includes(respondForm.responseStatus) && (
            <div>
              <label className={labelCls}>Reason (required)</label>
              <textarea value={respondForm.responseReason} onChange={e => setRespondForm(f => ({ ...f, responseReason: e.target.value }))}
                rows={3} placeholder="Please provide a reason..." className={cn(inputCls, 'resize-none')} />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRespondModal(null)}>Cancel</Button>
            <Button onClick={handleRespond} loading={submitting}>Submit Response</Button>
          </div>
        </div>
      </Modal>

      {/* Attendance Modal */}
      <Modal open={!!attendModal} onClose={() => setAttendModal(null)} title="Mark Attendance" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[{ v: 'present', label: '✅ Present', color: 'border-[#22C55E] bg-green-50 dark:bg-green-900/20 text-[#22C55E]' },
              { v: 'absent', label: '⚠️ Absent', color: 'border-[#F97316] bg-orange-50 dark:bg-orange-900/20 text-[#F97316]' }].map(opt => (
              <button key={opt.v} type="button" onClick={() => setAttendForm(f => ({ ...f, attendanceStatus: opt.v }))}
                className={cn('py-3 rounded-xl border-2 text-sm font-bold transition-all',
                  attendForm.attendanceStatus === opt.v ? opt.color : 'border-slate-200 dark:border-slate-700 text-slate-500')}>
                {opt.label}
              </button>
            ))}
          </div>
          {attendForm.attendanceStatus === 'absent' && (
            <div>
              <label className={labelCls}>Reason (required)</label>
              <textarea value={attendForm.attendanceReason} onChange={e => setAttendForm(f => ({ ...f, attendanceReason: e.target.value }))}
                rows={3} placeholder="Reason for absence..." className={cn(inputCls, 'resize-none')} />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setAttendModal(null)}>Cancel</Button>
            <Button onClick={handleAttend} loading={submitting}>Mark Attendance</Button>
          </div>
        </div>
      </Modal>

      {/* Create Activity Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Activity" size="xl">
        <div className="space-y-5">
          {/* Basic details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Activity Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Monthly Meeting" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Activity Type *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Venue</label>
              <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Location" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start Time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Activity description..." className={cn(inputCls, 'resize-none')} />
            </div>
          </div>

          {/* Member targeting */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
            <button onClick={() => setShowFilterPanel(v => !v)} className="w-full flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-2"><Filter className="w-4 h-4 text-[#1E3A8A]" /> Member Targeting & Invitations</span>
              {showFilterPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showFilterPanel && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>Membership Type</label>
                    <select value={form.targetMembershipType} onChange={e => setForm(f => ({ ...f, targetMembershipType: e.target.value }))} className={inputCls}>
                      <option value="all">All</option>
                      <option value="adolescent">Adolescent</option>
                      <option value="adult">Adult</option>
                      <option value="parent_guardian">Parent/Guardian</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Gender</label>
                    <select value={form.targetGender} onChange={e => setForm(f => ({ ...f, targetGender: e.target.value }))} className={inputCls}>
                      <option value="all">All</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Min Age</label>
                    <input type="number" value={form.targetAgeMin} onChange={e => setForm(f => ({ ...f, targetAgeMin: e.target.value }))} placeholder="e.g. 13" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Max Age</label>
                    <input type="number" value={form.targetAgeMax} onChange={e => setForm(f => ({ ...f, targetAgeMax: e.target.value }))} placeholder="e.g. 25" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>People Needed</label>
                  <input type="number" value={form.peopleNeeded} onChange={e => setForm(f => ({ ...f, peopleNeeded: e.target.value }))} placeholder="0 = unlimited" className={inputCls} />
                </div>
                <button onClick={runFilter} disabled={filterLoading}
                  className="flex items-center gap-2 bg-[#1E3A8A]/10 hover:bg-[#1E3A8A]/20 text-[#1E3A8A] dark:text-blue-400 font-bold px-4 py-2 rounded-xl transition-colors text-sm disabled:opacity-50">
                  {filterLoading ? <div className="w-4 h-4 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" /> : <Filter className="w-4 h-4" />}
                  Preview Matching Members
                </button>

                {filterPreview.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{filterPreview.length} matching members</p>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedInvitees(filterPreview.map(u => u._id))} className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">Select all</button>
                        <button onClick={() => setSelectedInvitees([])} className="text-xs text-red-500 font-semibold hover:underline">Clear</button>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                      {filterPreview.map(u => {
                        const age = calcAge(u.dob);
                        const selected = selectedInvitees.includes(u._id);
                        return (
                          <label key={u._id} className={cn('flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors', selected ? 'bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800')}>
                            <input type="checkbox" checked={selected} onChange={e => setSelectedInvitees(prev => e.target.checked ? [...prev, u._id] : prev.filter(id => id !== u._id))} className="rounded accent-[#1E3A8A]" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{u.fullName}</p>
                              <p className="text-xs text-slate-400 capitalize">{membershipTypeLabel(u.membershipType)}{age !== null ? ` · age ${age}` : ''} · {u.gender}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{selectedInvitees.length} selected for invitation</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={submitting}>Create & Invite</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
