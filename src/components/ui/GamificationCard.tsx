'use client';
import { cn } from '@/lib/utils';
import { Trophy, Star, Zap, Heart, Target, Award, TrendingUp, Shield } from 'lucide-react';

interface Badge {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  earned: boolean;
}

const BADGES: Badge[] = [
  { id: 'new_member',   label: 'New Member',    description: 'Joined VOA',              icon: Star,       color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20',   earned: true },
  { id: 'active',       label: 'Active Voice',  description: '7-day streak',            icon: Zap,        color: 'text-[#F97316]',  bg: 'bg-orange-50 dark:bg-orange-900/20', earned: true },
  { id: 'helper',       label: 'Community Hero',description: 'Helped 5 members',        icon: Heart,      color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',       earned: false },
  { id: 'achiever',     label: 'Achiever',      description: 'Completed 3 programs',    icon: Target,     color: 'text-[#22C55E]',  bg: 'bg-green-50 dark:bg-green-900/20',   earned: false },
  { id: 'leader',       label: 'Leader',        description: 'Assigned a role',         icon: Shield,     color: 'text-[#1E3A8A]',  bg: 'bg-blue-50 dark:bg-blue-900/20',     earned: false },
  { id: 'champion',     label: 'Champion',      description: 'Top 3 leaderboard',       icon: Trophy,     color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', earned: false },
];

interface GamificationCardProps {
  score: number;
  rank?: number;
}

export function GamificationCard({ score, rank }: GamificationCardProps) {
  const level = score < 50 ? 'Starter' : score < 150 ? 'Rising Star' : score < 300 ? 'Contributor' : score < 500 ? 'Champion' : 'Legend';
  const nextLevel = score < 50 ? 50 : score < 150 ? 150 : score < 300 ? 300 : score < 500 ? 500 : 1000;
  const progress = Math.min(100, (score / nextLevel) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header gradient */}
      <div className="gradient-brand-soft p-5 text-white relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-2 w-20 h-20 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Engagement Level</p>
            <p className="text-2xl font-extrabold mt-0.5">{level}</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="relative z-10 mt-4">
          <div className="flex justify-between text-xs text-white/70 mb-1.5">
            <span>{score} pts</span>
            <span>{nextLevel} pts to next level</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
        {[
          { label: 'Score', value: score },
          { label: 'Rank', value: rank ? `#${rank}` : '—' },
          { label: 'Level', value: level.split(' ')[0] },
        ].map(({ label, value }) => (
          <div key={label} className="py-3 text-center">
            <p className="text-base font-extrabold text-slate-800 dark:text-white">{value}</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Badges</p>
        <div className="grid grid-cols-3 gap-2">
          {BADGES.map((badge) => (
            <div key={badge.id} className={cn('flex flex-col items-center p-2.5 rounded-xl text-center transition-all', badge.earned ? badge.bg : 'bg-slate-50 dark:bg-slate-800/50 opacity-40 grayscale')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mb-1', badge.earned ? badge.bg : 'bg-slate-100 dark:bg-slate-800')}>
                <badge.icon className={cn('w-4 h-4', badge.earned ? badge.color : 'text-slate-400')} />
              </div>
              <p className={cn('text-[10px] font-bold leading-tight', badge.earned ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400')}>{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
