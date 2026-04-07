'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';
import { VOALogoSVG } from '@/components/ui/VOALogo';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useAuthStore();
  const { sidebarOpen, darkMode } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  if (!_hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <VOALogoSVG size={72} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Loading VOA System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A]">
      <Sidebar />
      {/* Content shifts right on lg+ to avoid sidebar overlap */}
      <div className={cn(
        'transition-all duration-300 ease-in-out min-w-0',
        // Mobile: no margin (sidebar is overlay)
        // lg: collapsed sidebar = 70px, expanded = 256px
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]',
      )}>
        <Navbar />
        <main className="page-padding content-area min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
