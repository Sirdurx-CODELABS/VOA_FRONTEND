'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/auth.service';
import { userService, childService } from '@/services/api.service';
import { Child } from '@/types';
import { IDCardModal } from '@/components/ui/IDCard';
import { VOALogo } from '@/components/ui/VOALogo';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { getInitials, formatDate, calcAge, formatDOB, membershipTypeLabel, cn } from '@/lib/utils';
import { pointsService } from '@/services/api.service';
import { PointTransaction } from '@/types';
import {
  Moon, Sun, User, Lock, Palette, CreditCard, BookOpen, Camera, Save,
  ExternalLink, Eye, EyeOff, Plus, Trash2, Pencil, Baby, Monitor,
  CheckCircle, Star, UserPlus, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().optional(),
  bio: z.string().max(300).optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional().refine(v => !v || new Date(v) < new Date(), 'DOB cannot be in the future'),
});
type ProfileForm = z.infer<typeof profileSchema>;

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type PwForm = z.infer<typeof pwSchema>;

const childAccountSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type ChildAccountForm = z.infer<typeof childAccountSchema>;

const TABS = [
  { id: 'account',    label: 'Account',   icon: User },
  { id: 'security',   label: 'Security',  icon: Lock },
  { id: 'idcard',     label: 'ID Card',   icon: CreditCard },
  { id: 'appearance', label: 'Theme',     icon: Palette },
  { id: 'legal',      label: 'Legal',     icon: BookOpen },
] as const;
type TabId = typeof TABS[number]['id'] | 'children' | 'points';

const INTERESTS_LIST = [
  'Health Advocacy', 'Community Outreach', 'Media & Communications', 'Leadership',
  'Welfare Support', 'Fundraising', 'Public Speaking', 'Volunteering',
  'Skill Development', 'Education', 'Youth Empowerment', 'Other',
];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [showIDCard, setShowIDCard] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointTransaction[]>([]);
  const [childModal, setChildModal] = useState(false);
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [childForm, setChildForm] = useState({ childName: '', childDob: '', childGender: 'other', relationship: 'other' });
  const [savingChild, setSavingChild] = useState(false);
  const [childAccountModal, setChildAccountModal] = useState<Child | null>(null);
  const [parentToggle, setParentToggle] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const age = calcAge(user?.dob);
  const isAdult = age !== null && age > 25;
  const isParent = user?.membershipType === 'parent_guardian';

  // Sync parent toggle with current membership
  useEffect(() => {
    setParentToggle(isParent);
  }, [isParent]);

  useEffect(() => {
    if (isParent) {
      childService.getMyChildren().then(r => setChildren(r.data.data)).catch(() => {});
    }
    pointsService.getMyHistory().then(r => setPointsHistory(r.data.data)).catch(() => {});
  }, [isParent]);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      bio: (user as { bio?: string })?.bio || '',
      state: (user as { state?: string })?.state || '',
      address: (user as { address?: string })?.address || '',
      emergencyContact: (user as { emergencyContact?: string })?.emergencyContact || '',
      gender: user?.gender || 'other',
      dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    },
  });

  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) });
  const childAccountForm = useForm<ChildAccountForm>({ resolver: zodResolver(childAccountSchema) });

  const onSaveProfile = async (data: ProfileForm) => {
    try {
      // Pass membershipType hint so backend can derive correctly
      const payload: Record<string, unknown> = { ...data };
      if (isAdult && parentToggle) payload.membershipType = 'parent_guardian';
      const res = await userService.updateMyProfile(payload);
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const onChangePassword = async (data: PwForm) => {
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed!');
      pwForm.reset();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const res = await userService.uploadProfileImage(file);
      updateUser({ profileImage: res.data.data.profileImage });
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); setAvatarPreview(null); }
    finally { setUploadingAvatar(false); }
  };

  const openAddChild = () => {
    setEditChild(null);
    setChildForm({ childName: '', childDob: '', childGender: 'other', relationship: 'other' });
    setChildModal(true);
  };
  const openEditChild = (c: Child) => {
    setEditChild(c);
    setChildForm({ childName: c.childName, childDob: c.childDob ? new Date(c.childDob).toISOString().split('T')[0] : '', childGender: c.childGender || 'other', relationship: c.relationship });
    setChildModal(true);
  };

  const handleSaveChild = async () => {
    if (!childForm.childName || !childForm.childDob) return toast.error('Name and date of birth are required');
    setSavingChild(true);
    try {
      if (editChild) {
        const res = await childService.updateChild(editChild._id, childForm);
        setChildren(prev => prev.map(c => c._id === editChild._id ? res.data.data : c));
        toast.success('Child updated');
      } else {
        const res = await childService.addChild(childForm);
        setChildren(prev => [...prev, res.data.data]);
        // Backend auto-updates membershipType — refresh user
        const meRes = await userService.getById(user!._id);
        updateUser(meRes.data.data);
        toast.success('Child added');
      }
      setChildModal(false);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSavingChild(false); }
  };

  const handleDeleteChild = async (id: string) => {
    if (!confirm('Remove this child record?')) return;
    try {
      await childService.deleteChild(id);
      setChildren(prev => prev.filter(c => c._id !== id));
      // Backend auto-reverts membershipType — refresh user
      const meRes = await userService.getById(user!._id);
      updateUser(meRes.data.data);
      toast.success('Child removed');
    } catch { toast.error('Failed'); }
  };

  const onCreateChildAccount = async (data: ChildAccountForm) => {
    if (!childAccountModal) return;
    try {
      await childService.createChildAccount(childAccountModal._id, {
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      setChildren(prev => prev.map(c => c._id === childAccountModal._id ? { ...c, hasAccount: true } : c));
      setChildAccountModal(null);
      childAccountForm.reset();
      toast.success('Account created! Awaiting admin approval.');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  if (!user) return null;
  const avatarSrc = avatarPreview || user.profileImage;
  const roleLabel = `${user.isVice ? 'Vice ' : ''}${user.role?.replace(/_/g, ' ')}`;

  const tabs = [
    ...TABS.slice(0, 2),
    ...(isParent || (isAdult && parentToggle) ? [{ id: 'children' as TabId, label: 'Children', icon: Baby }] : []),
    { id: 'points' as TabId, label: 'Points', icon: Star },
    ...TABS.slice(2),
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-slide-up">
      <div>
        <h1 className="page-title text-slate-800 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, security, and preferences</p>
      </div>

      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1e4db7] p-5 sm:p-6 text-white shadow-lg">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center gap-4 flex-wrap">
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
              {avatarSrc
                ? <img src={avatarSrc} alt={user.fullName} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-[#F97316] flex items-center justify-center text-white text-xl font-extrabold">{getInitials(user.fullName)}</div>}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#F97316] hover:bg-[#EA6C0A] rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50">
              {uploadingAvatar ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg sm:text-xl font-extrabold truncate">{user.fullName}</p>
            <p className="text-white/70 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="bg-[#F97316]/30 border border-[#F97316]/40 text-[#F97316] text-xs font-bold px-2.5 py-0.5 rounded-full capitalize">{roleLabel}</span>
              <span className="bg-white/15 text-white/80 text-xs font-semibold px-2.5 py-0.5 rounded-full">{membershipTypeLabel(user.membershipType)}</span>
              {age !== null && <span className="text-white/50 text-xs">{age} yrs old</span>}
            </div>
          </div>
          <div className="hidden sm:block ml-auto"><VOALogo size={40} onDark /></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as TabId)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center',
              activeTab === id ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Account Tab ──────────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4 text-[#1E3A8A]" /> Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" error={profileForm.formState.errors.fullName?.message}>
                  <input className={inputCls} placeholder="Your full name" {...profileForm.register('fullName')} />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} placeholder="08012345678" {...profileForm.register('phone')} />
                </Field>
                <Field label="Gender">
                  <select className={inputCls} {...profileForm.register('gender')}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Prefer not to say</option>
                  </select>
                </Field>
                <Field label={`Date of Birth${age !== null ? ` (Age: ${age})` : ''}`} error={profileForm.formState.errors.dob?.message}>
                  <input type="date" max={new Date().toISOString().split('T')[0]} className={inputCls} {...profileForm.register('dob')} />
                  {user.dob && <p className="text-xs text-slate-400 mt-1">{formatDOB(user.dob)}{age !== null ? ` · ${age} years old` : ''}</p>}
                </Field>
                <Field label="State / Chapter">
                  <input className={inputCls} placeholder="e.g. Lagos" {...profileForm.register('state')} />
                </Field>
                <Field label="Emergency Contact">
                  <input className={inputCls} placeholder="Name & phone" {...profileForm.register('emergencyContact')} />
                </Field>
              </div>
              <Field label="Address">
                <input className={inputCls} placeholder="Your address" {...profileForm.register('address')} />
              </Field>
              <Field label="Bio">
                <textarea rows={3} className={cn(inputCls, 'resize-none')} placeholder="A short description..." {...profileForm.register('bio')} />
              </Field>

              {/* Membership display — auto-derived, not a dropdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Membership Classification</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {user.membershipType === 'adolescent' ? '🧒' : user.membershipType === 'parent_guardian' ? '👨‍👧' : '👤'}
                  </span>
                  <div>
                    <p className="font-bold text-[#1E3A8A] dark:text-blue-400">{membershipTypeLabel(user.membershipType)}</p>
                    <p className="text-xs text-slate-400">Auto-classified from your date of birth{isParent ? ' and linked children' : ''}</p>
                  </div>
                </div>
                {/* Parent toggle — only for adults */}
                {isAdult && !isParent && (
                  <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-700">
                    <input type="checkbox" checked={parentToggle} onChange={e => setParentToggle(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#F97316]" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">I have children / I am a parent or guardian</p>
                      <p className="text-xs text-slate-400 mt-0.5">Checking this will switch your membership to Parent/Guardian. You can then add children in the Children tab.</p>
                    </div>
                  </label>
                )}
                {isParent && children.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    No children linked yet. Add children in the Children tab. Removing all children will revert your membership to Adult.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Read-only info */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Email', value: user.email },
                  { label: 'Role', value: roleLabel, cap: true },
                  { label: 'Member Since', value: user.createdAt ? formatDate(user.createdAt) : 'N/A' },
                  { label: 'Engagement', value: `${user.engagementScore} pts`, highlight: true },
                ].map(({ label, value, cap, highlight }) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                    <p className={cn('text-sm font-semibold mt-0.5 truncate', cap && 'capitalize', highlight ? 'text-[#F97316]' : 'text-slate-800 dark:text-white')}>{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <button type="submit" disabled={profileForm.formState.isSubmitting}
              className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50">
              {profileForm.formState.isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* ── Security Tab ─────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <form onSubmit={pwForm.handleSubmit(onChangePassword)}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-4 h-4 text-slate-500" /> Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
                const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password' };
                const key = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
                return (
                  <Field key={field} label={labels[field]} error={pwForm.formState.errors[field]?.message}>
                    <div className="relative">
                      <input type={showPw[key as keyof typeof showPw] ? 'text' : 'password'} placeholder="••••••••" className={inputCls} {...pwForm.register(field)} />
                      <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key as keyof typeof showPw] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw[key as keyof typeof showPw] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                );
              })}
              <div className="flex justify-end">
                <button type="submit" disabled={pwForm.formState.isSubmitting}
                  className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {pwForm.formState.isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* ── Children Tab ─────────────────────────────────────────────── */}
      {activeTab === 'children' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2"><Baby className="w-4 h-4 text-[#F97316]" /> My Children</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage your registered children. Adding a child updates your membership to Parent/Guardian.</p>
            </div>
            <button onClick={openAddChild} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Add Child
            </button>
          </div>

          {children.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Baby className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">No children added yet</p>
              <button onClick={openAddChild} className="mt-3 text-[#F97316] text-sm font-semibold hover:underline">Add your first child →</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {children.map(child => {
                const childAge = calcAge(child.childDob);
                const canCreateAccount = (childAge !== null && childAge >= 14) && !child.hasAccount;
                return (
                  <div key={child._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F97316]/20 flex items-center justify-center text-[#F97316] font-bold text-sm shrink-0">
                        {child.childName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-white truncate">{child.childName}</p>
                        <p className="text-xs text-slate-400 capitalize">{child.relationship}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-slate-500">{formatDOB(child.childDob)}</span>
                          {childAge !== null && <span className="text-xs font-semibold text-[#1E3A8A] dark:text-blue-400">{childAge} yrs</span>}
                          <span className="text-xs text-slate-400 capitalize">{child.childGender}</span>
                        </div>
                        {/* Account status */}
                        {child.hasAccount ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                            ✅ Account created
                          </span>
                        ) : canCreateAccount ? (
                          <button onClick={() => { setChildAccountModal(child); childAccountForm.reset(); }}
                            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1e3480] px-3 py-1.5 rounded-lg transition-colors">
                            <UserPlus className="w-3.5 h-3.5" /> Create account for this child
                          </button>
                        ) : childAge !== null && childAge < 14 ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Account available at age 14
                          </span>
                        ) : null}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEditChild(child)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteChild(child._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Points Tab ───────────────────────────────────────────────── */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Points', value: (user as { totalPoints?: number })?.totalPoints ?? user.points ?? 0, color: 'text-[#F97316]' },
              { label: 'Engagement Score', value: user.engagementScore, color: 'text-[#1E3A8A]' },
              { label: 'Founding Member', value: (user as { isFoundingMember?: boolean })?.isFoundingMember ? `#${(user as { foundingMemberRank?: number })?.foundingMemberRank}` : '—', color: 'text-amber-600' },
              { label: 'Early Contributor', value: (user as { earlyContributorBonusAwarded?: boolean })?.earlyContributorBonusAwarded ? '✅ Yes' : '—', color: 'text-[#22C55E]' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                <p className={`text-xl font-extrabold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Star className="w-4 h-4 text-[#F97316]" /> Points History</CardTitle></CardHeader>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {pointsHistory.length === 0
                ? <div className="py-10 text-center text-slate-400 text-sm">No points earned yet</div>
                : pointsHistory.map(pt => {
                  const typeColors: Record<string, string> = {
                    registration_bonus: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
                    early_contributor_bonus: 'text-[#22C55E] bg-green-50 dark:bg-green-900/20',
                    contribution_base: 'text-[#1E3A8A] bg-blue-50 dark:bg-blue-900/20',
                    contribution_extra: 'text-[#F97316] bg-orange-50 dark:bg-orange-900/20',
                  };
                  const cls = typeColors[pt.type] || 'text-slate-600 bg-slate-50';
                  return (
                    <div key={pt._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{pt.source}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(pt.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={cn('text-sm font-extrabold px-3 py-1 rounded-full', cls)}>+{pt.points} pts</span>
                    </div>
                  );
                })}
            </div>
          </Card>
        </div>
      )}

      {/* ── ID Card Tab ───────────────────────────────────────────────── */}
      {activeTab === 'idcard' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#F97316]" /> Member ID Card</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1e4db7] rounded-2xl p-5 text-white mb-5 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316] text-lg font-extrabold">{getInitials(user.fullName)}</div>
                <div>
                  <p className="font-extrabold">{user.fullName}</p>
                  <p className="text-white/60 text-xs capitalize">{roleLabel} · {membershipTypeLabel(user.membershipType)}</p>
                  {age !== null && <p className="text-white/50 text-xs">{age} years old</p>}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setShowIDCard(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all shadow-sm">
              <CreditCard className="w-5 h-5" /> Generate & Preview ID Card
            </button>
          </CardContent>
        </Card>
      )}

      {/* ── Appearance Tab ────────────────────────────────────────────── */}
      {activeTab === 'appearance' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-4 h-4 text-purple-500" /> Appearance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[{ id: 'light', label: 'Light', icon: Sun, active: !darkMode }, { id: 'dark', label: 'Dark', icon: Moon, active: darkMode }, { id: 'system', label: 'System', icon: Monitor, active: false }].map(({ id, label, icon: Icon, active }) => (
                <button key={id} onClick={() => { if (id === 'light' && darkMode) toggleDarkMode(); if (id === 'dark' && !darkMode) toggleDarkMode(); }}
                  className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all', active ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300')}>
                  <Icon className={cn('w-5 h-5', active ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400')} />
                  <span className={cn('text-xs font-semibold', active ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-500')}>{label}</span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Legal Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'legal' && (
        <div className="space-y-3">
          {[
            { label: 'VOA Constitution', desc: 'Governance, member rights and responsibilities', href: '/constitution', color: 'text-[#1E3A8A]', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Code of Conduct', desc: 'Expected behavior and disciplinary process', href: '/constitution#article-v', color: 'text-[#22C55E]', bg: 'bg-green-50 dark:bg-green-900/20' },
          ].map(({ label, desc, href, color, bg }) => (
            <Link key={label} href={href} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${bg}`}><BookOpen className={`w-4 h-4 ${color}`} /></div>
                <div><p className="text-sm font-bold text-slate-800 dark:text-white">{label}</p><p className="text-xs text-slate-400 mt-0.5">{desc}</p></div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors" />
            </Link>
          ))}
        </div>
      )}

      {/* ── ID Card Modal ─────────────────────────────────────────────── */}
      {showIDCard && <IDCardModal user={user} open={showIDCard} onClose={() => setShowIDCard(false)} />}

      {/* ── Add/Edit Child Modal ──────────────────────────────────────── */}
      <Modal open={childModal} onClose={() => setChildModal(false)} title={editChild ? 'Edit Child' : 'Add Child'}>
        <div className="space-y-4 p-1">
          <Field label="Child's Full Name">
            <input value={childForm.childName} onChange={e => setChildForm(p => ({ ...p, childName: e.target.value }))} placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Date of Birth">
            <input type="date" value={childForm.childDob} max={new Date().toISOString().split('T')[0]} onChange={e => setChildForm(p => ({ ...p, childDob: e.target.value }))} className={inputCls} />
            {childForm.childDob && <p className="text-xs text-[#1E3A8A] dark:text-blue-400 mt-1">Age: {calcAge(childForm.childDob)} years old</p>}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gender">
              <select value={childForm.childGender} onChange={e => setChildForm(p => ({ ...p, childGender: e.target.value }))} className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Relationship">
              <select value={childForm.relationship} onChange={e => setChildForm(p => ({ ...p, relationship: e.target.value }))} className={inputCls}>
                <option value="son">Son</option>
                <option value="daughter">Daughter</option>
                <option value="ward">Ward</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setChildModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button onClick={handleSaveChild} disabled={savingChild}
              className="flex-1 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {savingChild ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {editChild ? 'Save Changes' : 'Add Child'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Create Child Account Modal ────────────────────────────────── */}
      <Modal open={!!childAccountModal} onClose={() => setChildAccountModal(null)} title="Create Account for Child">
        {childAccountModal && (
          <form onSubmit={childAccountForm.handleSubmit(onCreateChildAccount)} className="space-y-4 p-1">
            {/* Pre-filled child info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Child Details (pre-filled)</p>
              <div className="flex justify-between text-sm"><span className="text-slate-400">Name</span><span className="font-semibold text-slate-700 dark:text-slate-300">{childAccountModal.childName}</span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Age</span><span className="font-semibold text-slate-700 dark:text-slate-300">{calcAge(childAccountModal.childDob)} years old</span></div>
              <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Membership</span><span className="font-semibold text-[#1E3A8A] dark:text-blue-400">🧒 Adolescent (auto)</span></div>
            </div>
            <Field label="Email for child's account" error={childAccountForm.formState.errors.email?.message}>
              <input type="email" placeholder="child@example.com" className={inputCls} {...childAccountForm.register('email')} />
            </Field>
            <Field label="Phone (optional)">
              <input placeholder="08012345678" className={inputCls} {...childAccountForm.register('phone')} />
            </Field>
            <Field label="Password" error={childAccountForm.formState.errors.password?.message}>
              <input type="password" placeholder="Min. 6 characters" className={inputCls} {...childAccountForm.register('password')} />
            </Field>
            <Field label="Confirm Password" error={childAccountForm.formState.errors.confirmPassword?.message}>
              <input type="password" placeholder="Repeat password" className={inputCls} {...childAccountForm.register('confirmPassword')} />
            </Field>
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              The account will be pending admin approval before the child can log in.
            </p>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setChildAccountModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              <button type="submit" disabled={childAccountForm.formState.isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1e3480] text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {childAccountForm.formState.isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Account
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
