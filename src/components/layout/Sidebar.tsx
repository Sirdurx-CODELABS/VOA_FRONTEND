'use client';
import { useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn, getInitials } from '@/lib/utils';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { VOALogo } from '@/components/ui/VOALogo';
import { Avatar } from '@/components/ui/Avatar';
import { SIDEBAR_CONFIG, SidebarItem, SidebarChild } from '@/config/sidebarConfig';
import { notificationService, documentApprovalService } from '@/services/api.service';
import { User } from '@/types';
import toast from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, LogOut, Settings, Building2,
} from 'lucide-react';

/* ── Badge pill ──────────────────────────────────────────────────────────── */
const Badge = memo(function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className={cn(
      'ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0',
      'bg-cta text-white badge-pulse'
    )}>
      {count > 99 ? '99+' : count}
    </span>
  );
});

/* ── Section divider ─────────────────────────────────────────────────────── */
const SectionLabel = memo(function SectionLabel({ label, open }: { label: string; open: boolean }) {
  if (!open) return <div className="mx-2 my-1.5 h-px bg-white/10" />;
  return (
    <div className="px-3 pt-4 pb-1">
      <p className="text-[9px] font-extrabold text-white/30 uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
});

/* ── Single nav item (no children) ──────────────────────────────────────── */
const NavLink = memo(function NavLink({
  item, active, sidebarOpen, badge,
}: {
  item: SidebarItem; active: boolean; sidebarOpen: boolean; badge?: number;
}) {
  const Icon = item.icon;
  const isAdmin = item.adminOnly;

  return (
    <Link
      href={item.href!}
      title={!sidebarOpen ? item.label : undefined}
      className={cn(
        'sidebar-item-hover relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
        'transition-all duration-150 group',
        active
          ? 'text-white border shadow-sm'
          : 'text-white/65 hover:bg-white/10 hover:text-white',
        !sidebarOpen && 'justify-center px-2',
      )}
      style={active ? {
        backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
        borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
      } : undefined}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
          style={{ backgroundColor: 'var(--accent)' }} />
      )}

      <Icon className={cn(
        'w-[18px] h-[18px] shrink-0 transition-colors duration-150',
        active ? 'text-white' : 'text-white/50 group-hover:text-white',
      )} style={active ? { color: 'var(--accent)' } : undefined} />

      {sidebarOpen && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          <Badge count={badge || 0} />
        </>
      )}

      {/* Collapsed badge dot */}
      {!sidebarOpen && !!badge && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-cta rounded-full" />
      )}
    </Link>
  );
});

/* ── Expandable group item ───────────────────────────────────────────────── */
const NavGroup = memo(function NavGroup({
  item, sidebarOpen, badge, user,
}: {
  item: SidebarItem; sidebarOpen: boolean; badge?: number; user: User | null;
}) {
  const pathname = usePathname();
  const { expandedItems, toggleExpanded } = useUIStore();
  const isExpanded = expandedItems.includes(item.id);
  const Icon = item.icon;

  // Filter visible children
  const visibleChildren = (item.children || []).filter((child: SidebarChild) => {
    if (!user) return false;
    if (child.alwaysShow) return true;
    if (child.permission) return hasPermission(user, child.permission);
    if (child.roles) return child.roles.includes(user.role);
    return false;
  });

  if (visibleChildren.length === 0) return null;

  const anyChildActive = visibleChildren.some(c => pathname === c.href || pathname.startsWith(c.href.split('?')[0]));

  // Auto-expand if a child is active
  useEffect(() => {
    if (anyChildActive && !isExpanded) toggleExpanded(item.id);
  }, [pathname, anyChildActive, isExpanded, item.id, toggleExpanded]);

  if (!sidebarOpen) {
    // Collapsed: show icon only, clicking navigates to first child
    return (
      <Link
        href={visibleChildren[0]?.href || '#'}
        title={item.label}
        className={cn(
          'sidebar-item-hover relative flex items-center justify-center px-2 py-2.5 rounded-xl transition-all duration-150 group',
        anyChildActive
          ? 'text-white border'
          : 'text-white/65 hover:bg-white/10 hover:text-white',
        )}
        style={anyChildActive ? {
          backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
          borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
        } : undefined}
      >
        {anyChildActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
            style={{ backgroundColor: 'var(--accent)' }} />
        )}
        <Icon className={cn('w-[18px] h-[18px] shrink-0', anyChildActive ? 'text-white' : 'text-white/50 group-hover:text-white')}
          style={anyChildActive ? { color: 'var(--accent)' } : undefined} />
        {!!badge && <span className="absolute top-1 right-1 w-2 h-2 bg-cta rounded-full" />}
      </Link>
    );
  }

  return (
    <div>
      {/* Group header button */}
      <button
        onClick={() => toggleExpanded(item.id)}
        className={cn(
          'sidebar-item-hover w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
          'transition-all duration-150 group',
        anyChildActive
          ? 'text-white'
          : 'text-white/65 hover:bg-white/10 hover:text-white',
        )}
        style={anyChildActive ? {
          backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
        } : undefined}
      >
        <Icon className={cn('w-[18px] h-[18px] shrink-0', anyChildActive ? 'text-white' : 'text-white/50 group-hover:text-white')}
          style={anyChildActive ? { color: 'var(--accent)' } : undefined} />
        <span className="truncate flex-1 text-left">{item.label}</span>
        <Badge count={badge || 0} />
        <ChevronRight className={cn(
          'w-3.5 h-3.5 shrink-0 text-white/30 transition-transform duration-200',
          isExpanded && 'rotate-90',
        )} />
      </button>

      {/* Children */}
      {isExpanded && (
        <div className="submenu-enter mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
          {visibleChildren.map((child: SidebarChild) => {
            const childActive = pathname === child.href || pathname.startsWith(child.href.split('?')[0]);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  childActive
                    ? 'text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white',
                )}
                style={childActive ? {
                  backgroundColor: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                } : undefined}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', childActive ? 'bg-white' : 'bg-white/20')}
                  style={childActive ? { backgroundColor: 'var(--accent)' } : undefined} />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});

/* ── Main Sidebar ────────────────────────────────────────────────────────── */
export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, organization, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, badgeCounts, setBadgeCounts } = useUIStore();

  // Fetch badge counts periodically
  const fetchBadges = useCallback(async () => {
    if (!user) return;
    try {
      const [notifRes, approvalRes] = await Promise.allSettled([
        notificationService.getUnreadCount(),
        documentApprovalService.getPendingCount(),
      ]);
      const counts: Record<string, number> = {};
      if (notifRes.status === 'fulfilled') {
        counts.unreadNotifications = notifRes.value.data.data.count;
      }
      if (approvalRes.status === 'fulfilled') {
        counts.pendingApprovals = approvalRes.value.data.data.count;
      }
      setBadgeCounts(counts);
    } catch {}
  }, [user, setBadgeCounts]);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  const handleLogout = useCallback(() => {
    logout();
    toast.success('See you soon! 👋');
    router.push('/login');
  }, [logout, router]);

  // Determine visibility
  const isVisible = useCallback((item: SidebarItem): boolean => {
    if (!user) return false;
    if (item.adminOnly) return user.role === 'super_admin';
    if (item.alwaysShow) return true;
    if (item.permission) return hasPermission(user, item.permission);
    if (item.roles) return item.roles.includes(user.role);
    // Group items: visible if any child is visible
    if (item.children) {
      return item.children.some((c: SidebarChild) => {
        if (c.alwaysShow) return true;
        if (c.permission) return hasPermission(user, c.permission);
        if (c.roles) return c.roles.includes(user.role);
        return false;
      });
    }
    return false;
  }, [user]);

  const getBadge = useCallback((key?: string): number => {
    if (!key) return 0;
    return (badgeCounts as unknown as Record<string, number>)[key] || 0;
  }, [badgeCounts]);

  // Group items by section
  const sections = useMemo(() => {
    const result: { label: string; items: SidebarItem[] }[] = [];
    let currentSection = '';
    const visible = SIDEBAR_CONFIG.filter(isVisible);
    visible.forEach(item => {
      const sec = item.section || '';
      if (sec !== currentSection) {
        currentSection = sec;
        result.push({ label: sec, items: [] });
      }
      result[result.length - 1].items.push(item);
    });
    return result;
  }, [isVisible]);

  const roleLabel = user ? `${user.isVice ? 'Vice ' : ''}${user.role.replace(/_/g, ' ')}` : '';
  const roleColor = user?.role === 'super_admin' ? 'text-amber-400' : 'text-cta';

  return (
    <>
      <aside className={cn(
        'fixed top-0 left-0 h-full z-30 flex-col',
        'bg-sidebar transition-all duration-300 ease-in-out',
        'hidden lg:flex',
        sidebarOpen
          ? 'w-64 translate-x-0'
          : 'w-64 -translate-x-full lg:translate-x-0 lg:w-[70px] overflow-hidden',
      )}>

        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div className={cn(
          'flex items-center h-16 lg:h-20 px-4 shrink-0 border-b border-white/10',
          sidebarOpen ? 'justify-between' : 'justify-center',
        )}>
          {sidebarOpen && (
            organization?.logoUrl ? (
              <div className="flex items-center gap-2.5 select-none">
                <img src={organization.logoUrl} alt={organization.organizationName}
                  className="w-[44px] h-[44px] object-contain rounded-xl" />
                <div className="flex flex-col leading-none">
                  <span className="text-white font-extrabold text-base tracking-tight">{organization.shortName || 'VOA'}</span>
                  <span className="text-cta font-medium text-[10px] tracking-widest uppercase">Management</span>
                </div>
              </div>
            ) : <VOALogo onDark size={44} />
          )}
          <button
            onClick={toggleSidebar}
            className={cn(
              'p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200',
              !sidebarOpen && 'rotate-180',
            )}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* ── Role pill ────────────────────────────────────────────── */}
        {sidebarOpen && user && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl bg-white/8 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">Logged in as</p>
            <p className={cn('text-sm font-extrabold capitalize mt-0.5', roleColor)}>{roleLabel}</p>
            {user.role === 'super_admin' && (
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] text-amber-400/70 font-semibold">Full system access</span>
              </div>
            )}
          </div>
        )}

        {/* ── Nav ──────────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
          {sections.map(({ label, items }, sectionIdx) => (
            <div key={`section-${sectionIdx}-${label || 'unlabeled'}`}>
              {label && <SectionLabel label={label} open={sidebarOpen} />}
              {items.map(item => {
                const badge = getBadge(item.badgeKey);

                if (item.children) {
                  return (
                    <NavGroup
                      key={item.id}
                      item={item}
                      sidebarOpen={sidebarOpen}
                      badge={badge}
                      user={user}
                    />
                  );
                }

                const active = pathname === item.href ||
                  (item.href !== '/dashboard' &&
                   !item.href?.startsWith('/constitution') &&
                   !!item.href && pathname.startsWith(item.href));

                return (
                  <NavLink
                    key={item.id}
                    item={item}
                    active={active}
                    sidebarOpen={sidebarOpen}
                    badge={badge}
                  />
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── User footer ──────────────────────────────────────────── */}
        {sidebarOpen && user ? (
          <div className="p-3 border-t border-white/10 shrink-0 space-y-1">
            {/* Profile row */}
            <Link href="/dashboard/settings"
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/10 transition-colors group">
              <Avatar
                name={user.fullName}
                src={user.profileImage}
                size="md"
                superAdmin={user.role === 'super_admin'}
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate leading-tight">{user.fullName}</p>
                <p className="text-[10px] text-white/40 truncate">{user.email}</p>
              </div>
              <Settings className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
            </Link>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-white/50 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        ) : !sidebarOpen && user ? (
          <div className="p-3 border-t border-white/10 flex flex-col items-center gap-2 shrink-0">
            <Link href="/dashboard/settings" title="Settings">
              <Avatar
                name={user.fullName}
                src={user.profileImage}
                size="md"
                superAdmin={user.role === 'super_admin'}
              />
            </Link>
            <button onClick={handleLogout} title="Sign out"
              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
});
