'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import api from '@/lib/axios';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VOALogo } from '@/components/ui/VOALogo';
import { Eye, EyeOff, MailCheck, Mail, Lock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setUnverifiedEmail('');
      const res = await authService.login(data);
      const { token, user } = res.data.data;
      setAuth(user, token);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}! 👋`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg: string = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      if (msg.toLowerCase().includes('verify your email')) setUnverifiedEmail(getValues('email'));
      toast.error(msg);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification email sent! Check your inbox.');
      setUnverifiedEmail('');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to resend');
    } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: NGO image panel ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&auto=format&fit=crop&q=80"
          alt="Community volunteers"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 auth-image-overlay" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <VOALogo size={56} onDark />

          <div className="max-w-xs">
            {/* Quote */}
            <div className="glass rounded-2xl p-5 mb-6">
              <Sparkles className="w-5 h-5 text-[#F97316] mb-3" />
              <p className="text-white font-bold text-lg leading-snug">
                &ldquo;Empowering Voices.<br />Building Futures.&rdquo;
              </p>
              <p className="text-white/60 text-xs mt-2">— VOA Mission Statement</p>
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-tight">
              Your community is waiting for you.
            </h2>
            <p className="text-white/70 mt-3 text-sm leading-relaxed">
              Sign in to access programs, track your impact, and connect with fellow change-makers.
            </p>

            {/* Stats */}
            <div className="flex gap-4 mt-6">
              {[{ n: '500+', l: 'Members' }, { n: '50+', l: 'Programs' }, { n: '3yrs', l: 'Impact' }].map(s => (
                <div key={s.l} className="glass rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-extrabold text-white">{s.n}</p>
                  <p className="text-[10px] text-white/60 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} Voice of Adolescents</p>
        </div>
      </div>

      {/* ── Right: Form panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0F172A]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center"><VOALogo size={64} /></div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Welcome back</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to VOA Management System</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input label="Email address" type="email" placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
              <div className="relative">
                <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" loading={isSubmitting} className="w-full" size="lg">Sign in</Button>
            </form>

            {/* Unverified email banner */}
            {unverifiedEmail && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl animate-slide-up">
                <div className="flex items-start gap-3">
                  <MailCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Email not verified</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Check your inbox or request a new link.</p>
                    <button onClick={handleResend} disabled={resending}
                      className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline disabled:opacity-50">
                      {resending ? 'Sending...' : 'Resend verification email →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800" /></div>
              <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">or</span></div>
            </div>

            <p className="text-center text-sm text-slate-500">
              New to VOA?{' '}
              <Link href="/register" className="text-[#F97316] font-bold hover:underline">Create an account</Link>
            </p>
          </div>

          {/* Constitution link */}
          <p className="text-center text-xs text-slate-400 mt-4">
            By signing in, you agree to the{' '}
            <Link href="/constitution" className="text-[#1E3A8A] dark:text-blue-400 hover:underline font-medium">VOA Constitution</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
