'use client';
import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '@/services/api.service';
import { Notification } from '@/types';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Table';
import { formatDateTime, cn } from '@/lib/utils';
import { Bell, CheckCheck, Trash2, Filter, Search, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'general', label: 'General' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'event_reminder', label: 'Event Reminder' },
  { value: 'inactivity_alert', label: 'Inactivity Alert' },
  { value: 'welfare', label: 'Welfare' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const buildParams = useCallback(() => {
    const params: Record<string, string | number> = { page, limit: 15 };
    if (filterType) params.type = filterType;
    if (filterRead) params.isRead = filterRead;
    if (search) params.search = search;
    return params;
  }, [page, filterType, filterRead, search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll(buildParams());
      setNotifications(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterRead, search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      toast.success('All marked as read');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.delete(id);
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch { toast.error('Failed'); }
  };

  const typeIcon = (type: string) => {
    const map: Record<string, string> = {
      achievement: '🏆',
      announcement: '📢',
      welfare: '❤️',
      event_reminder: '📅',
      inactivity_alert: '⚠️',
    };
    return map[type] || '🔔';
  };

  const hasActiveFilters = filterType || filterRead || search;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Your activity and system alerts</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={() => { setFilterType(''); setFilterRead(''); setSearch(''); setSearchInput(''); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1e3480] text-white text-xs font-bold transition-colors">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select value={filterRead} onChange={e => setFilterRead(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
            <option value="">All Status</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          <div className="flex-1 min-w-[200px] flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search notifications..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
            </div>
            <button onClick={handleSearch}
              className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1e3480] text-white text-xs font-bold transition-colors">Search</button>
          </div>
        </div>
      </div>

      {/* List */}
      <Card>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No notifications found</p>
              {hasActiveFilters && (
                <button onClick={() => { setFilterType(''); setFilterRead(''); setSearch(''); setSearchInput(''); }}
                  className="mt-2 text-sm text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : notifications.map((n) => (
            <div key={n._id} className={cn(
              'flex items-start gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
              !n.isRead && 'bg-indigo-50/40 dark:bg-indigo-900/8'
            )}>
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base',
                !n.isRead ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-800'
              )}>
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn(
                    'text-sm font-semibold',
                    !n.isRead ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  )}>{n.title}</p>
                  {!n.isRead && (
                    <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">New</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                  <span className="text-[11px] text-slate-400 capitalize">{n.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button onClick={() => handleMarkRead(n._id)}
                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title="Mark as read">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => handleDelete(n._id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
