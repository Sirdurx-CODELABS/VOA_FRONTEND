'use client';
import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Settings, Info, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  _id: string; title: string; message: string; type: 'info' | 'warning' | 'success' | 'error';
  read: boolean; createdAt: string; link?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { _id: '1', title: 'New hospital registered', message: 'City Hospital has been registered on the platform', type: 'info', read: false, createdAt: new Date().toISOString() },
    { _id: '2', title: 'Website published', message: 'Website for HealthFirst Organisation has been published', type: 'success', read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: '3', title: 'Subscription expiring', message: '3 subscriptions will expire in the next 7 days', type: 'warning', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
  ]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'all' ? notifications : notifications.filter(n => !n.read);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const toggleRead = (id: string) => setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: !n.read } : n));
  const deleteNotification = (id: string) => setNotifications(prev => prev.filter(n => n._id !== id));

  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800',
  };
  const typeIcons = { info: Info, warning: AlertTriangle, success: CheckCircle, error: AlertTriangle };

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-400 mt-1">{notifications.filter(n => !n.read).length} unread</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'unread'].map(f => (
            <button key={f} onClick={() => setFilter(f as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${filter === f ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'} transition-colors`}
            >{f}</button>
          ))}
          <button onClick={markAllRead} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(n => {
          const Icon = typeIcons[n.type];
          return (
            <div key={n._id} className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-sm transition-colors ${n.read ? 'border-slate-200 dark:border-slate-800' : 'border-[#1E3A8A]/30 dark:border-[#1E3A8A]/50'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl ${typeStyles[n.type].split(' ')[0]} ${typeStyles[n.type].split(' ')[1]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`text-sm ${n.read ? 'font-medium text-slate-600 dark:text-slate-400' : 'font-bold text-slate-800 dark:text-white'}`}>{n.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => toggleRead(n._id)} className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${n.read ? 'text-slate-300' : 'text-[#1E3A8A]'}`}><CheckCheck className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteNotification(n._id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">{format(new Date(n.createdAt), 'MMM d, yyyy HH:mm')}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
