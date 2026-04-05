export type Role =
  | 'super_admin' | 'chairman' | 'vice_chairman'
  | 'secretary' | 'treasurer' | 'pro'
  | 'program_coordinator' | 'membership_coordinator'
  | 'welfare_officer' | 'member';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  isVice: boolean;
  status: 'active' | 'inactive';
  engagementScore: number;
  profileImage?: string;
  bio?: string;
  state?: string;
  address?: string;
  emergencyContact?: string;
  gender?: 'male' | 'female' | 'other';
  points?: number;
  permissions?: string[];
  reportsTo?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  _id: string;
  title: string;
  description?: string;
  createdBy: User;
  assignedMembers: User[];
  date: string;
  endDate?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  budget?: number;
  venue?: string;
  createdAt: string;
}

export interface Attendance {
  _id: string;
  userId: User;
  programId: Program;
  status: 'present' | 'absent';
  notes?: string;
  timestamp: string;
}

export interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  createdBy: User;
  programId?: Program;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User;
  description?: string;
  createdAt: string;
}

export interface Report {
  _id: string;
  title: string;
  content: string;
  programId?: Program;
  createdBy: User;
  attachments: string[];
  type: 'meeting_minutes' | 'event_report' | 'general';
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdBy: User;
  visibility: 'internal' | 'public';
  isPinned: boolean;
  attachments: string[];
  createdAt: string;
}

export interface WelfareRequest {
  _id: string;
  userId: User;
  type: 'financial' | 'personal' | 'other';
  message: string;
  status: 'pending' | 'in-progress' | 'resolved';
  handledBy?: User;
  followUps: { note: string; addedBy: User; addedAt: string }[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TreasuryAccount {
  _id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isActive: boolean;
  createdBy: User;
  createdAt: string;
}

export interface Contribution {
  _id: string;
  userId: User;
  amount: number;
  minimumRequiredAmount: number;
  isAboveMinimum: boolean;
  extraAmount: number;
  month: string;
  proofImage?: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'other';
  referenceNote?: string;
  accountId?: TreasuryAccount;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User;
  approvedAt?: string;
  rejectionReason?: string;
  receiptNumber?: string;
  pointsAwarded?: number;
  createdAt: string;
}
