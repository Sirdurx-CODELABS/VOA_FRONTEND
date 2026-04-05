'use client';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/api.service';
import { IDCardModal } from '@/components/ui/IDCard';
import { VOALogo } from '@/components/ui/VOALogo';
import { getInitials, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  User, Lock, Palette, CreditCard, BookOpen, Bell,
  Camera, Save, ExternalLink, Sun, Moon, Monitor,
  CheckCircle, Eye, EyeOff, Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

/* ── Schemas ─────────────────────────────────────────────────────────────── */
const profileSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().optional(),
  bio: z.string().max(300).optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type PwForm = z.infer<typeof pwSchema>;

/* ── Tab config ──────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'account',    label: 'Account',     icon: User },
  { id: 'security',   label: 'Security',    icon: Lock },
  { id: 'idcard',     label: 'ID Card',     icon: CreditCard },
  { id: 'appearance', label: 'Appearance',  icon: Palette },
  { id: 'legal',      label: 'Legal',       icon: BookOpen },
] as const;
type TabId = typeof TABS[number]['id'];

/* ── Field component ─────────────────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function TextInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5',
        'placeholder-slate-400 transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] dark:focus:border-blue-400',
        error ? 'border-red-400' : 'border-slate-300 dark:border-slate-700',
      )}
      {...props}
    />
  );
}

function TextArea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] resize-none transition-all"
      {...props}
    />
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [showIDCard, setShowIDCard] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      bio: (user as { bio?: string })?.bio || '',
      state: (user as { state?: string })?.state || '',
      address: (user as { address?: string })?.address || '',
      emergencyContact: (user as { emergencyContact?: string })?.emergencyContact || '',
    },
  });

  const pwForm = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  const onSaveProfile = async (data: ProfileForm) => {
    try {
      const res = await userService.updateMyProfile(data);
      updateUser(res.data.data);
      toast.success('Profile updated successfully!');
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update');
    }
  };

  const onChangePassword = async (data: PwForm) => {
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully!');
      pwForm.reset();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploadingAvatar(true);
    try {
      const res = await userService.uploadProfileImage(file);
      updateUser({ profileImage: res.data.data.profileImage });
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Upload failed');
      setAvatarPreview(null);
    } finally { setUploadingAvatar(false); }
  };

  if (!user) return null;

  const avatarSrc = avatarPreview || user.profileImage;
  const roleLabel = `${user.isVice ? 'Vice ' : ''}${user.role?.replace(/_/g, ' ')}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your profile, security, and preferences</p>
      </div>

      {/* Profile hero card */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand-soft p-6 text-white shadow-lg">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 right-20 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar with upload */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#F97316] flex items-center justify-center text-white text-2xl font-extrabold">
                  {getInitials(user.fullName)}
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#F97316] hover:bg-[#EA6C0A] rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
              title="Change photo"
            >
              {uploadingAvatar ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold truncate">{user.fullName}</p>
            <p className="text-white/70 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-[#F97316]/30 border border-[#F97316]/40 text-[#F97316] text-xs font-bold px-2.5 py-0.5 rounded-full capitalize">{roleLabel}</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${user.status === 'active' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>{user.status}</span>
              <span className="text-white/50 text-xs">⭐ {user.engagementScore} pts</span>
            </div>
          </div>
          <div className="ml-auto hidden sm:block">
            <VOALogo size={52} onDark />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-150 flex-1 justify-center',
              activeTab === id
                ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
            )}>
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Account Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#1E3A8A]" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" error={profileForm.formState.errors.fullName?.message}>
                <TextInput placeholder="Your full name" error={profileForm.formState.errors.fullName?.message} {...profileForm.register('fullName')} />
              </Field>
              <Field label="Phone Number">
                <TextInput placeholder="08012345678" {...profileForm.register('phone')} />
              </Field>
              <Field label="State / Chapter">
                <TextInput placeholder="e.g. Lagos" {...profileForm.register('state')} />
              </Field>
              <Field label="Emergency Contact">
                <TextInput placeholder="Name & phone" {...profileForm.register('emergencyContact')} />
              </Field>
            </div>
            <Field label="Address">
              <TextInput placeholder="Your address (optional)" {...profileForm.register('address')} />
            </Field>
            <Field label="Bio">
              <TextArea rows={3} placeholder="A short description about yourself..." {...profileForm.register('bio')} />
            </Field>
          </div>

          {/* Read-only info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">Account Info</h2>
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
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={profileForm.formState.isSubmitting}
              className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50">
              {profileForm.formState.isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* ── Security Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <form onSubmit={pwForm.handleSubmit(onChangePassword)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" /> Change Password
            </h2>
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
              const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password' };
              const key = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
              return (
                <Field key={field} label={labels[field]} error={pwForm.formState.errors[field]?.message}>
                  <div className="relative">
                    <TextInput
                      type={showPw[key as keyof typeof showPw] ? 'text' : 'password'}
                      placeholder="••••••••"
                      error={pwForm.formState.errors[field]?.message}
                      {...pwForm.register(field)}
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key as keyof typeof showPw] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
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
          </div>
        </form>
      )}

      {/* ── ID Card Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'idcard' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-[#F97316]" /> Member ID Card
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              Generate your official VOA membership card with front and back design. Export as PNG, PDF, or print directly.
            </p>
            {/* Mini preview */}
            <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1e4db7] rounded-2xl p-5 text-white mb-5 relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316] text-lg font-extrabold">
                  {getInitials(user.fullName)}
                </div>
                <div>
                  <p className="font-extrabold">{user.fullName}</p>
                  <p className="text-white/60 text-xs capitalize">{roleLabel}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-white/40">Member ID</p>
                  <p className="text-xs font-mono font-bold text-white/70">VOA-{new Date(user.createdAt || Date.now()).getFullYear()}-{(user._id || '000000').slice(-6).toUpperCase()}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIDCard(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all shadow-sm shadow-orange-200 dark:shadow-orange-900/20"
            >
              <CreditCard className="w-5 h-5" />
              Generate & Preview ID Card
            </button>
          </div>
        </div>
      )}

      {/* ── Appearance Tab ────────────────────────────────────────────────── */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-500" /> Appearance
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun, active: !darkMode },
              { id: 'dark', label: 'Dark', icon: Moon, active: darkMode },
              { id: 'system', label: 'System', icon: Monitor, active: false },
            ].map(({ id, label, icon: Icon, active }) => (
              <button key={id} onClick={() => { if (id === 'light' && darkMode) toggleDarkMode(); if (id === 'dark' && !darkMode) toggleDarkMode(); }}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                  active ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300',
                )}>
                <Icon className={cn('w-5 h-5', active ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400')} />
                <span className={cn('text-xs font-semibold', active ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-500')}>{label}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Legal Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'legal' && (
        <div className="space-y-3">
          {[
            { label: 'VOA Constitution', desc: 'Governance, member rights and responsibilities', href: '/constitution', color: 'text-[#1E3A8A]', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Terms & Conditions', desc: 'Platform usage terms and member obligations', href: '/constitution#article-iv', color: 'text-[#F97316]', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { label: 'Code of Conduct', desc: 'Expected behavior and disciplinary process', href: '/constitution#article-v', color: 'text-[#22C55E]', bg: 'bg-green-50 dark:bg-green-900/20' },
          ].map(({ label, desc, href, color, bg }) => (
            <Link key={label} href={href}
              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <BookOpen className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors" />
            </Link>
          ))}
        </div>
      )}

      {/* ID Card Modal */}
      <IDCardModal user={user} open={showIDCard} onClose={() => setShowIDCard(false)} />
    </div>
  );
}
