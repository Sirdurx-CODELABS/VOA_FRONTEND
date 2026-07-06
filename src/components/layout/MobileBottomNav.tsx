'use client';
import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';
import { SIDEBAR_CONFIG, SidebarItem, SidebarChild } from '@/config/sidebarConfig';
import { MoreHorizontal, LogOut, X } from 'lucide-react';
import toast from 'react-hot-toast';

function getItemHref(item: SidebarItem, user: ReturnType<typeof useAuthStore.getState>['user']): string | null {
  if (item.href) return item.href;
  if (item.children) {
    const first = item.children.find(c => {
      if (c.alwaysShow) return true;
      if (!user) return false;
      if (c.permission) return hasPermission(user, c.permission);
      if (c.roles) return c.roles.includes(user.role);
      return false;
    });
    return first?.href || null;
  }
  return null;
}

function getVisibleItems(user: ReturnType<typeof useAuthStore.getState>['user']): SidebarItem[] {
  if (!user) return [];
  return SIDEBAR_CONFIG.filter(item => {
    if (item.adminOnly) return user.role === 'super_admin';
    if (item.alwaysShow) return true;
    if (item.permission) return hasPermission(user, item.permission);
    if (item.roles) return item.roles.includes(user.role);
    if (item.children) {
      return item.children.some(c => {
        if (c.alwaysShow) return true;
        if (c.permission) return hasPermission(user, c.permission);
        if (c.roles) return c.roles.includes(user.role);
        return false;
      });
    }
    return false;
  });
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleItems = useMemo(() => getVisibleItems(user), [user]);

  const mainItems = useMemo(() => {
    const dashboard = visibleItems.find(i => i.id === 'dashboard');
    const rest = visibleItems.filter(i => i.id !== 'dashboard');
    const main = [];
    if (dashboard) main.push(dashboard);
    main.push(...rest.slice(0, 3));
    return main;
  }, [visibleItems]);

  const sheetItems = useMemo(() => {
    const mainIds = new Set(mainItems.map(i => i.id));
    return visibleItems.filter(i => !mainIds.has(i.id));
  }, [visibleItems, mainItems]);

  const sheetSections = useMemo(() => {
    const sections: { label: string; items: SidebarItem[] }[] = [];
    let currentSection = '';
    sheetItems.forEach(item => {
      const sec = item.section || '';
      if (sec !== currentSection || sections.length === 0) {
        currentSection = sec;
        sections.push({ label: sec, items: [] });
      }
      sections[sections.length - 1].items.push(item);
    });
    return sections;
  }, [sheetItems]);

  const isActive = useCallback((item: SidebarItem): boolean => {
    const href = getItemHref(item, user);
    if (!href) return false;
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href) && href !== '/dashboard';
  }, [pathname, user]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success('See you soon!');
    router.push('/login');
  }, [logout, router]);

  if (visibleItems.length === 0) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-default flex items-center justify-around px-2 pt-1 pb-1 safe-area-bottom lg:hidden shadow-[0_-2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_8px_rgba(0,0,0,0.3)]">
        {mainItems.map(item => {
          const href = getItemHref(item, user);
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={href || '#'}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-colors min-w-0 flex-1',
                'hover:bg-hover',
                active ? 'text-primary' : 'text-secondary',
              )}
            >
              <Icon className={cn('w-5 h-5', active ? 'text-primary' : '')} />
              <span className="text-[10px] font-semibold truncate w-full text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-xl transition-colors min-w-0 flex-1',
            'hover:bg-hover',
            sheetOpen ? 'text-primary' : 'text-secondary',
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-slide-up overflow-hidden border-t border-default">
            <div className="flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-default">
              <span className="text-sm font-bold">Navigation</span>
              <button onClick={() => setSheetOpen(false)} className="p-1 rounded-lg hover:bg-hover transition-colors">
                <X className="w-4 h-4 text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {sheetSections.map(({ label, items }, i) => (
                <div key={i}>
                  {label && (
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider px-2 pt-3 pb-1">{label}</p>
                  )}
                  {items.map(item => {
                    const href = getItemHref(item, user);
                    const active = isActive(item);
                    const Icon = item.icon;

                    if (item.children) {
                      return (
                        <div key={item.id}>
                          <div className={cn(
                            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium',
                            active ? 'text-primary' : 'text-secondary',
                          )}>
                            <Icon className="w-[18px] h-[18px] shrink-0" />
                            <span className="font-semibold">{item.label}</span>
                          </div>
                          <div className="ml-4 pl-3 border-l border-default space-y-0.5 mb-1">
                            {item.children
                              .filter(child => {
                                if (child.alwaysShow) return true;
                                if (!user) return false;
                                if (child.permission) return hasPermission(user, child.permission);
                                if (child.roles) return child.roles.includes(user.role);
                                return false;
                              })
                              .map(child => {
                                const childActive = pathname === child.href || pathname.startsWith(child.href.split('?')[0]);
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => setSheetOpen(false)}
                                    className={cn(
                                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                                      childActive ? 'text-primary' : 'text-secondary hover:text-primary',
                                    )}
                                  >
                                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', childActive ? 'bg-primary' : 'bg-muted')} />
                                    {child.label}
                                  </Link>
                                );
                              })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.id}
                        href={href || '#'}
                        onClick={() => setSheetOpen(false)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          active ? 'text-primary bg-primary/10' : 'text-secondary hover:bg-hover hover:text-primary',
                        )}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
              <div className="border-t border-default my-2" />
              <button
                onClick={() => { setSheetOpen(false); handleLogout(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <LogOut className="w-[18px] h-[18px] shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="h-2 shrink-0 safe-area-bottom" />
          </div>
        </div>
      )}
    </>
  );
}
