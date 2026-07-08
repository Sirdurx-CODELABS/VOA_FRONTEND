'use client';
import { memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { useUIStore } from '@/store/uiStore';
import { cn, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, ClipboardList, MessageSquare, UserPlus, Users,
  FolderOpen, FileText, FlaskConical, Share2, Building2,
  CalendarDays, DollarSign, Mail, Bell, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, Stethoscope,
  Search,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard/doctor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Consultations',
    items: [
      { href: '/dashboard/doctor/queue', label: 'Consultation Queue', icon: ClipboardList },
      { href: '/dashboard/doctor/consultations', label: 'My Consultations', icon: MessageSquare },
      { href: '/dashboard/doctor/walk-in', label: 'Walk-in Consultation', icon: UserPlus },
    ],
  },
  {
    label: 'Clinical',
    items: [
      { href: '/dashboard/doctor/patients', label: 'Patients', icon: Users },
      { href: '/dashboard/doctor/medical-records', label: 'Medical Records', icon: FolderOpen },
      { href: '/dashboard/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
      { href: '/dashboard/doctor/lab-requests', label: 'Laboratory Requests', icon: FlaskConical },
      { href: '/dashboard/doctor/referrals', label: 'Referrals', icon: Share2 },
    ],
  },
  {
    label: 'Practice',
    items: [
      { href: '/dashboard/doctor/hospital', label: 'My Hospital', icon: Building2 },
      { href: '/dashboard/doctor/schedule', label: 'Schedule & Availability', icon: CalendarDays },
      { href: '/dashboard/doctor/services', label: 'Services & Pricing', icon: DollarSign },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/dashboard/doctor/messages', label: 'Messages', icon: Mail },
      { href: '/dashboard/doctor/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/dashboard/doctor/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/dashboard/doctor/settings', label: 'Profile & Settings', icon: Settings },
    ],
  },
];

const NavItem = memo(function NavItem({
  href, label, icon: Icon, active, sidebarOpen,
}: {
  href: string; label: string; icon: React.FC<{ className?: string }>; active: boolean; sidebarOpen: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10',
        !sidebarOpen && 'justify-center mx-1',
      )}
      title={!sidebarOpen ? label : undefined}
    >
      <Icon className={cn(
        'w-5 h-5 shrink-0',
        active ? 'text-primary' : 'text-gray-400 dark:text-gray-500',
      )} />
      {sidebarOpen && <span>{label}</span>}
    </Link>
  );
});

export function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { doctor, logout } = useDoctorAuthStore();
  const { sidebarOpen, setSidebar } = useUIStore();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/doctor/login');
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full z-30 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out',
      sidebarOpen ? 'w-64' : 'w-[70px]',
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800 shrink-0',
        sidebarOpen ? 'justify-between' : 'justify-center',
      )}>
        {sidebarOpen ? (
          <>
            <Link href="/dashboard/doctor" className="flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-primary" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">Doctor Portal</span>
            </Link>
            <button
              onClick={() => setSidebar(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button onClick={() => setSidebar(true)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search bar */}
      {sidebarOpen && (
        <div className="px-3 pt-3">
          <Link
            href="/dashboard/doctor/patients"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-xs hover:bg-gray-200 dark:hover:bg-white/15 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search patients...</span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 pt-3 pb-2 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            {sidebarOpen && (
              <p className="px-5 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(item.href, (item as { exact?: boolean }).exact)}
                  sidebarOpen={sidebarOpen}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Doctor Profile */}
      <div className={cn(
        'border-t border-gray-200 dark:border-gray-800 p-3 shrink-0',
        sidebarOpen ? 'block' : 'flex justify-center',
      )}>
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
              {doctor?.name ? getInitials(doctor.name) : 'Dr'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                {doctor?.name || 'Doctor'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {doctor?.specialization || 'Healthcare Provider'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative group">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
              {doctor?.name ? getInitials(doctor.name) : 'Dr'}
            </div>
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-200 dark:border-gray-700">
                <p className="font-semibold">{doctor?.name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-[10px]">{doctor?.specialization}</p>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-400 mt-1 text-xs font-medium">Logout</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
