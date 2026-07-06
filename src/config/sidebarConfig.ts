import {
  LayoutDashboard, Users, Calendar, ClipboardCheck, DollarSign,
  FileText, Megaphone, Heart, BarChart2, Bell, Settings,
  BookOpen, ShieldCheck, ClipboardList, GitBranch, Briefcase, Target,
  Activity, Image, PenTool, MapPin, FolderKanban, UsersRound, Mail, Printer,
  CheckSquare, Share2, Building2,
} from 'lucide-react';
import { Permission, PERMISSIONS } from '@/lib/permissions';

export interface SidebarChild {
  label: string;
  href: string;
  permission: Permission;
  alwaysShow?: boolean;
  roles?: string[];
}

export interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  permission?: Permission;
  badgeKey?: string;
  children?: SidebarChild[];
  section?: string;
  adminOnly?: boolean;
  alwaysShow?: boolean;
  roles?: string[];
}

export const SIDEBAR_CONFIG: SidebarItem[] = [
  // ── MAIN ──────────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_DASHBOARD,
    section: 'Main',
  },
  {
    id: 'organization',
    label: 'Organization',
    href: '/dashboard/organization',
    icon: Building2,
    permission: PERMISSIONS.MANAGE_ORGANIZATION,
    section: 'Main',
  },

  // ── PEOPLE ────────────────────────────────────────────────────────────────
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    section: 'People',
    children: [
      { label: 'All Members',  href: '/dashboard/users',                 permission: PERMISSIONS.VIEW_ALL_USERS },
      { label: 'Approvals',    href: '/dashboard/users?status=inactive', permission: PERMISSIONS.MANAGE_USERS },
      { label: 'Assign Roles', href: '/dashboard/users?tab=roles',       permission: PERMISSIONS.CHANGE_ROLE_DIRECT },
    ],
  },

  // ── OPERATIONS ────────────────────────────────────────────────────────────
  {
    id: 'programs',
    label: 'Programs',
    icon: Calendar,
    children: [
      { label: 'All Programs',   href: '/dashboard/programs',               permission: PERMISSIONS.VIEW_PROGRAMS },
      { label: 'Create Program', href: '/dashboard/programs?action=create', permission: PERMISSIONS.MANAGE_PROGRAMS },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: Activity,
    children: [
      { label: 'All Activities',   href: '/dashboard/activities',               permission: PERMISSIONS.VIEW_DASHBOARD },
      { label: 'My Invitations',   href: '/dashboard/activities?view=mine',     permission: PERMISSIONS.VIEW_DASHBOARD },
      { label: 'Create Activity',  href: '/dashboard/activities?action=create', permission: PERMISSIONS.MANAGE_PROGRAMS },
      { label: 'Activity Reports', href: '/dashboard/activities/reports',        permission: PERMISSIONS.VIEW_REPORTS },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    children: [
      { label: 'My Attendance',     href: '/dashboard/attendance',            permission: PERMISSIONS.VIEW_ATTENDANCE },
      { label: 'Manage Attendance', href: '/dashboard/attendance?view=admin', permission: PERMISSIONS.MANAGE_ATTENDANCE },
    ],
  },

  // ── COMMUNITY ──────────────────────────────────────────────────────────────
  {
    id: 'gallery',
    label: 'VOA Gallery',
    href: '/dashboard/gallery',
    icon: Image,
    permission: PERMISSIONS.VIEW_GALLERY,
    section: 'Community',
  },

  // ── FINANCE ───────────────────────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    badgeKey: 'pendingTransactions',
    children: [
      { label: 'Contributions',   href: '/dashboard/finance',                   permission: PERMISSIONS.VIEW_CONTRIBUTIONS },
      { label: 'Transactions',    href: '/dashboard/finance?tab=transactions',   permission: PERMISSIONS.VIEW_FINANCE },
      { label: 'Accounts',        href: '/dashboard/finance?tab=accounts',       permission: PERMISSIONS.MANAGE_ACCOUNTS },
    ],
  },
  {
    id: 'targets',
    label: 'Finance Targets',
    href: '/dashboard/targets',
    icon: Target,
    permission: PERMISSIONS.VIEW_FINANCE,
  },

  // ── CONTENT ───────────────────────────────────────────────────────────────
  {
    id: 'content',
    label: 'Content',
    icon: PenTool,
    section: 'Content',
    children: [
      { label: 'Blog',    href: '/dashboard/content/blogs',    permission: PERMISSIONS.MANAGE_BLOGS },
      { label: 'Events',  href: '/dashboard/content/events',   permission: PERMISSIONS.MANAGE_EVENTS },
      { label: 'Projects',href: '/dashboard/content/projects',  permission: PERMISSIONS.MANAGE_PROJECTS },
      { label: 'Team',    href: '/dashboard/content/team',     permission: PERMISSIONS.MANAGE_TEAM },
      { label: 'Contact', href: '/dashboard/content/contact',  permission: PERMISSIONS.MANAGE_CONTACT },
    ],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: Megaphone,
    children: [
      { label: 'All Announcements', href: '/dashboard/announcements',                      permission: PERMISSIONS.VIEW_ANNOUNCEMENTS },
      { label: 'Create Post',       href: '/dashboard/announcements?action=create',        permission: PERMISSIONS.MANAGE_ANNOUNCEMENTS },
      { label: 'Public Posts',      href: '/dashboard/announcements?visibility=public',   permission: PERMISSIONS.VIEW_ANNOUNCEMENTS },
    ],
  },

  // ── WELFARE ───────────────────────────────────────────────────────────────
  {
    id: 'welfare',
    label: 'Welfare',
    icon: Heart,
    section: 'Welfare',
    badgeKey: 'pendingWelfare',
    children: [
      { label: 'All Requests',   href: '/dashboard/welfare',               permission: PERMISSIONS.MANAGE_WELFARE },
      { label: 'Submit Request', href: '/dashboard/welfare?action=submit', permission: PERMISSIONS.SUBMIT_WELFARE_REQUEST },
    ],
  },

  // ── TASKS ─────────────────────────────────────────────────────────────────
  {
    id: 'document_approvals',
    label: 'Document Approvals',
    href: '/dashboard/approvals',
    icon: CheckSquare,
    section: 'Tasks',
    badgeKey: 'pendingApprovals',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    id: 'document_generator',
    label: 'Document Generator',
    href: '/dashboard/documents',
    icon: FileText,
    section: 'Tasks',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/dashboard/reports',
    icon: ClipboardList,
    section: 'Tasks',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    id: 'constitution',
    label: 'Constitution',
    href: '/constitution',
    icon: BookOpen,
    section: 'Tasks',
    permission: PERMISSIONS.VIEW_CONSTITUTION,
  },

  // ── WORKFLOW ──────────────────────────────────────────────────────────────
  {
    id: 'positions',
    label: 'Position Applications',
    href: '/dashboard/positions',
    icon: Briefcase,
    section: 'Workflow',
    permission: PERMISSIONS.SUBMIT_POSITION_APPLICATION,
  },
  {
    id: 'role_changes',
    label: 'Role Change Requests',
    href: '/dashboard/role-changes',
    icon: GitBranch,
    section: 'Workflow',
    permission: PERMISSIONS.INITIATE_ROLE_CHANGE,
  },

  // ── INSIGHTS ──────────────────────────────────────────────────────────────
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart2,
    section: 'Insights',
    children: [
      { label: 'Overview',          href: '/dashboard/analytics',                  permission: PERMISSIONS.VIEW_ANALYTICS },
      { label: 'Leaderboard',       href: '/dashboard/analytics?view=leaderboard', permission: PERMISSIONS.VIEW_ANALYTICS },
      { label: 'Inactive Members',  href: '/dashboard/analytics?view=inactive',    permission: PERMISSIONS.VIEW_ANALYTICS },
    ],
  },

  // ── SYSTEM ────────────────────────────────────────────────────────────────
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    section: 'System',
    children: [
      { label: 'Notifications',      href: '/dashboard/notifications',                permission: PERMISSIONS.VIEW_DASHBOARD },
      { label: 'Settings',           href: '/dashboard/settings',                     permission: PERMISSIONS.EDIT_OWN_PROFILE },
      { label: 'System Control',     href: '/dashboard/admin',                        permission: PERMISSIONS.VIEW_SYSTEM_LOGS },
      { label: 'System Logs',        href: '/dashboard/admin?tab=logs',               permission: PERMISSIONS.VIEW_SYSTEM_LOGS },
      { label: 'Document Templates', href: '/dashboard/document-templates',           permission: PERMISSIONS.MANAGE_SETTINGS },
      { label: 'Social Channels',    href: '/dashboard/admin?tab=socialChannels',     permission: PERMISSIONS.MANAGE_SETTINGS },
      { label: 'Organizations',      href: '/dashboard/admin/organizations',           permission: PERMISSIONS.MANAGE_ORGANIZATION },
    ],
  },
];
