'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VOALogo } from '@/components/ui/VOALogo';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({ email: z.string().email('Invalid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.forgotPassword(data.email);
      setDone(true);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><VOALogo size={64} /></div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#22C55E]" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Check your inbox</h2>
              <p className="text-slate-500 text-sm mt-2">We sent a password reset link to your email. Check your spam folder too.</p>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Reset password</h1>
                <p className="text-slate-500 text-sm mt-1">Enter your email and we&apos;ll send you a reset link</p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input label="Email address" type="email" placeholder="you@example.com"
                  icon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
                <Button type="submit" loading={isSubmitting} className="w-full" size="lg">Send Reset Link</Button>
              </form>
            </>
          )}
          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
