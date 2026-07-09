import {
  LayoutDashboard, Users, Calendar, ClipboardCheck, FileText,
  Bell, Settings, BarChart2, Activity, Stethoscope, Pill,
  FlaskConical, HeartHandshake, UserPlus, Clock, UserCog,
  ClipboardPlus, Syringe, Heart, Ambulance, MessageSquare,
  BrainCircuit, Hospital, Building2, Microscope, Bone,
  Apple, ClipboardList, GitBranch,
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

export const HMS_SIDEBAR_CONFIG: SidebarItem[] = [
  // ── MAIN ──────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: PERMISSIONS.VIEW_DASHBOARD,
    section: 'Main',
  },
  {
    id: 'clinical_dashboard',
    label: 'Clinical Dashboard',
    href: '/dashboard/clinical',
    icon: Stethoscope,
    permission: PERMISSIONS.VIEW_CLINICAL_DASHBOARD,
    section: 'Main',
  },

  // ── PATIENT CARE ──────────────────────────────────────────────────────
  {
    id: 'patients',
    label: 'Patients',
    href: '/dashboard/clinical/patients',
    icon: UserCog,
    permission: PERMISSIONS.VIEW_PATIENT,
    section: 'Patient Care',
  },
  {
    id: 'appointments',
    label: 'Appointments',
    href: '/dashboard/clinical/appointments',
    icon: Calendar,
    permission: PERMISSIONS.MANAGE_APPOINTMENTS,
    section: 'Patient Care',
  },
  {
    id: 'medical_records',
    label: 'Medical Records',
    href: '/dashboard/doctor/medical-records',
    icon: FileText,
    permission: PERMISSIONS.VIEW_DOCUMENT,
    section: 'Patient Care',
  },
  {
    id: 'patient_timeline',
    label: 'Patient Timeline',
    href: '/dashboard/clinical/timeline',
    icon: Activity,
    permission: PERMISSIONS.VIEW_PATIENT_TIMELINE,
    section: 'Patient Care',
  },

  // ── CONSULTATIONS ─────────────────────────────────────────────────────
  {
    id: 'consultations',
    label: 'Consultations',
    icon: Stethoscope,
    section: 'Consultations',
    permission: PERMISSIONS.MANAGE_CONSULTATIONS,
    children: [
      { label: 'Consultation Queue',  href: '/dashboard/doctor/consultations',              permission: PERMISSIONS.VIEW_CONSULTATIONS },
      { label: 'My Consultations',    href: '/dashboard/doctor/consultations?view=mine',    permission: PERMISSIONS.CONDUCT_CONSULTATION },
      { label: 'Walk-in',             href: '/dashboard/doctor/walk-in',                     permission: PERMISSIONS.REGISTER_PATIENT },
    ],
  },

  // ── TRIAGE & VITALS ──────────────────────────────────────────────────
  {
    id: 'triage',
    label: 'Triage',
    href: '/dashboard/clinical/triage',
    icon: ClipboardPlus,
    section: 'Clinical',
    permission: PERMISSIONS.TRIAGE_PATIENT,
  },
  {
    id: 'vitals',
    label: 'Record Vitals',
    href: '/dashboard/clinical/triage?tab=vitals',
    icon: Activity,
    section: 'Clinical',
    permission: PERMISSIONS.RECORD_VITALS,
  },
  {
    id: 'medication_admin',
    label: 'Medication Admin',
    href: '/dashboard/clinical/triage?tab=medication',
    icon: Syringe,
    section: 'Clinical',
    permission: PERMISSIONS.MANAGE_MEDICATION_ADMIN,
  },

  // ── PHARMACY ──────────────────────────────────────────────────────────
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: Pill,
    section: 'Pharmacy',
    permission: PERMISSIONS.VIEW_PRESCRIPTIONS,
    children: [
      { label: 'Prescriptions',       href: '/dashboard/clinical/pharmacy',                  permission: PERMISSIONS.VIEW_PRESCRIPTIONS },
      { label: 'Dispense Queue',      href: '/dashboard/clinical/pharmacy?tab=dispense',     permission: PERMISSIONS.DISPENSE_MEDICATION },
      { label: 'Verify Queue',        href: '/dashboard/clinical/pharmacy?tab=verify',       permission: PERMISSIONS.VERIFY_PRESCRIPTION },
      { label: 'Inventory / Stock',   href: '/dashboard/clinical/pharmacy?tab=stock',        permission: PERMISSIONS.MANAGE_STOCK },
    ],
  },

  // ── LABORATORY ────────────────────────────────────────────────────────
  {
    id: 'laboratory',
    label: 'Laboratory',
    icon: FlaskConical,
    section: 'Laboratory',
    permission: PERMISSIONS.VIEW_LAB_RESULTS,
    children: [
      { label: 'Lab Requests',        href: '/dashboard/clinical/laboratory',                 permission: PERMISSIONS.VIEW_LAB_RESULTS },
      { label: 'Process Samples',     href: '/dashboard/clinical/laboratory?tab=process',    permission: PERMISSIONS.PROCESS_SAMPLE },
      { label: 'Upload Results',      href: '/dashboard/clinical/laboratory?tab=upload',     permission: PERMISSIONS.UPLOAD_LAB_RESULTS },
      { label: 'Critical Flags',      href: '/dashboard/clinical/laboratory?tab=critical',   permission: PERMISSIONS.FLAG_CRITICAL_RESULT },
    ],
  },

  // ── ADHERENCE & COUNSELING ────────────────────────────────────────────
  {
    id: 'adherence',
    label: 'Adherence',
    icon: HeartHandshake,
    section: 'Adherence',
    permission: PERMISSIONS.MANAGE_ADHERENCE,
    children: [
      { label: 'Adherence Tracking',  href: '/dashboard/clinical/adherence',                   permission: PERMISSIONS.MANAGE_ADHERENCE },
      { label: 'Counseling Sessions',  href: '/dashboard/clinical/adherence?tab=counseling',   permission: PERMISSIONS.CONDUCT_COUNSELING },
      { label: 'Escalations',         href: '/dashboard/clinical/adherence?tab=escalations',  permission: PERMISSIONS.VIEW_ADHERENCE },
    ],
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    href: '/dashboard/clinical/adherence?tab=nutrition',
    icon: Apple,
    section: 'Adherence',
    permission: PERMISSIONS.CONDUCT_COUNSELING,
  },

  // ── CASE MANAGEMENT ────────────────────────────────────────────────────
  {
    id: 'case_mgmt',
    label: 'Case Management',
    icon: UserPlus,
    section: 'Case Management',
    permission: PERMISSIONS.MANAGE_CASE,
    children: [
      { label: 'All Cases',           href: '/dashboard/clinical/case',                  permission: PERMISSIONS.MANAGE_CASE },
      { label: 'Referrals',           href: '/dashboard/clinical/case?tab=referrals',    permission: PERMISSIONS.MANAGE_REFERRALS },
      { label: 'Outreach',            href: '/dashboard/clinical/case?tab=outreach',     permission: PERMISSIONS.CONDUCT_OUTREACH },
    ],
  },

  // ── HOSPITAL ADMINISTRATION ────────────────────────────────────────────
  {
    id: 'hospital_admin',
    label: 'Administration',
    icon: Hospital,
    section: 'Administration',
    children: [
      { label: 'Staff',           href: '/dashboard/hospital/staff',        permission: PERMISSIONS.MANAGE_STAFF },
      { label: 'Departments',     href: '/dashboard/hospital/departments',  permission: PERMISSIONS.MANAGE_DEPARTMENTS },
      { label: 'Reports',         href: '/dashboard/hospital/reports',      permission: PERMISSIONS.VIEW_REPORTS },
      { label: 'AI Configuration',href: '/dashboard/hospital/ai',           permission: PERMISSIONS.MANAGE_AI },
      { label: 'Settings',        href: '/dashboard/hospital/settings',     permission: PERMISSIONS.MANAGE_HOSPITAL },
    ],
  },
  {
    id: 'hospital_analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart2,
    section: 'Administration',
    permission: PERMISSIONS.VIEW_ANALYTICS,
  },

  // ── AI ─────────────────────────────────────────────────────────────────
  {
    id: 'ai_assistant',
    label: 'AI Clinical Assistant',
    href: '/dashboard/doctor/consultations?ai=true',
    icon: BrainCircuit,
    section: 'AI',
    permission: PERMISSIONS.VIEW_AI_ANALYTICS,
  },

  // ── COMMUNICATION (Doctor-specific) ────────────────────────────────────
  {
    id: 'messages',
    label: 'Messages',
    href: '/dashboard/doctor/messages',
    icon: MessageSquare,
    section: 'Communication',
    permission: PERMISSIONS.VIEW_DASHBOARD,
    roles: ['doctor'],
  },

  // ── PATIENT WORKFLOW ──────────────────────────────────────────────────
  {
    id: 'workflow',
    label: 'Workflow',
    icon: GitBranch,
    section: 'Patient Care',
    permission: PERMISSIONS.VIEW_WORKFLOW,
    children: [
      { label: 'Kanban Board',      href: '/dashboard/clinical/workflow',               permission: PERMISSIONS.VIEW_WORKFLOW },
      { label: 'Check-in',          href: '/dashboard/clinical/workflow/checkin',        permission: PERMISSIONS.CHECK_IN_PATIENT },
      { label: 'Doctor Queue',      href: '/dashboard/clinical/workflow/doctor-queue',   permission: PERMISSIONS.MANAGE_DOCTOR_QUEUE },
      { label: 'Lab Handoff',       href: '/dashboard/clinical/workflow/lab-handoff',    permission: PERMISSIONS.REQUEST_LAB },
      { label: 'Pharmacy Handoff',  href: '/dashboard/clinical/workflow/pharmacy-handoff', permission: PERMISSIONS.CREATE_PRESCRIPTION },
      { label: 'Discharge',         href: '/dashboard/clinical/workflow/discharge',      permission: PERMISSIONS.DISCHARGE_PATIENT },
    ],
  },

  // ── SYSTEM ────────────────────────────────────────────────────────────
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    section: 'System',
    children: [
      { label: 'Notifications',      href: '/dashboard/notifications',  permission: PERMISSIONS.VIEW_DASHBOARD },
      { label: 'Settings',           href: '/dashboard/settings',       permission: PERMISSIONS.EDIT_OWN_PROFILE },
    ],
  },
];
