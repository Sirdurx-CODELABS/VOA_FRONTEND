'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';

const LOGO_URL = 'https://res.cloudinary.com/dvqfrm6rc/image/upload/v1775567811/VOA_LOGO_jriqh6.png';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, _hydrated, organization, user } = useAuthStore();
  const { sidebarOpen, darkMode } = useUIStore();

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('voa_ui');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state && parsed.state.darkMode !== undefined) {
          // User has a stored preference — don't override
          return;
        }
      } catch {}
    }
    // No stored preference — auto-detect from OS
    if (prefersDark) {
      useUIStore.getState().toggleDarkMode();
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const orgLogo = organization?.logoUrl || LOGO_URL;
  const footerText = user?.role === 'super_admin' ? 'VOA Super Admin Dashboard' : 'VOA Admin Dashboard';

  if (!_hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={orgLogo} alt={`${organization?.organizationName || 'VOA'} Logo`} width={80} height={80}
            style={{ width: 80, height: 80, objectFit: 'contain', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Loading {organization?.organizationName || 'VOA'} System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex flex-col">
      <div className="flex flex-1">
        <Sidebar />
        {/* Content shifts right on lg+ to avoid sidebar overlap */}
        <div className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]',
        )}>
          <Navbar />
          <main className="page-padding content-area flex-1">
            {children}
          </main>
          {/* Dashboard Footer */}
          <footer className="px-4 md:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                {footerText}
              </p>
              <p className="text-xs text-slate-400">
                &copy; {new Date().getFullYear()} VOA
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
