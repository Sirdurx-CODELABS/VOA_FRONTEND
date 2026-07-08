'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import { isHmsRole, getDashboardRoute } from '@/lib/permissions';
import { Eye, EyeOff, Heart, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid email/phone or password': 'Invalid email/phone or password',
  'Your account is pending approval': 'Your account is pending approval.',
  'Your account has been deactivated': 'Your account has been deactivated. Contact your administrator.',
  'This account is not authorised to access the Hospital Management System': 'This account is not authorised for HMS.',
};

export default function HMSLoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hydrated } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const { register, handleSubmit, formState: { errors: rawErrors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  const errors = rawErrors as Record<string, { message?: string }>;

  useEffect(() => {
    if (_hydrated && isAuthenticated) {
      const user = useAuthStore.getState().user;
      if (user) {
        setRedirecting(true);
        const timer = setTimeout(() => router.replace(getDashboardRoute(user)), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [_hydrated, isAuthenticated, router]);

  if (_hydrated && isAuthenticated && redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
          <p className="text-blue-200 text-sm font-medium tracking-wide">Loading Clinical Workspace...</p>
        </div>
      </div>
    );
  }

  if (_hydrated && isAuthenticated) return null;

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.login({ identifier: data.identifier, password: data.password, portal: 'hms' });
      const { token, user, organization, staffProfile, portal: userPortal } = res.data.data;

      if (!isHmsRole(user.role)) {
        setError('This account is not authorised for HMS.');
        setIsLoading(false);
        return;
      }

      setAuth(user, token, userPortal, organization, staffProfile, null);
      toast.success(`Welcome, ${user.fullName.split(' ')[0]}!`);

      setRedirecting(true);
      setTimeout(() => router.replace(getDashboardRoute(user)), 800);
    } catch (err: unknown) {
      const serverMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      const friendly = ERROR_MESSAGES[serverMsg] || serverMsg || 'Unable to reach server. Please try again.';
      setError(friendly);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Left - Healthcare Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1000" height="1000" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/80 text-sm font-medium tracking-wide">VOA HEALTH</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Hospital Management System
          </h1>
          <p className="text-blue-200/80 text-base leading-relaxed max-w-md">
            Secure access for clinical staff. Manage patients, consultations, 
            AI clinical assistance, pharmacy, laboratory, and hospital operations 
            from one platform.
          </p>
          <div className="mt-10 flex gap-4">
            {['Doctors', 'Nurses', 'Pharmacists', 'Lab Scientists'].map(role => (
              <span key={role} className="text-[11px] px-3 py-1.5 rounded-full bg-white/10 text-blue-200 border border-white/10">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hospital Management System</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to continue</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            {error && (
              <div className={`mb-5 p-3.5 rounded-xl border flex items-start gap-3 animate-[shake_0.5s_ease-in-out] ${error.includes('authorised') || error.includes('contact')
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${error.includes('authorised') || error.includes('contact') ? 'text-orange-500' : 'text-red-500'}`} />
                <p className={`text-xs leading-relaxed ${error.includes('authorised') || error.includes('contact') ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'}`}>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <input
                    {...register('identifier')}
                    type="text"
                    placeholder="doctor@hospital.com or 080XXXXXXX"
                    autoComplete="username"
                    className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 ${errors.identifier ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20'}`}
                  />
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`w-full h-11 pl-10 pr-10 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 ${errors.password ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20'}`}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Back to Home
            </Link>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Organisation Login
            </Link>
          </div>

          <p className="mt-4 text-xs text-center text-slate-400 dark:text-slate-500">
            Only authorised hospital staff can access this portal.
          </p>
        </div>
      </div>
    </div>
  );
}