'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { activityService } from '@/services/api.service';
import { ActivityParticipant, Activity, User } from '@/types';
import { formatDate, calcAge, membershipTypeLabel, cn } from '@/lib/utils';
import { ClipboardCheck, UserCheck, UserX, Calendar, MapPin, Clock, CheckCircle } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

const responseColor = (s: string) => ({
  accepted: 'text-[#22C55E] bg-green-50 dark:bg-green-900/20',
  declined: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  absent: 'text-[#F97316] bg-orange-50 dark:bg-orange-900/20',
  pending: 'text-slate-400 bg-slate-50 dark:bg-slate-800',
}[s] ?? 'text-slate-400 bg-slate-50');

const attendColor = (s: string) => ({
  present: 'text-[#22C55E] bg-green-50 dark:bg-green-900/20',
  absent: 'text-[#F97316] bg-orange-50 dark:bg-orange-900/20',
  pending: 'text-slate-400 bg-slate-50 dark:bg-slate-800',
}[s] ?? 'text-slate-400 bg-slate-50');

export default function AttendancePage() {
  const { user: me } = useAuthStore();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get('view') === 'admin' && hasPermission(me, PERMISSIONS.MANAGE_ATTENDANCE);

  const [myParticipants, setMyParticipants] = useState<ActivityParticipant[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [activityParticipants, setActivityParticipants] = useState<ActivityParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    activityService.getMy()
      .then(r => setMyParticipants(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (isAdmin) {
      activityService.getAll().then(r => setActivities(r.data.data)).catch(() => {});
    }
  }, [isAdmin]);

  const loadActivityParticipants = useCallback(async (id: string) => {
    if (!id) return;
    setAdminLoading(true);
    try {
      const r = await activityService.getById(id);
      setActivityParticipants(r.data.data.participants);
    } finally { setAdminLoading(false); }
  }, []);

  useEffect(() => { if (selectedActivity) loadActivityParticipants(selectedActivity); }, [selectedActivity, loadActivityParticipants]);

  // Stats for my attendance
  const accepted = myParticipants.filter(p => p.responseStatus === 'accepted').length;
  const present = myParticipants.filter(p => p.attendanceStatus === 'present').length;
  const absent = myParticipants.filter(p => p.attendanceStatus === 'absent').length;
  const total = myParticipants.length;

  // Admin stats
  const adminPresent = activityParticipants.filter(p => p.attendanceStatus === 'present').length;
  const adminAbsent = activityParticipants.filter(p => p.attendanceStatus === 'absent').length;
  const adminAccepted = activityParticipants.filter(p => p.responseStatus === 'accepted').length;
  const adminDeclined = activityParticipants.filter(p => p.responseStatus === 'declined').length;

  const inputCls = 'px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30';

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="page-title text-slate-800 dark:text-white">Attendance</h1>
        <p className="text-sm text-slate-500 mt-1">Activity-based attendance tracking</p>
      </div>

      {/* My Attendance Summary */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">My Attendance Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Invitations', value: total, icon: ClipboardCheck, color: 'text-[#1E3A8A] bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Accepted', value: accepted, icon: CheckCircle, color: 'text-[#22C55E] bg-green-50 dark:bg-green-900/20' },
            { label: 'Present', value: present, icon: UserCheck, color: 'text-[#22C55E] bg-green-50 dark:bg-green-900/20' },
            { label: 'Absent', value: absent, icon: UserX, color: 'text-[#F97316] bg-orange-50 dark:bg-orange-900/20' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* My Activity Attendance List */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">My Activity Records</p>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="skeleton h-5 w-1/2" /><div className="skeleton h-4 w-3/4" />
            </div>
          ))}</div>
        ) : myParticipants.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <ClipboardCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No activity invitations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myParticipants.map(p => {
              const act = p.activityId as Activity;
              return (
                <div key={p._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-white">{act?.title}</p>
                      <p className="text-xs text-slate-400 capitalize mt-0.5">{act?.type?.replace(/_/g, ' ')}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-slate-500">
                        {act?.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(act.date)}</span>}
                        {act?.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{act.startTime}</span>}
                        {act?.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{act.venue}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize', responseColor(p.responseStatus))}>
                        {p.responseStatus}
                      </span>
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize', attendColor(p.attendanceStatus))}>
                        {p.attendanceStatus === 'pending' ? 'Attendance pending' : p.attendanceStatus}
                      </span>
                    </div>
                  </div>
                  {p.responseReason && (
                    <p className="text-xs text-slate-400 mt-2 italic">Reason: {p.responseReason}</p>
                  )}
                  {p.attendanceReason && (
                    <p className="text-xs text-slate-400 mt-1 italic">Absence reason: {p.attendanceReason}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin View */}
      {isAdmin && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Manage Activity Attendance</p>
          <select value={selectedActivity} onChange={e => setSelectedActivity(e.target.value)} className={cn(inputCls, 'w-full sm:w-80 mb-4')}>
            <option value="">Select an activity...</option>
            {activities.map(a => <option key={a._id} value={a._id}>{a.title} — {formatDate(a.date)}</option>)}
          </select>

          {selectedActivity && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Invited', value: activityParticipants.length, color: 'text-[#1E3A8A]' },
                  { label: 'Accepted', value: adminAccepted, color: 'text-[#22C55E]' },
                  { label: 'Present', value: adminPresent, color: 'text-[#22C55E]' },
                  { label: 'Absent', value: adminAbsent, color: 'text-[#F97316]' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm text-center">
                    <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {adminLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-5 py-4 flex gap-4">
                      <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2"><div className="skeleton h-4 w-40" /><div className="skeleton h-3 w-24" /></div>
                    </div>
                  )) : activityParticipants.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm">No participants</div>
                  ) : activityParticipants.map(p => (
                    <div key={p._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A] font-bold text-sm shrink-0">
                          {(p.userId as User)?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{(p.userId as User)?.fullName}</p>
                          <p className="text-xs text-slate-400 capitalize">
                            {membershipTypeLabel((p.userId as User)?.membershipType)}
                            {(p.userId as User)?.dob ? ` · age ${calcAge((p.userId as User).dob)}` : ''}
                          </p>
                          {(p.responseReason || p.attendanceReason) && (
                            <p className="text-xs text-slate-400 italic mt-0.5">{p.responseReason || p.attendanceReason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize', responseColor(p.responseStatus))}>{p.responseStatus}</span>
                        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize', attendColor(p.attendanceStatus))}>{p.attendanceStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
