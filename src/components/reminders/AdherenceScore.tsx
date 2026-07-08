'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Calendar, Loader2 } from 'lucide-react';
import { AdherenceAnalytics } from '@/types';
import { adherenceService } from '@/services/clinicalApi.service';

interface AdherenceScoreProps {
  patientId: string;
  days?: number;
}

export function AdherenceScore({ patientId, days = 30 }: AdherenceScoreProps) {
  const [data, setData] = useState<AdherenceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adherenceService.getAnalytics(patientId, days);
        setData(res.data.data);
      } catch {
        setError('Failed to load adherence data');
      }
      setLoading(false);
    };
    fetch();
  }, [patientId, days]);

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (error) return <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">{error}</div>;
  if (!data) return null;

  const scoreColor = data.score >= 80 ? 'text-green-600' : data.score >= 50 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = data.score >= 80 ? 'bg-green-100 dark:bg-green-900/30' : data.score >= 50 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className={`flex items-center justify-center w-16 h-16 rounded-full ${scoreBg}`}>
          <span className={`text-2xl font-bold ${scoreColor}`}>{data.score}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Adherence Score</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{data.completed} of {data.total} completed in {days} days</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
            <div className={`h-1.5 rounded-full transition-all ${data.score >= 80 ? 'bg-green-500' : data.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${data.score}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Streak</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.streak} days</p>
        </div>

        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Reminders</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{data.completed}/{data.total}</p>
        </div>
      </div>

      {Object.keys(data.byType).length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">By Type</p>
          <div className="space-y-1.5">
            {Object.entries(data.byType).map(([type, val]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 w-24 capitalize truncate">{type.replace(/_/g, ' ')}</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${val.total > 0 ? (val.completed / val.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{val.completed}/{val.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
