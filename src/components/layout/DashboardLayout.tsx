'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Navbar } from './Navbar';
import { ThemeSync } from './ThemeSync';
import { cn } from '@/lib/utils';

const LOGO_URL = 'https://res.cloudinary.com/dvqfrm6rc/image/upload/v1775567811/VOA_LOGO_jriqh6.png';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, _hydrated, organization, user } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const orgLogo = organization?.logoUrl || LOGO_URL;
  const footerText = user?.role === 'super_admin' ? 'VOA Super Admin Dashboard' : 'VOA Admin Dashboard';

  if (!_hydrated) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={orgLogo} alt={`${organization?.organizationName || 'VOA'} Logo`} width={80} height={80}
            style={{ width: 80, height: 80, objectFit: 'contain', animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-cta animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-xs text-muted font-medium tracking-wide">Loading {organization?.organizationName || 'VOA'} System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-main-bg flex flex-col">
      <ThemeSync />
      <div className="flex flex-1">
        <Sidebar />
        {/* Content shifts right on lg+ to avoid sidebar overlap */}
        <div className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out bottom-nav-spacer',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]',
        )}>
          <Navbar />
          <main className="page-padding content-area flex-1">
            {children}
          </main>
          {/* Dashboard Footer */}
          <footer className="px-4 md:px-6 py-3 border-t border-default bg-navbar-bg">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted font-medium">
                {footerText}
              </p>
              <p className="text-xs text-muted">
                &copy; {new Date().getFullYear()} VOA
              </p>
            </div>
          </footer>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
