'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { notificationService } from '@/services/doctorApi.service';
import { NotificationItem } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Bell, UserPlus, CalendarCheck, CalendarX, AlertTriangle,
  Ambulance, FlaskConical, MessageSquare, CheckCheck, Loader2,
  ChevronRight, Clock,
} from 'lucide-react';

const NOTIFICATION_ICONS: Record<NotificationItem['type'], React.FC<{ className?: string }>> = {
  new_consultation: UserPlus,
  new_booking: CalendarCheck,
  cancelled_appointment: CalendarX,
  ai_alert: AlertTriangle,
  emergency_referral: Ambulance,
  lab_result: FlaskConical,
  message: MessageSquare,
};

const NOTIFICATION_COLORS: Record<NotificationItem['type'], string> = {
  new_consultation: 'text-blue-500 bg-blue-500/10',
  new_booking: 'text-green-500 bg-green-500/10',
  cancelled_appointment: 'text-red-500 bg-red-500/10',
  ai_alert: 'text-yellow-500 bg-yellow-500/10',
  emergency_referral: 'text-orange-500 bg-orange-500/10',
  lab_result: 'text-purple-500 bg-purple-500/10',
  message: 'text-cyan-500 bg-cyan-500/10',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function groupByDate(items: NotificationItem[]): Map<string, NotificationItem[]> {
  const groups = new Map<string, NotificationItem[]>();
  for (const item of items) {
    const key = new Date(item.createdAt).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

export default function DoctorNotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data.data || []);
    } catch {
      toast.error('Failed to load notifications');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    if (markingIds.has(id)) return;
    setMarkingIds(prev => new Set(prev).add(id));
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
    setMarkingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  if (!_hydrated || !isAuthenticated) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const grouped = groupByDate(notifications);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted mt-1">
            Stay updated with your latest activities
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted" />
        </div>
      ) : notifications.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-12 h-12 text-muted mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No notifications yet</h3>
          <p className="text-sm text-muted mt-1 max-w-sm">
            You'll see notifications here when patients book consultations, send messages, or when AI alerts are triggered.
          </p>
        </div>
      ) : (
        /* Grouped list */
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{dateLabel}</h2>
              <div className="space-y-1">
                {items.map(n => {
                  const Icon = NOTIFICATION_ICONS[n.type] || Bell;
                  const colorClass = NOTIFICATION_COLORS[n.type] || 'text-gray-500 bg-gray-500/10';
                  const isMarking = markingIds.has(n._id);
                  return (
                    <button
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkRead(n._id)}
                      disabled={n.isRead || isMarking}
                      className={cn(
                        'w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all',
                        n.isRead
                          ? 'border-default bg-card-bg'
                          : 'border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06] cursor-pointer',
                        isMarking && 'opacity-60'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm truncate', n.isRead ? 'text-foreground' : 'text-foreground font-semibold')}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[11px] text-muted flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(n.createdAt)}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      </div>

                      <ChevronRight className={cn('w-4 h-4 shrink-0 mt-2.5', n.isRead ? 'text-muted/30' : 'text-primary')} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
