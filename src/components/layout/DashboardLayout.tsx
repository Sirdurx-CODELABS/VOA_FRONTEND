'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useAuthStore();
  const { sidebarOpen, darkMode } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Only redirect AFTER Zustand has finished rehydrating from localStorage.
  // Without this guard, the first render always sees isAuthenticated=false
  // and immediately redirects — even when the user is logged in.
  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [_hydrated, isAuthenticated, router]);

  // Show a full-screen loader while waiting for localStorage to rehydrate.
  // This prevents the flash-to-login on refresh.
  if (!_hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A] flex items-center justify-center shadow-lg">
            <span className="text-white font-extrabold text-lg">V</span>
          </div>
          <Loader2 className="w-5 h-5 text-[#1E3A8A] animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading VOA System...</p>
        </div>
      </div>
    );
  }

  // Hydrated but not authenticated — redirect is in flight, render nothing
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A]">
      <Sidebar />
      <div className={cn('transition-all duration-300 ease-in-out', sidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]')}>
        <Navbar />
        <main className="p-4 md:p-6 min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
