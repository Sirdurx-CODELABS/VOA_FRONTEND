'use client';
import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '@/services/api.service';
import { Notification } from '@/types';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Table';
import { formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll({ page, limit: 15 });
      setNotifications(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    toast.success('All marked as read');
    load();
  };

  const handleDelete = async (id: string) => {
    await notificationService.delete(id);
    load();
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markRead(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Your activity and system alerts</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead}><CheckCheck className="w-4 h-4" /> Mark all read</Button>
      </div>

      <Card>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">No notifications yet</p>
            </div>
          ) : notifications.map((n) => (
            <div key={n._id} className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Bell className={`w-4 h-4 ${!n.isRead ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{n.title}</p>
                  {!n.isRead && <Badge variant="info" className="shrink-0">New</Badge>}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button onClick={() => handleMarkRead(n._id)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Mark read">
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => handleDelete(n._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
