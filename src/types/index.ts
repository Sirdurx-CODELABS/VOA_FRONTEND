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
  status: 'active' | 'inactive' | 'pending';
  engagementScore: number;
  profileImage?: string;
  bio?: string;
  state?: string;
  address?: string;
  emergencyContact?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string;
  age?: number | null;
  membershipType?: 'adolescent' | 'adult' | 'parent_guardian';
  interests?: string[];
  points?: number;
  totalPoints?: number;
  isFoundingMember?: boolean;
  foundingMemberRank?: number | null;
  earlyContributorBonusAwarded?: boolean;
  permissions?: string[];
  reportsTo?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface JoinRequest {
  _id: string;
  user?: User;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface Program {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  createdBy: User;
  assignedMembers: User[];
  joinRequests: JoinRequest[];
  date: string;
  endDate?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  budget?: number;
  venue?: string;
  tags?: string[];
  isPublic: boolean;
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
  category: string;
  createdBy: User;
  createdByRole: string;
  visibility: 'internal' | 'public' | 'specific_roles';
  targetRoles?: string[];
  departmentTag?: string;
  status: 'published' | 'draft' | 'archived';
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

export interface MonthlyContribution {
  _id: string;
  userId: User;
  month: string;
  year: number;
  requiredAmount: number;
  amountPaid: number;
  extraAmount: number;
  remainingAmount: number;
  progressPercent: number;
  isCompleted: boolean;
  completedAt?: string;
  calculationSource: string;
  breakdown?: { childName?: string; category: string; gender?: string; amount: number; childAge?: number }[];
  createdAt: string;
}

export interface Installment {
  _id: string;
  userId: User;
  monthlyContributionId: string;
  month: string;
  amount: number;
  paymentMode: 'required' | 'custom' | 'installment';
  paymentMethod: string;
  referenceNote?: string;
  proofImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: User;
  approvedAt?: string;
  rejectionReason?: string;
  receiptNumber?: string;
  pointsAwarded?: number;
  isExtraPayment?: boolean;
  calculatedDueAtSubmission?: number;
  createdAt: string;
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

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  category?: string;
  author: User;
  featured: boolean;
  status: 'draft' | 'published';
  readTime?: number;
  views?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  location?: string;
  category?: string;
  image?: string;
  images?: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  seats?: number;
  registered?: number;
  attendees?: User[];
  createdBy: User;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  images?: string[];
  category?: string;
  status: 'planning' | 'ongoing' | 'completed' | 'on-hold';
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: string;
  createdBy: User;
  isPublic: boolean;
  impact?: string;
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactReply {
  _id: string;
  content: string;
  createdBy: User;
  createdAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'replied' | 'closed';
  replies: ContactReply[];
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  _id: string;
  user: User;
  position: string;
  bio?: string;
  photo?: string;
  order: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface Child {
  _id: string;
  parentId: string;
  childName: string;
  childDob: string;
  childAge?: number | null;
  childGender?: 'male' | 'female' | 'other';
  relationship: 'son' | 'daughter' | 'ward' | 'other';
  hasAccount?: boolean;
  linkedUserId?: string | null;
  createdAt: string;
}

export interface FinanceTarget {
  _id: string;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  amountRaised: number;
  amountRemaining: number;
  excessAmount: number;
  progressPercent: number;
  isCompleted: boolean;
  completedAt?: string;
  isActive: boolean;
  startDate: string;
  deadline?: string;
  createdBy: User;
  createdAt: string;
}

export interface PointTransaction {
  _id: string;
  userId: string;
  type: 'registration_bonus' | 'early_contributor_bonus' | 'contribution_base' | 'contribution_extra' | 'engagement';
  source: string;
  points: number;
  referenceId?: string;
  createdAt: string;
}

export type ActivityType = 'meeting' | 'event' | 'community_outreach' | 'community_visit' | 'welfare_visit' | 'health_awareness' | 'training' | 'workshop' | 'field_activity' | 'other';

export interface Activity {
  _id: string;
  title: string;
  type: ActivityType;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  peopleNeeded?: number;
  targetMembershipType: 'adolescent' | 'adult' | 'parent_guardian' | 'all';
  targetGender: 'male' | 'female' | 'all';
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
  customConditions?: string;
  createdBy: User;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ActivityParticipant {
  _id: string;
  activityId: Activity | string;
  userId: User;
  inviteStatus: 'invited' | 'removed';
  responseStatus: 'pending' | 'accepted' | 'declined' | 'absent';
  responseReason?: string;
  attendanceStatus: 'pending' | 'present' | 'absent';
  attendanceReason?: string;
  invitedAt: string;
  respondedAt?: string;
}

export interface ActivityMedia {
  _id: string;
  activityId: Activity | { _id: string; title: string; type: string; date: string; venue?: string; description?: string };
  uploadedBy: User | { _id: string; fullName: string };
  imageUrl: string;
  caption?: string;
  shareToken: string;
  createdAt: string;
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

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  category?: string;
  author: User;
  featured: boolean;
  status: 'draft' | 'published';
  readTime?: number;
  views?: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  location?: string;
  category?: string;
  image?: string;
  images?: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  seats?: number;
  registered?: number;
  attendees?: User[];
  createdBy: User;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  images?: string[];
  category?: string;
  status: 'planning' | 'ongoing' | 'completed' | 'on-hold';
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: string;
  createdBy: User;
  isPublic: boolean;
  impact?: string;
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactReply {
  _id: string;
  content: string;
  createdBy: User;
  createdAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'replied' | 'closed';
  replies: ContactReply[];
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  _id: string;
  user: User;
  position: string;
  bio?: string;
  photo?: string;
  order: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TemplateType =
  | 'letterhead' | 'membership_card' | 'meeting_agenda' | 'official_invitation'
  | 'financial_request' | 'activity_report' | 'official_receipt' | 'mou'
  | 'email_signature' | 'certificate';

export interface DocumentApproval {
  _id: string;
  documentId: {
    _id: string;
    name: string;
    templateType: TemplateType;
    data: Record<string, unknown>;
    pdfUrl?: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  };
  templateType: TemplateType;
  role: string;
  label: string;
  requestedBy: { _id: string; fullName: string; email: string; profileImage?: string };
  assignedTo: { _id: string; fullName: string; email: string; profileImage?: string };
  status: 'pending' | 'approved' | 'rejected';
  signatureUrl?: string;
  comment?: string;
  actionedAt?: string;
  createdAt: string;
  updatedAt: string;
}
