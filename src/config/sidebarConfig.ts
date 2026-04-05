import {
  LayoutDashboard, Users, Calendar, ClipboardCheck, DollarSign,
  FileText, Megaphone, Heart, BarChart2, Bell, Settings,
  BookOpen, ShieldCheck, ClipboardList, GitBranch, Briefcase,
} from 'lucide-react';
import { Permission, PERMISSIONS } from '@/lib/permissions';
import { Role } from '@/types';

export interface SidebarChild {
  label: string;
  href: string;
  permission?: Permission;
  roles?: Role[];
  alwaysShow?: boolean;
}

export interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  permission?: Permission;
  roles?: Role[];
  alwaysShow?: boolean;
  adminOnly?: boolean;
  badgeKey?: string;
  children?: SidebarChild[];
  section?: string;
}

export const SIDEBAR_CONFIG: SidebarItem[] = [
  // ── MAIN ──────────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    alwaysShow: true,
    section: 'Main',
  },

  // ── PEOPLE ────────────────────────────────────────────────────────────────
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    permission: PERMISSIONS.VIEW_ALL_USERS,
    section: 'People',
    children: [
      { label: 'All Members',  href: '/dashboard/users',                 permission: PERMISSIONS.VIEW_ALL_USERS },
      { label: 'Approvals',    href: '/dashboard/users?status=inactive', permission: PERMISSIONS.MANAGE_USERS },
      { label: 'Assign Roles', href: '/dashboard/users?tab=roles',       permission: PERMISSIONS.CHANGE_ROLE_DIRECT },
    ],
  },

  // ── PROGRAMS ──────────────────────────────────────────────────────────────
  {
    id: 'programs',
    label: 'Programs',
    icon: Calendar,
    permission: PERMISSIONS.VIEW_PROGRAMS,
    section: 'Operations',
    children: [
      { label: 'All Programs',   href: '/dashboard/programs',               permission: PERMISSIONS.VIEW_PROGRAMS },
      { label: 'Create Program', href: '/dashboard/programs?action=create', permission: PERMISSIONS.MANAGE_PROGRAMS },
      { label: 'Assigned to Me', href: '/dashboard/programs?filter=mine',   alwaysShow: true },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    permission: PERMISSIONS.VIEW_ATTENDANCE,
    children: [
      { label: 'Record Attendance', href: '/dashboard/attendance',            permission: PERMISSIONS.MANAGE_ATTENDANCE },
      { label: 'My Attendance',     href: '/dashboard/attendance?view=me',    alwaysShow: true },
    ],
  },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    permission: PERMISSIONS.VIEW_ACCOUNTS as Permission,  // all roles with view_accounts see Finance
    section: 'Finance',
    badgeKey: 'pendingTransactions',
    children: [
      { label: 'Contributions',   href: '/dashboard/finance',                   permission: PERMISSIONS.VIEW_CONTRIBUTIONS as Permission },
      { label: 'Transactions',    href: '/dashboard/finance?tab=transactions',   permission: PERMISSIONS.VIEW_FINANCE },
      { label: 'Accounts',        href: '/dashboard/finance?tab=accounts',       permission: PERMISSIONS.MANAGE_ACCOUNTS as Permission },
    ],
  },

  // ── CONTENT ───────────────────────────────────────────────────────────────
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    permission: PERMISSIONS.VIEW_REPORTS,
    section: 'Content',
    children: [
      { label: 'All Reports',     href: '/dashboard/reports',                      permission: PERMISSIONS.VIEW_REPORTS },
      { label: 'Meeting Minutes', href: '/dashboard/reports?type=meeting_minutes', permission: PERMISSIONS.VIEW_REPORTS },
      { label: 'Upload Report',   href: '/dashboard/reports?action=create',        permission: PERMISSIONS.CREATE_REPORTS },
    ],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone,
    permission: PERMISSIONS.VIEW_ANNOUNCEMENTS,
    children: [
      { label: 'All Announcements', href: '/dashboard/announcements',                   permission: PERMISSIONS.VIEW_ANNOUNCEMENTS },
      { label: 'Create Post',       href: '/dashboard/announcements?action=create',     permission: PERMISSIONS.MANAGE_ANNOUNCEMENTS },
      { label: 'Public Posts',      href: '/dashboard/announcements?visibility=public', alwaysShow: true },
    ],
  },

  // ── WELFARE ───────────────────────────────────────────────────────────────
  {
    id: 'welfare',
    label: 'Welfare',
    icon: Heart,
    permission: PERMISSIONS.SUBMIT_WELFARE_REQUEST,
    section: 'Welfare',
    badgeKey: 'pendingWelfare',
    children: [
      { label: 'All Requests',   href: '/dashboard/welfare',               permission: PERMISSIONS.MANAGE_WELFARE },
      { label: 'Submit Request', href: '/dashboard/welfare?action=submit', alwaysShow: true },
    ],
  },

  // ── WORKFLOW ──────────────────────────────────────────────────────────────
  {
    id: 'positions',
    label: 'Position Applications',
    href: '/dashboard/positions',
    icon: Briefcase,
    section: 'Workflow',
    // member (submit), membership_coordinator (review), chairman/super_admin (approve)
    permission: PERMISSIONS.SUBMIT_POSITION_APPLICATION,
    roles: ['member', 'membership_coordinator', 'chairman', 'super_admin'],
  },
  {
    id: 'role_changes',
    label: 'Role Change Requests',
    href: '/dashboard/role-changes',
    icon: GitBranch,
    // membership_coordinator (initiate), chairman/super_admin (approve)
    roles: ['membership_coordinator', 'chairman', 'super_admin'],
  },

  // ── ANALYTICS ─────────────────────────────────────────────────────────────
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart2,
    permission: PERMISSIONS.VIEW_ANALYTICS,
    section: 'Insights',
    children: [
      { label: 'Overview',          href: '/dashboard/analytics',                  permission: PERMISSIONS.VIEW_ANALYTICS },
      { label: 'Leaderboard',       href: '/dashboard/analytics?view=leaderboard', permission: PERMISSIONS.VIEW_ANALYTICS },
      { label: 'Inactive Members',  href: '/dashboard/analytics?view=inactive',    permission: PERMISSIONS.VIEW_ANALYTICS },
    ],
  },

  // ── SYSTEM ────────────────────────────────────────────────────────────────
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    alwaysShow: true,
    section: 'System',
    badgeKey: 'unreadNotifications',
  },
  {
    id: 'constitution',
    label: 'Constitution',
    href: '/constitution',
    icon: BookOpen,
    alwaysShow: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    alwaysShow: true,
  },
  {
    id: 'super_admin',
    label: 'System Control',
    href: '/dashboard/admin',
    icon: ShieldCheck,
    adminOnly: true,
    section: 'Admin',
  },
  {
    id: 'system_logs',
    label: 'System Logs',
    href: '/dashboard/admin?tab=logs',
    icon: ClipboardList,
    adminOnly: true,
    permission: PERMISSIONS.VIEW_SYSTEM_LOGS,
  },
];
