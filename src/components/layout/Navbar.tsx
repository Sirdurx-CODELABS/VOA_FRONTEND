'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { notificationService } from '@/services/api.service';
import { Notification } from '@/types';
import { Menu, Bell, Sun, Moon, LogOut, Settings, ChevronDown, Calendar, MessageSquare, Heart, Trophy, Info } from 'lucide-react';
import { formatDateTime, getInitials, cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

/* Notification type → icon + style */
const notifMeta = (type: string) => {
  switch (type) {
    case 'event_reminder': return { icon: Calendar,      cls: 'notif-program',     label: 'Program' };
    case 'welfare':        return { icon: Heart,         cls: 'notif-welfare',     label: 'Welfare' };
    case 'achievement':    return { icon: Trophy,        cls: 'notif-achievement', label: 'Achievement' };
    case 'announcement':   return { icon: MessageSquare, cls: 'notif-general',     label: 'Announcement' };
    default:               return { icon: Info,          cls: 'notif-general',     label: 'General' };
  }
};

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toggleSidebar, darkMode, toggleDarkMode } = useUIStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationService.getAll({ limit: 8 }),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(notifRes.data.data);
      setUnread(countRes.data.data.count);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    logout();
    toast.success('See you soon! 👋');
    router.push('/login');
  };

  return (
    <header className="h-16 lg:h-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-5 gap-2 sticky top-0 z-10 shadow-sm">
      {/* Hamburger */}
      <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors shrink-0">
        <Menu className="w-5 h-5" />
      </button>

      {/* Org name — hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-2 flex-1 ml-1 min-w-0">
        <span className="text-sm font-bold gradient-text truncate">Voice of Adolescents</span>
        <span className="text-slate-300 dark:text-slate-700 hidden md:block">·</span>
        <span className="text-xs text-slate-400 font-medium hidden md:block whitespace-nowrap">Management System</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Dark mode */}
        <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" title={darkMode ? 'Light mode' : 'Dark mode'}>
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <Bell className={cn('w-4 h-4 transition-transform', notifOpen && 'animate-bounce-in')} />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#F97316] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 animate-bounce-in">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 notif-dropdown bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 animate-slide-down overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-[#1E3A8A]/5 to-transparent dark:from-[#1E3A8A]/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1E3A8A] flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                  {unread > 0 && <span className="bg-[#F97316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread} new</span>}
                </div>
                {unread > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-0.5">No new notifications</p>
                  </div>
                ) : notifications.map((n) => {
                  const meta = notifMeta(n.type);
                  const Icon = meta.icon;
                  return (
                    <div key={n._id} className={cn('flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer', !n.isRead && 'bg-blue-50/40 dark:bg-blue-900/10')}>
                      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', meta.cls)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm font-semibold leading-tight', !n.isRead ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400')}>{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 bg-[#F97316] rounded-full shrink-0 mt-1" />}
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
                  className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 hover:underline w-full text-center">
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

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
                    <p className="text-xs text-[#F97316] font-semibold capitalize">{user?.isVice ? 'Vice ' : ''}{user?.role?.replace(/_/g, ' ')}</p>
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
}
