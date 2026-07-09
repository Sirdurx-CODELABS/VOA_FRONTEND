import {
  LayoutDashboard, Globe, Building2, Users, ShieldCheck,
  BarChart2, FileText, Megaphone, ClipboardList, CreditCard,
  Settings, Key, Bell, User, LogOut, BookOpen, Server,
  PanelRight, Palette, BrainCircuit, MessagesSquare, Activity,
  Layers, Database,
} from 'lucide-react';
import { Permission, PERMISSIONS } from '@/lib/permissions';

export interface SuperAdminChild {
  label: string;
  href: string;
  permission?: Permission;
  alwaysShow?: boolean;
}

export interface SuperAdminItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  permission?: Permission;
  children?: SuperAdminChild[];
  section: string;
  alwaysShow?: boolean;
}

export const SUPER_ADMIN_SIDEBAR_CONFIG: SuperAdminItem[] = [
  {
    id: 'sa_dashboard',
    label: 'Dashboard',
    href: '/dashboard/admin',
    icon: LayoutDashboard,
    section: 'Main',
    alwaysShow: true,
  },
  {
    id: 'sa_workspace',
    label: 'Workspace',
    href: '/dashboard/admin/workspace',
    icon: Globe,
    section: 'Main',
    alwaysShow: true,
  },
  {
    id: 'sa_hospitals',
    label: 'Hospitals',
    href: '/dashboard/admin/hospitals',
    icon: Building2,
    section: 'Platform',
    alwaysShow: true,
  },
  {
    id: 'sa_organisations',
    label: 'Organisations',
    href: '/dashboard/admin/organisations',
    icon: Building2,
    section: 'Platform',
    alwaysShow: true,
  },
  {
    id: 'sa_website_builder',
    label: 'Website Builder',
    href: '/dashboard/admin/websites',
    icon: Palette,
    section: 'Platform',
    alwaysShow: true,
  },
  {
    id: 'sa_templates',
    label: 'Templates',
    href: '/dashboard/admin/templates',
    icon: Layers,
    section: 'Platform',
    alwaysShow: true,
  },
  {
    id: 'sa_ai',
    label: 'AI Management',
    icon: BrainCircuit,
    section: 'AI',
    alwaysShow: true,
    children: [
      { label: 'AI Config', href: '/dashboard/admin/ai', alwaysShow: true },
      { label: 'Prompt Management', href: '/dashboard/admin/ai/prompts', alwaysShow: true },
      { label: 'Knowledge Base', href: '/dashboard/admin/ai/knowledge', alwaysShow: true },
    ],
  },
  {
    id: 'sa_users',
    label: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
    section: 'Administration',
    alwaysShow: true,
  },
  {
    id: 'sa_roles',
    label: 'Roles & Permissions',
    href: '/dashboard/admin/roles',
    icon: ShieldCheck,
    section: 'Administration',
    alwaysShow: true,
  },
  {
    id: 'sa_analytics',
    label: 'Analytics',
    href: '/dashboard/admin/analytics',
    icon: BarChart2,
    section: 'Administration',
    alwaysShow: true,
  },
  {
    id: 'sa_reports',
    label: 'Platform Reports',
    href: '/dashboard/admin/reports',
    icon: FileText,
    section: 'Administration',
    alwaysShow: true,
  },
  {
    id: 'sa_announcements',
    label: 'Announcements',
    href: '/dashboard/admin/announcements',
    icon: Megaphone,
    section: 'Administration',
    alwaysShow: true,
  },
  {
    id: 'sa_audit',
    label: 'Audit Logs',
    href: '/dashboard/admin/audit',
    icon: ClipboardList,
    section: 'Administration',
    alwaysShow: true,
  },
  {
    id: 'sa_subscriptions',
    label: 'Subscriptions',
    href: '/dashboard/admin/subscriptions',
    icon: CreditCard,
    section: 'Administration',
    alwaysShow: true,
  },
  {
    id: 'sa_settings',
    label: 'System Settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
    section: 'System',
    alwaysShow: true,
  },
  {
    id: 'sa_api',
    label: 'API Management',
    href: '/dashboard/admin/api',
    icon: Key,
    section: 'System',
    alwaysShow: true,
  },
  {
    id: 'sa_notifications',
    label: 'Notifications',
    href: '/dashboard/admin/notifications',
    icon: Bell,
    section: 'System',
    alwaysShow: true,
  },
  {
    id: 'sa_profile',
    label: 'Profile',
    href: '/dashboard/settings',
    icon: User,
    section: 'Account',
    alwaysShow: true,
  },
];
