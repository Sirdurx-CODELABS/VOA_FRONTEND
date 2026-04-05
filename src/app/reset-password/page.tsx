'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Shield, CheckCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) return toast.error('Invalid reset link');
    try {
      await authService.resetPassword({ token, password: data.password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
      {done ? (
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">Password updated!</p>
          <p className="text-sm text-gray-500 mt-1">Redirecting to login...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {!token && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              Invalid or missing reset token. Please request a new password reset.
            </div>
          )}
          <div className="relative">
            <Input label="New Password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
              error={errors.password?.message} {...register('password')} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-gray-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input label="Confirm Password" type="password" placeholder="••••••••"
            error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" loading={isSubmitting} disabled={!token} className="w-full">Reset Password</Button>
        </form>
      )}
      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">← Back to login</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Choose a strong password for your account</p>
        </div>
        <Suspense fallback={<div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center text-gray-400">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
