'use client';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { connectSocket } from '@/services/socket.service';
import { notificationService } from '@/services/api.service';
import { Notification } from '@/types';
import { Menu, Bell, Sun, Moon, Monitor, LogOut, Settings, ChevronDown, Calendar, MessageSquare, Heart, Trophy, Info, Stethoscope, Pill, FlaskConical, HeartHandshake, ClipboardPlus, AlertTriangle, Globe, Building2, X } from 'lucide-react';
import { formatDateTime, getInitials, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

const CLINICAL_ROLES = ['doctor', 'nurse', 'pharmacist', 'lab_scientist', 'adherence_counselor', 'case_manager', 'hospital_admin'];

/* Notification type → icon + style */
const notifMeta = (type: string) => {
  const clinicalIcons: Record<string, { icon: any; cls: string; label: string }> = {
    triage_emergency:   { icon: AlertTriangle, cls: 'notif-critical',  label: 'Emergency' },
    triage_urgent:      { icon: Stethoscope,   cls: 'notif-critical',  label: 'Triage' },
    lab_critical_flagged: { icon: FlaskConical, cls: 'notif-critical', label: 'Lab Critical' },
    lab_result_uploaded:  { icon: FlaskConical, cls: 'notif-program',  label: 'Lab Result' },
    prescription_ready:   { icon: Pill,         cls: 'notif-welfare',  label: 'Prescription' },
    prescription_dispensed: { icon: Pill,       cls: 'notif-program',  label: 'Dispensed' },
    counseling_session_scheduled: { icon: HeartHandshake, cls: 'notif-welfare', label: 'Counseling' },
    case_assigned:        { icon: ClipboardPlus, cls: 'notif-critical', label: 'Case' },
    appointment_reminder: { icon: Calendar,      cls: 'notif-program',  label: 'Appointment' },
  };
  if (clinicalIcons[type]) return clinicalIcons[type];
  switch (type) {
    case 'event_reminder': return { icon: Calendar,      cls: 'notif-program',     label: 'Program' };
    case 'welfare':        return { icon: Heart,         cls: 'notif-welfare',     label: 'Welfare' };
    case 'achievement':    return { icon: Trophy,        cls: 'notif-achievement', label: 'Achievement' };
    case 'announcement':   return { icon: MessageSquare, cls: 'notif-general',     label: 'Announcement' };
    default:               return { icon: Info,          cls: 'notif-general',     label: 'General' };
  }
};

export const Navbar = memo(function Navbar() {
  const router = useRouter();
  const pathname = usePathname?.() || '';
  const isDoctorRoute = pathname.startsWith('/dashboard/doctor');
  const { user, organization, logout } = useAuthStore();
  const { toggleSidebar, theme, setTheme } = useUIStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const clinNotifRef = useRef<HTMLDivElement>(null);

  const isClinicalRole = user?.role && CLINICAL_ROLES.includes(user.role);
  const clinNotifs = useNotificationStore((s) => s.notifications);
  const clinUnread = useNotificationStore((s) => s.unreadCount);
  const clinFetch = useNotificationStore((s) => s.fetch);
  const clinFetchUnread = useNotificationStore((s) => s.fetchUnreadCount);
  const clinMarkRead = useNotificationStore((s) => s.markRead);
  const clinMarkAllRead = useNotificationStore((s) => s.markAllRead);
  const clinInitSocket = useNotificationStore((s) => s.initSocketListener);
  const clinDestroySocket = useNotificationStore((s) => s.destroySocketListener);
  const [clinNotifOpen, setClinNotifOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const workspace = useWorkspaceStore();
  const [wsOpen, setWsOpen] = useState(false);
  const [wsType, setWsType] = useState<'hospital' | 'organisation'>('hospital');
  const [wsEntities, setWsEntities] = useState<any[]>([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsSearch, setWsSearch] = useState('');
  const wsRef = useRef<HTMLDivElement>(null);

  const fetchWorkspaceEntities = useCallback(async (type: 'hospital' | 'organisation') => {
    setWsLoading(true);
    try {
      const { superAdminService } = await import('@/services/api.service');
      if (type === 'hospital') {
        const res = await superAdminService.getHospitals({ limit: 100 });
        setWsEntities(res.data?.data || []);
      } else {
        const res = await superAdminService.getOrganizations({ limit: 100 });
        setWsEntities(res.data?.data || []);
      }
    } catch { setWsEntities([]); }
    setWsLoading(false);
  }, []);

  const handleWorkspaceSelect = (entity: any) => {
    if (wsType === 'hospital') {
      workspace.setHospital({ _id: entity._id, name: entity.name || entity.hospitalName, type: 'hospital', logoUrl: entity.logoUrl });
    } else {
      workspace.setOrganisation({ _id: entity._id, name: entity.organizationName || entity.name, type: 'organisation', logoUrl: entity.logoUrl });
    }
    setWsOpen(false);
    router.push(wsType === 'hospital' ? '/dashboard' : '/dashboard');
  };

  const handleClearWorkspace = () => {
    workspace.clearWorkspace();
    setWsOpen(false);
    router.push('/dashboard/admin');
  };

  useEffect(() => {
    if (wsOpen && isSuperAdmin) fetchWorkspaceEntities(wsType);
  }, [wsOpen, wsType, isSuperAdmin, fetchWorkspaceEntities]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifs = useCallback(async () => {
    if (isDoctorRoute) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationService.getAll({ limit: 8 }),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifRes.data.data);
      setUnread(countRes.data.data.count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    if (isClinicalRole && user?._id) {
      const token = localStorage.getItem('token');
      if (token) {
        connectSocket(token);
        clinInitSocket();
      }
    }
    return () => {
      if (isClinicalRole) clinDestroySocket();
    };
  }, [isClinicalRole, user?._id, clinInitSocket, clinDestroySocket]);

  useEffect(() => {
    if (isClinicalRole) {
      clinFetch();
      clinFetchUnread();
    }
  }, [isClinicalRole, clinFetch, clinFetchUnread]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (clinNotifRef.current && !clinNotifRef.current.contains(e.target as Node)) setClinNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    toast.success('See you soon! 👋');
    router.push('/login');
  }, [logout, router]);

  return (
    <header className="h-16 lg:h-20 bg-navbar-bg border-b border-default flex items-center justify-between px-3 md:px-5 gap-2 sticky top-0 z-10 shadow-sm">
      {/* Hamburger */}
      <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors shrink-0">
        <Menu className="w-5 h-5" />
      </button>

      {/* Org name — hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-2 flex-1 ml-1 min-w-0">
        <span className="text-sm font-bold gradient-text truncate">{organization?.organizationName || 'Voice of Adolescents'}</span>
        <span className="text-slate-300 dark:text-slate-700 hidden md:block">·</span>
        <span className="text-xs text-slate-400 font-medium hidden md:block whitespace-nowrap">Management System</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Workspace Switcher (Super Admin only) */}
        {isSuperAdmin && (
          <div className="relative" ref={wsRef}>
            <button onClick={() => setWsOpen(!wsOpen)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
                workspace.type === 'global'
                  ? 'border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
                  : workspace.type === 'hospital'
                  ? 'border-blue-500/30 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline capitalize">{workspace.type}</span>
              {workspace.entity && <span className="hidden md:inline">: {workspace.entity.name}</span>}
              <ChevronDown className={cn('w-3 h-3 transition-transform', wsOpen && 'rotate-180')} />
            </button>

            {wsOpen && (
              <div className="absolute left-0 top-10 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-slide-down overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workspace Switcher</p>
                </div>

                <div className="p-3 space-y-3">
                  {/* Workspace type selector */}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setWsType('hospital')}
                      className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                        wsType === 'hospital'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-default text-slate-600 dark:text-slate-400 hover:bg-hover'
                      )}>
                      <Building2 className="w-4 h-4" /> Hospital
                    </button>
                    <button onClick={() => setWsType('organisation')}
                      className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                        wsType === 'organisation'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-default text-slate-600 dark:text-slate-400 hover:bg-hover'
                      )}>
                      <Building2 className="w-4 h-4" /> Organisation
                    </button>
                  </div>

                  {/* Search */}
                  <input type="text" value={wsSearch} onChange={e => setWsSearch(e.target.value)}
                    placeholder={`Search ${wsType}s...`}
                    className="w-full px-3 py-2 rounded-lg border border-default bg-card-bg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />

                  {/* Entity list */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {wsLoading ? (
                      <div className="py-8 text-center text-xs text-muted">Loading...</div>
                    ) : wsEntities.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted">No {wsType}s found</div>
                    ) : wsEntities
                      .filter((e: any) => {
                        const name = (e.name || e.hospitalName || e.organizationName || '').toLowerCase();
                        return name.includes(wsSearch.toLowerCase());
                      })
                      .slice(0, 20)
                      .map((entity: any) => (
                        <button key={entity._id} onClick={() => handleWorkspaceSelect(entity)}
                          className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-hover transition-colors text-sm"
                        >
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {(entity.name || entity.hospitalName || entity.organizationName || '?').charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate">{entity.name || entity.hospitalName || entity.organizationName}</p>
                            <p className="text-xs text-muted truncate">{entity.state || entity.district || entity.email || ''}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {workspace.type !== 'global' && (
                    <button onClick={handleClearWorkspace}
                      className="w-full px-3 py-2 rounded-lg border border-amber-500/30 text-amber-600 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-3.5 h-3.5" /> Clear Workspace
                    </button>
                  )}
                  <button onClick={() => { router.push('/dashboard/admin'); setWsOpen(false); }}
                    className="w-full px-3 py-2 rounded-lg text-xs text-muted hover:bg-hover transition-colors text-center"
                  >
                    Return to Global Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <button onClick={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}
          className="p-2 rounded-xl hover:bg-hover text-secondary transition-colors"
          title={`Theme: ${theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'} (click to change)`}>
          {theme === 'system' ? <Monitor className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-xl hover:bg-hover text-secondary transition-colors">
            <Bell className={cn('w-4 h-4 transition-transform', notifOpen && 'animate-bounce-in')} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-cta text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 animate-bounce-in">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 notif-dropdown bg-card-bg rounded-2xl shadow-2xl border border-default z-50 animate-slide-down overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-gradient-to-r from-[var(--accent-light-bg)] to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                  {unread > 0 && <span className="bg-cta text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread} new</span>}
                </div>
                {unread > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-primary font-semibold hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
               <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-muted" />
                    </div>
                    <p className="text-sm font-medium text-secondary">All caught up!</p>
                    <p className="text-xs text-muted mt-0.5">No new notifications</p>
                  </div>
                ) : notifications.map((n) => {
                  const meta = notifMeta(n.type);
                  const Icon = meta.icon;
                  return (
                    <div key={n._id} className={cn('flex items-start gap-3 px-4 py-3 hover:bg-hover transition-colors cursor-pointer', !n.isRead && 'bg-primary/10')}>
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', meta.cls)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm font-semibold leading-tight', !n.isRead ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400')}>{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 bg-cta rounded-full shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <button onClick={() => { router.push('/dashboard/notifications'); setNotifOpen(false); }}
                  className="text-xs font-bold text-primary hover:underline w-full text-center">
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Notifications */}
        {isClinicalRole && (
          <div className="relative" ref={clinNotifRef}>
            <button onClick={() => { setClinNotifOpen(!clinNotifOpen); setNotifOpen(false); setProfileOpen(false); }}
              className="relative p-2 rounded-xl hover:bg-hover text-secondary transition-colors"
              title="Clinical notifications">
              <Bell className={cn('w-4 h-4 transition-transform', clinNotifOpen && 'animate-bounce-in')} />
              {clinUnread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 animate-bounce-in">
                  {clinUnread > 9 ? '9+' : clinUnread}
                </span>
              )}
            </button>

            {clinNotifOpen && (
              <div className="absolute right-0 top-12 notif-dropdown bg-card-bg rounded-2xl shadow-2xl border border-default z-50 animate-slide-down overflow-hidden" style={{ width: 360 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-gradient-to-r from-emerald-50 dark:from-emerald-900/20 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <Stethoscope className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">Clinical</span>
                    {clinUnread > 0 && <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{clinUnread} new</span>}
                  </div>
                  {clinUnread > 0 && (
                    <button onClick={clinMarkAllRead} className="text-xs text-primary font-semibold hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {clinNotifs.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 bg-hover rounded-full flex items-center justify-center mx-auto mb-3">
                        <Stethoscope className="w-5 h-5 text-muted" />
                      </div>
                      <p className="text-sm font-medium text-secondary">All clear</p>
                      <p className="text-xs text-muted mt-0.5">No clinical notifications</p>
                    </div>
                  ) : clinNotifs.map((n) => {
                    const meta = notifMeta(n.type);
                    const Icon = meta.icon;
                    return (
                      <div key={n._id} onClick={() => clinMarkRead(n._id)}
                        className={cn('flex items-start gap-3 px-4 py-3 hover:bg-hover transition-colors cursor-pointer', !n.read && 'bg-emerald-50 dark:bg-emerald-900/10')}>
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', !n.read ? meta.cls + ' ring-2 ring-emerald-200 dark:ring-emerald-800' : meta.cls)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('text-sm font-semibold leading-tight', !n.read ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400')}>{n.title}</p>
                            {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          {n.patientName && <p className="text-[10px] text-primary font-medium mt-0.5">Patient: {n.patientName}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <button onClick={() => { router.push('/dashboard/clinical'); setClinNotifOpen(false); }}
                    className="text-xs font-bold text-primary hover:underline w-full text-center">
                    View clinical dashboard →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile */}
        <div className="relative ml-1" ref={profileRef}>
          <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Avatar
              name={user?.fullName || ''}
              src={user?.profileImage}
              size="sm"
              superAdmin={user?.role === 'super_admin'}
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">{user?.fullName.split(' ')[0]}</span>
            <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform duration-200', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 py-1.5 animate-slide-down overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={user?.fullName || ''}
                    src={user?.profileImage}
                    size="lg"
                    superAdmin={user?.role === 'super_admin'}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.fullName}</p>
                    <p className="text-xs text-cta font-semibold capitalize">{user?.isVice ? 'Vice ' : ''}{user?.role?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => { router.push('/dashboard/settings'); setProfileOpen(false); }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Settings className="w-4 h-4 text-slate-400" /> Settings
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
