'use client';
import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, SkipForward, HelpCircle, Loader2, X, AlertTriangle, ChevronRight } from 'lucide-react';
import { AIReminder } from '@/types';
import { reminderService } from '@/services/clinicalApi.service';
import { Badge } from '@/components/ui/Badge';

const TYPE_LABELS: Record<string, string> = {
  medication: 'Medication', appointment: 'Appointment', lab: 'Lab',
  refill: 'Refill', art_refill: 'ART Refill', adherence_counselling: 'Adherence',
  vaccination: 'Vaccination', health_check: 'Health Check', exercise: 'Exercise',
  nutrition: 'Nutrition', water: 'Water', sleep: 'Sleep',
  mental_health: 'Mental Health', daily_symptom: 'Symptom Log', custom: 'Custom',
};

const TYPE_COLORS: Record<string, string> = {
  medication: 'bg-blue-100 text-blue-700',
  appointment: 'bg-purple-100 text-purple-700',
  lab: 'bg-amber-100 text-amber-700',
  art_refill: 'bg-red-100 text-red-700',
  adherence_counselling: 'bg-green-100 text-green-700',
  vaccination: 'bg-cyan-100 text-cyan-700',
  custom: 'bg-slate-100 text-slate-700',
};

interface ReminderWidgetProps {
  patientId?: string;
  limit?: number;
  onAction?: () => void;
}

export function ReminderWidget({ patientId, limit = 5, onAction }: ReminderWidgetProps) {
  const [reminders, setReminders] = useState<AIReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = async () => {
    try {
      const params: any = { status: 'pending,sent,snoozed' };
      if (patientId) params.patient = patientId;
      const res = await reminderService.list(params);
      setReminders((res.data.data || []).slice(0, limit));
    } catch {
      setError('Failed to load reminders');
    }
    setLoading(false);
  };

  useEffect(() => { fetchReminders(); }, [patientId, limit]);

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id);
    try {
      await reminderService.action(id, action);
      await fetchReminders();
      onAction?.();
    } catch {
      setError(`Failed to ${action} reminder`);
    }
    setActionLoading(null);
  };

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>;

  if (!reminders.length) return (
    <div className="p-6 text-center text-slate-400 dark:text-slate-500">
      <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p className="text-sm">No pending reminders</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {reminders.map((r) => (
        <div key={r._id} className={`p-3 rounded-lg border transition-all ${r.status === 'snoozed' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <Bell className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-slate-900 dark:text-white truncate">{r.title}</span>
                  <Badge variant={r.status === 'snoozed' ? 'warning' : r.status === 'sent' ? 'info' : 'default'}>
                    {r.status}
                  </Badge>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_COLORS[r.reminderType] || TYPE_COLORS.custom}`}>
                    {TYPE_LABELS[r.reminderType] || r.reminderType}
                  </span>
                </div>
                {r.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.description}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.scheduledTime).toLocaleString()}</span>
                  {r.streak > 0 && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" />Streak: {r.streak}</span>}
                  {r.snoozeCount > 0 && <span>Snoozed: {r.snoozeCount}/{r.maxSnoozes}</span>}
                </div>
              </div>
            </div>
          </div>
          {r.status !== 'completed' && r.status !== 'skipped' && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => handleAction(r._id, 'taken')} disabled={actionLoading === r._id} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-50 transition-colors">
                {actionLoading === r._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Taken
              </button>
              <button onClick={() => handleAction(r._id, 'snoozed')} disabled={actionLoading === r._id} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 disabled:opacity-50 transition-colors">
                <Clock className="w-3 h-3" /> Snooze 10m
              </button>
              <button onClick={() => handleAction(r._id, 'skipped')} disabled={actionLoading === r._id} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors">
                <SkipForward className="w-3 h-3" /> Skip
              </button>
              <button onClick={() => handleAction(r._id, 'need_help')} disabled={actionLoading === r._id} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 disabled:opacity-50 transition-colors ml-auto">
                <HelpCircle className="w-3 h-3" /> Need Help
              </button>
            </div>
          )}
          {r.escalationLevel > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="w-3 h-3" /> Escalation Level {r.escalationLevel} — {r.escalationHistory?.[r.escalationHistory.length - 1]?.escalatedTo?.replace('_', ' ')} notified
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
