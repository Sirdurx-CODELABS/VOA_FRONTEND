'use client';
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Star, Trophy, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CelebrationModalProps {
  name: string;
  onClose: () => void;
}

export function CelebrationModal({ name, onClose }: CelebrationModalProps) {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const fire = (opts: confetti.Options) =>
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#1E3A8A', '#F97316', '#22C55E', '#FFFFFF', '#FCD34D'], ...opts });

    setTimeout(() => fire({ angle: 60, origin: { x: 0, y: 0.65 } }), 100);
    setTimeout(() => fire({ angle: 120, origin: { x: 1, y: 0.65 } }), 300);
    setTimeout(() => fire({ particleCount: 120, spread: 100, origin: { x: 0.5, y: 0.5 } }), 600);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-bounce-in">
        {/* Top gradient bar */}
        <div className="h-2 gradient-brand w-full" />

        {/* Decorative bg circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50 dark:bg-orange-900/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative p-8 text-center">
          {/* Icon */}
          <div className="relative inline-flex mb-5">
            <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center shadow-lg animate-float">
              <Sparkles className="w-9 h-9 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-7 h-7 bg-[#F97316] rounded-full flex items-center justify-center shadow-md">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
            </span>
          </div>

          {/* Text */}
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
            Welcome to VOA! 🎉
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
            <span className="font-bold text-[#1E3A8A] dark:text-blue-400">{name}</span>, your voice matters.<br />
            You&apos;re now part of a community driving real change.
          </p>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full">
            <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">New Member Badge Earned!</span>
          </div>

          {/* Points */}
          <div className="flex justify-center gap-4 mt-5">
            {[
              { icon: '⭐', label: 'Starter', sub: 'Badge' },
              { icon: '🎯', label: '0 pts', sub: 'Score' },
              { icon: '🌱', label: 'Growing', sub: 'Status' },
            ].map((item) => (
              <div key={item.label} className="text-center px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-xl">{item.icon}</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => { onClose(); router.push('/login'); }}
            className="mt-6 w-full gradient-brand text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-slate-400 mt-3">
            &quot;Empowering Voices. Building Futures.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
