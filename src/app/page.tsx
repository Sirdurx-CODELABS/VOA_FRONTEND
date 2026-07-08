'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getDashboardRoute } from '@/lib/permissions';
import { Building2, Heart, ArrowRight, Loader2, Shield, Activity, Microscope, Pill, Users } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, portal, _hydrated } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!_hydrated) return;
    if (isAuthenticated) {
      setRedirecting(true);
      const user = useAuthStore.getState().user;
      if (user) {
        const timer = setTimeout(() => router.replace(getDashboardRoute(user)), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [_hydrated, isAuthenticated, portal, router]);

  if (_hydrated && isAuthenticated && redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
            <span className="text-white font-extrabold text-xl">V</span>
          </div>
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          <p className="text-blue-200 text-sm font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (_hydrated && isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col lg:flex-row">
      {/* Left Side - Hero */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 min-h-[50vh] lg:min-h-screen overflow-hidden flex items-center">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]">
            <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <pattern id="med-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="1000" height="1000" fill="url(#med-grid)" />
            </svg>
          </div>
          <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        {/* Medical icons floating */}
        <div className="absolute top-20 left-10 opacity-20 animate-pulse">
          <Activity className="w-16 h-16 text-blue-300" />
        </div>
        <div className="absolute bottom-32 right-16 opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>
          <Microscope className="w-12 h-12 text-indigo-300" />
        </div>
        <div className="absolute top-1/2 right-8 opacity-20 animate-pulse" style={{ animationDelay: '2s' }}>
          <Pill className="w-10 h-10 text-blue-200" />
        </div>

        <div className="relative z-10 px-8 sm:px-12 lg:px-16 xl:px-20 py-12 lg:py-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium tracking-widest uppercase">VOA Health</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Modern Healthcare Management Platform
          </h1>

          <p className="text-blue-200/80 text-base sm:text-lg leading-relaxed max-w-lg mb-10">
            Manage patients, consultations, AI clinical assistance, pharmacy, laboratory, 
            referrals, and hospital operations from one secure platform.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {['AI Clinical Assistant', 'EMR System', 'Pharmacy Mgmt', 'Laboratory', 'Patient Care', 'Referrals'].map(f => (
              <span key={f} className="text-xs px-3.5 py-1.5 rounded-full bg-white/10 text-blue-200 border border-white/10 backdrop-blur-sm">
                {f}
              </span>
            ))}
          </div>

          {/* Bottom branding */}
          <div className="mt-16 flex items-center gap-2 text-blue-300/60 text-xs">
            <Shield className="w-3 h-3" />
            HIPAA Compliant &bull; Secure &bull; Reliable
          </div>
        </div>
      </div>

      {/* Right Side - Portal Cards */}
      <div className="lg:w-1/2 flex items-center justify-center px-6 sm:px-10 py-12 lg:py-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center lg:text-left mb-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to VOA</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Select your portal to continue</p>
          </div>

          {/* Organisation Portal Card */}
          <Link
            href="/login"
            className="group block p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                  VOA Organisation Portal
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Manage organisations, support groups, programmes, members and reports.
                </p>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  Organisation Login
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['Members', 'Programmes', 'Finance', 'Reports'].map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>

          {/* HMS Portal Card */}
          <Link
            href="/hms/login"
            className="group block p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shrink-0">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                  Hospital Management System
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Clinical consultations, EMR, AI Clinical Assistant, Pharmacy, Laboratory and Patient Care.
                </p>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                  Hospital Login
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['EMR', 'Pharmacy', 'Laboratory', 'AI Assistant', 'Consultations'].map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">
            Powered by VOA &mdash; Voice of Adolescents
          </p>
        </div>
      </div>
    </div>
  );
}