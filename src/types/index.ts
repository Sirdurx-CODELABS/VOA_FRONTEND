export interface Organization {
  _id: string;
  organizationName: string;
  shortName: string;
  logo: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  district: string;
  state: string;
  country: string;
  facilityType: string;
  organizationType: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  description: string;
  status: string;
  systemInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
      twitter?: string;
      linkedin?: string;
      tiktok?: string;
    };
  };
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type Role =
  // System-wide
  | 'super_admin' | 'voa_admin'
  // Clinical roles
  | 'hospital_admin' | 'doctor' | 'nurse' | 'pharmacist'
  | 'lab_scientist' | 'adherence_counselor' | 'case_manager'
  | 'receptionist' | 'data_officer'
  | 'medical_records_officer' | 'radiographer' | 'nutritionist' | 'counselor'
  // Extended Org roles
  | 'alliance_admin' | 'org_admin' | 'programme_manager' | 'programme_officer'
  | 'finance_officer' | 'mande_officer' | 'support_group_leader' | 'volunteer'
  // Legacy VOA org roles
  | 'chairman' | 'vice_chairman'
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
  allianceOrganizationId?: string;
  organization?: Organization;
  staffProfile?: StaffProfile | DoctorProfile;
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
  link?: string;
  relatedId?: string;
  relatedModel?: string;
  allianceOrganizationId?: string;
  createdAt: string;
  updatedAt?: string;
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
  notes?: string;
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
  showOnWebsite?: boolean;
  createdAt: string;
}

export interface ActivityReport {
  _id: string;
  activityId: string;
  title: string;
  content: string;
  reportType: string;
  createdBy: { _id: string; fullName: string };
  attachments: string[];
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

// ─── Doctor System ─────────────────────────────────────────────────────
export interface Doctor {
  _id: string;
  user?: string;
  name: string;
  medicalLicense: string;
  hospital?: { _id: string; name: string; state: string; lga: string; address?: string; phone?: string };
  department: string;
  specialization: string;
  qualification: string;
  biography: string;
  photo: string;
  certificates: string[];
  phone: string;
  email: string;
  password?: string;
  state: string;
  lga: string;
  languages: string[];
  consultationType: 'online' | 'physical' | 'both';
  schedule: DoctorScheduleDay[];
  maxDailyPatients: number;
  consultationFee: number;
  services: DoctorService[];
  yearsOfExperience: number;
  isAvailable: boolean;
  isVerified: boolean;
  todayPatientCount: number;
  lastAvailabilityUpdate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorService {
  name: string;
  description: string;
  price: number;
}

export interface DoctorScheduleDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  type: 'online' | 'physical' | 'both' | '';
}

export interface Consultation {
  _id: string;
  patient: { _id: string; name: string; phone: string; age?: number; gender?: string };
  doctor?: { _id: string; name: string; specialization?: string; phone?: string } | string;
  hospital?: { _id: string; name: string; state?: string; lga?: string; address?: string; phone?: string };
  chat?: { _id: string; messages?: ChatMessage[]; status?: string };
  type: 'online' | 'in-person';
  status: 'pending' | 'doctor_accepted' | 'patient_confirmed' | 'in_progress' | 'completed' | 'cancelled';
  consentDataShare: boolean;
  consentSummaryShare: boolean;
  aiSummary?: {
    symptoms: string;
    timeline: string;
    currentMedication: string;
    concerns: string;
    riskAssessment: string;
    recommendations: string;
  };
  notes: string;
  prescription: string;
  labRequests: string;
  source: 'whatsapp' | 'web' | 'mobile';
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'patient' | 'ai' | 'doctor';
  content: string;
  timestamp: string;
}

// ─── EMR & Extended Doctor System ──────────────────────────────────────
export interface Vitals {
  weight?: number;
  height?: number;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulse?: number;
  respiration?: number;
  recordedAt?: string;
}

export interface AiRecommendation {
  possibleConditions?: string[];
  riskLevel?: 'low' | 'moderate' | 'high' | 'emergency';
  recommendedTests?: string[];
  recommendedMedications?: AiMedicationSuggestion[];
  recommendedFollowUp?: string;
  referralRecommendation?: string;
  patientEducation?: string;
  lifestyleAdvice?: string;
  confidence?: number;
  evidence?: string;
  guidelineSource?: string;
}

export interface AiMedicationSuggestion {
  name: string;
  reason: string;
  alternative?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  warnings?: string;
}

export interface PrescriptionMedication {
  name: string;
  dosage: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  duration: string;
  durationUnit: 'days' | 'weeks' | 'months';
  instructions: string;
  notes?: string;
}

export interface Prescription {
  _id: string;
  patient: { _id: string; name: string; phone: string };
  doctor: { _id: string; name: string; specialization?: string };
  consultation?: string;
  hospital?: string;
  medications: PrescriptionMedication[];
  notes?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  isSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabRequestItem {
  testName: string;
  category: 'viral_load' | 'cd4' | 'fbc' | 'lft' | 'rft' | 'genexpert' | 'malaria' | 'pregnancy' | 'urinalysis' | 'custom';
  notes?: string;
  isUrgent: boolean;
}

export interface LabRequest {
  _id: string;
  patient: { _id: string; name: string; phone: string };
  doctor: { _id: string; name: string; specialization?: string };
  consultation?: string;
  hospital?: string;
  tests: LabRequestItem[];
  notes?: string;
  status: 'requested' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  result?: string;
  resultDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  _id: string;
  patient: { _id: string; name: string; phone: string };
  fromDoctor: { _id: string; name: string; specialization?: string };
  fromHospital?: { _id: string; name: string };
  toHospital: { _id: string; name: string; state?: string; lga?: string };
  reason: string;
  priority: 'routine' | 'urgent' | 'emergency';
  consultationSummary?: string;
  aiSummary?: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  _id: string;
  patient: { _id: string; name: string; phone: string };
  type: 'consultation' | 'prescription' | 'lab_result' | 'referral' | 'ai_summary' | 'doctor_note' | 'hospital_visit' | 'risk_assessment';
  title: string;
  description?: string;
  consultation?: string;
  referenceId?: string;
  doctor?: { _id: string; name: string };
  hospital?: { _id: string; name: string };
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: { _id: string; name: string; role: 'doctor' | 'patient' | 'admin' | 'hospital' };
  recipient: { _id: string; name: string; role: 'doctor' | 'patient' | 'admin' | 'hospital' };
  subject: string;
  content: string;
  consultation?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  todayAppointments: number;
  pendingRequests: number;
  onlineConsultations: number;
  walkInPatients: number;
  completedToday: number;
  cancelledToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  patientsSeenToday: number;
  patientsSeenThisWeek: number;
  avgConsultationMinutes: number;
  highRiskReferrals: number;
  aiRecommendationsPending: number;
}

export interface PatientProfile {
  _id: string;
  userId?: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  state?: string;
  lga?: string;
  hospital?: { _id: string; name: string };
  vitals?: Vitals;
  diagnosis?: {
    hiv?: boolean;
    tb?: boolean;
    oi?: boolean;
    hypertension?: boolean;
    diabetes?: boolean;
    other?: string;
  };
  artNumber?: string;
  fileNumber?: string;
  currentDrugs?: string;
  allergies?: string;
  currentMedication?: string;
  chiefComplaint?: string;
  history?: string;
  riskScore?: 'low' | 'moderate' | 'high' | 'critical';
  consentStatus?: boolean;
  emergencyContact?: string;
  preferredDoctor?: { _id: string; name: string };
  preferredHospital?: { _id: string; name: string };
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  patient: { _id: string; name: string; phone: string };
  doctor: { _id: string; name: string };
  hospital?: { _id: string; name: string };
  type: 'online' | 'in-person';
  date: string;
  time: string;
  reason: string;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  isWalkIn: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConsultationStatus = 'pending' | 'doctor_accepted' | 'patient_confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'new_consultation' | 'new_booking' | 'cancelled_appointment' | 'ai_alert' | 'emergency_referral' | 'lab_result' | 'message';
  isRead: boolean;
  link?: string;
  relatedId?: string;
  relatedModel?: string;
  createdAt: string;
}

// ─── Clinical Staff Profiles ──────────────────────────────────────────
export interface License {
  number: string;
  issuingBody: string;
  expiryDate?: string;
  isVerified: boolean;
}

export interface ScheduleDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

export interface StaffProfile {
  _id: string;
  userId: string;
  hospitalId?: string;
  departmentId?: string;
  staffId?: string;
  specialization?: string;
  qualifications: string[];
  licenses: License[];
  schedule: ScheduleDay[];
  isAvailable: boolean;
  status: 'active' | 'on_leave' | 'inactive';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorProfile extends StaffProfile {
  medicalLicense: string;
  consultationFee: number;
  maxDailyPatients: number;
  todayPatientCount: number;
  services: DoctorService[];
}

export interface NurseProfile extends StaffProfile {
  // Nurse-specific fields
}

export interface PharmacistProfile extends StaffProfile {
  licenseNumber: string;
}

export interface LabProfile extends StaffProfile {
  certification: string[];
}

export interface CounselorProfile extends StaffProfile {
  counselingSpecialties: string[];
}

export interface CaseManagerProfile extends StaffProfile {
  caseloadLimit: number;
}

// ─── HIV Clinical Care ───────────────────────────────────────────────
export interface ViralLoadEntry {
  value: number;
  collectionDate: string;
  resultDate?: string;
  status: 'suppressed' | 'unsuppressed' | 'unknown';
  notes?: string;
}

export interface CD4Entry {
  value: number;
  date: string;
  percentage?: number;
  notes?: string;
}

export interface ARTRegimen {
  regimen: string;
  startDate: string;
  endDate?: string;
  lineOfTreatment: 'first' | 'second' | 'third';
  reasonForChange?: string;
  isCurrent: boolean;
  notes?: string;
}

export interface OIEntry {
  name: string;
  type: 'current' | 'past';
  diagnosisDate?: string;
  resolvedDate?: string;
  notes?: string;
}

export interface AllergyEntry {
  name: string;
  type: 'drug' | 'food' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  reaction?: string;
  notes?: string;
}

export interface HIVMedication {
  name: string;
  type: 'art' | 'tb' | 'other' | 'supplement';
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  prescribedBy?: string;
  notes?: string;
}

export interface HIVLabResult {
  testType: string;
  testName: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  date: string;
  notes?: string;
}

export interface HospitalAdmission {
  reason: string;
  hospital?: string;
  admissionDate?: string;
  dischargeDate?: string;
  notes?: string;
}

export interface HIVRecord {
  _id: string;
  patient: string;
  artNumber?: string;
  artStartDate?: string;
  currentRegimen?: string;
  currentLineOfTreatment?: string;
  previousRegimens: ARTRegimen[];
  drugResistanceHistory?: string;
  missedMedicationHistory?: string;
  medicationAdherence: number;
  viralLoads: ViralLoadEntry[];
  latestViralLoad?: number;
  latestViralLoadDate?: string;
  latestViralLoadStatus: string;
  cd4History: CD4Entry[];
  latestCD4?: number;
  latestCD4Date?: string;
  lowestCD4?: number;
  highestCD4?: number;
  appointmentAdherence: number;
  missedRefills: number;
  missedAppointments: number;
  latePickups: number;
  adherenceScore: number;
  opportunisticInfections: OIEntry[];
  tbHistory?: string;
  hepatitisB?: string;
  stiHistory?: string;
  hospitalAdmissions: HospitalAdmission[];
  allergies: AllergyEntry[];
  currentMedications: HIVMedication[];
  labResults: HIVLabResult[];
  currentStatus?: string;
  treatmentStatus?: string;
  primaryDiagnosis?: string;
  secondaryDiagnosis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HIVAiAnalysis {
  possibleCauses: string[];
  suggestedInvestigations: string[];
  adherenceRecommendations: string;
  lifestyleAdvice: string;
  referralRecommendations: string;
  suggestedFollowUpInterval: string;
  medicationSuggestions: HIVMedSuggestion[];
  clinicalAlerts: ClinicalAlert[];
  patientEducation: string;
}

export interface HIVMedSuggestion {
  name: string;
  reason: string;
  dosage: string;
  frequency: string;
  duration: string;
  sideEffects: string;
  drugInteractions: string;
  alternatives: string;
}

export interface ClinicalAlert {
  type: 'green' | 'yellow' | 'orange' | 'red';
  message: string;
  reason: string;
}

// ─── Reminders & Adherence ───────────────────────────────────────────
export type ReminderType =
  | 'medication' | 'appointment' | 'lab' | 'refill' | 'art_refill'
  | 'adherence_counselling' | 'vaccination' | 'health_check'
  | 'exercise' | 'nutrition' | 'water' | 'sleep' | 'mental_health'
  | 'daily_symptom' | 'custom';

export type ReminderStatus = 'pending' | 'sent' | 'snoozed' | 'completed' | 'skipped' | 'expired' | 'cancelled';

export interface ReminderAction {
  action: 'taken' | 'snoozed' | 'skipped' | 'need_help';
  timestamp: string;
  note?: string;
  source: 'web' | 'whatsapp' | 'mobile';
}

export interface Recurrence {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
  endDate?: string;
}

export interface Escalation {
  escalatedTo: 'counselor' | 'case_manager' | 'doctor' | 'hospital_admin';
  escalatedAt: string;
  reason: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AIReminder {
  _id: string;
  patient: { _id: string; name: string; phone: string } | string;
  hospital?: string;
  createdBy?: string;
  reminderType: ReminderType;
  title: string;
  description?: string;
  scheduledTime: string;
  recurrence?: Recurrence;
  channels: ('whatsapp' | 'push' | 'in_app' | 'sms')[];
  status: ReminderStatus;
  actions: ReminderAction[];
  snoozedUntil?: string;
  snoozeCount: number;
  maxSnoozes: number;
  adherenceScore?: number;
  streak: number;
  escalationLevel: number;
  escalationHistory: Escalation[];
  caregiverNotification: boolean;
  caregiverContacts: string[];
  aiGenerated: boolean;
  lastNotifiedAt?: string;
  nextScheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdherenceAnalytics {
  score: number;
  streak: number;
  completed: number;
  total: number;
  byType: Record<string, { total: number; completed: number }>;
  byDay: Record<string, { total: number; completed: number }>;
  period: { startDate: string; endDate: string };
}

export interface AdherenceOverview {
  totalReminders: number;
  completed: number;
  pending: number;
  missed: number;
  adherenceRate: number;
  activePatients: number;
}

// ─── Website Builder ────────────────────────────────────────────────
export type WebsiteStatus = 'draft' | 'published' | 'unpublished';
export type SectionType =
  | 'hero' | 'about' | 'services' | 'programs' | 'departments'
  | 'doctors' | 'leadership' | 'gallery' | 'testimonials' | 'partners'
  | 'sponsors' | 'news' | 'faq' | 'cta' | 'contact' | 'footer'
  | 'stats' | 'counters' | 'timeline' | 'pricing' | 'team'
  | 'custom' | 'html';

export interface WebsiteSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterCard?: string;
  robots: string;
  canonicalUrl?: string;
}

export interface WebsiteStyle {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  spacing: string;
  animations: boolean;
  darkMode: boolean;
  backgroundImage?: string;
  heroImage?: string;
}

export interface WebsiteSection {
  _id: string;
  type: SectionType;
  label: string;
  visible: boolean;
  settings: Record<string, any>;
  content: Record<string, any>;
  customStyle?: Record<string, any>;
  sortOrder: number;
}

export interface WebsitePage {
  _id: string;
  title: string;
  slug: string;
  isHome: boolean;
  status: 'draft' | 'published';
  sections: WebsiteSection[];
  seo?: { title?: string; description?: string };
  sortOrder: number;
}

export interface Website {
  _id: string;
  entityType: 'hospital' | 'organisation' | 'alliance' | 'support_group';
  entityId: string;
  slug: string;
  domain?: string;
  title: string;
  status: WebsiteStatus;
  publishedAt?: string;
  version: number;
  style: WebsiteStyle;
  seo: WebsiteSEO;
  pages: WebsitePage[];
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteTemplate {
  _id: string;
  name: string;
  description: string;
  category: 'hospital' | 'organisation' | 'ngo' | 'support_group' | 'alliance' | 'medical' | 'community' | 'landing' | 'campaign';
  thumbnail?: string;
  pages: WebsitePage[];
  style: WebsiteStyle;
  version: number;
  isDefault: boolean;
  status: 'active' | 'inactive' | 'draft';
}

export interface MediaItem {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  url: string;
  size: number;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface WebsiteBlock {
  id: string;
  type: SectionType;
  label: string;
  description: string;
  icon: string;
  category: 'content' | 'media' | 'interactive' | 'layout';
  defaultContent: Record<string, any>;
  defaultSettings: Record<string, any>;
}

// ─── Workflow: PatientVisit ──────────────────────────────────────────
export type WorkflowStatus =
  | 'checked_in'
  | 'triaged'
  | 'in_consultation'
  | 'lab_ordered'
  | 'in_pharmacy'
  | 'dispensed'
  | 'discharged'
  | 'cancelled';

export interface PatientVisit {
  _id: string;
  patient: { _id: string; name: string; phone: string; age?: number; gender?: string };
  hospital?: string | { _id: string; name: string };
  doctor?: string | { _id: string; name: string };
  triage?: {
    category: string;
    chiefComplaint: string;
    painLevel: number;
    notes: string;
    doneBy: string | { _id: string; name: string };
    doneAt: string;
  };
  vitals?: Vitals;
  status: WorkflowStatus;
  visitType: 'walk_in' | 'appointment' | 'emergency' | 'follow_up';
  queueNumber?: number;
  priority?: 'low' | 'normal' | 'urgent' | 'emergency';
  chiefComplaint?: string;
  checkedInBy?: string | { _id: string; name: string };
  checkedInAt?: string;
  startedConsultationAt?: string;
  dischargedAt?: string;
  dischargeSummary?: string;
  diagnosis?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── VOA Profile ─────────────────────────────────────────────────────
export interface VOAProfile {
  _id: string;
  user: { _id: string; fullName: string; email: string; phone?: string; role?: string } | string;
  organization?: { _id: string; name: string } | string;
  membershipType: 'regular' | 'life' | 'honorary' | 'associate';
  membershipNumber?: string;
  membershipStatus: 'active' | 'suspended' | 'expired' | 'resigned';
  joinedAt?: string;
  expiryDate?: string;
  position?: string;
  chapter?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  bio?: string;
  photoUrl?: string;
  aiPersona: 'general_patient' | 'voa_member' | 'healthcare_worker';
  consentGiven: boolean;
  consentDate?: string;
  dataSharingConsent: boolean;
  caregiverOptIn: boolean;
  caregiverContact?: string;
  createdAt: string;
  updatedAt: string;
}
