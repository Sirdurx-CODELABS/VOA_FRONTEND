'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorAuthService } from '@/services/doctorApi.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VOALogo } from '@/components/ui/VOALogo';
import { Eye, EyeOff, Phone, Lock, Stethoscope, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  identifier: z.string().min(1, 'Phone or email required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function DoctorLoginPage() {
  const router = useRouter();
  const { setAuth } = useDoctorAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await doctorAuthService.login(data.identifier, data.password);
      const { token, doctor } = res.data.data;
      setAuth(doctor, token);
      toast.success(`Welcome, Dr. ${doctor.name.split(' ')[0]}!`);
      router.push('/dashboard/doctor');
    } catch (err: unknown) {
      const msg: string = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&auto=format&fit=crop&q=80"
          alt="Doctor consulting"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 auth-image-overlay" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <VOALogo size={56} onDark />
          <div className="max-w-xs">
            <div className="glass rounded-2xl p-5 mb-6">
              <Stethoscope className="w-5 h-5 text-[#F97316] mb-3" />
              <p className="text-white font-bold text-lg leading-snug">
                &ldquo;Quality care,<br />always within reach.&rdquo;
              </p>
              <p className="text-white/60 text-xs mt-2">— VOA Health Portal</p>
            </div>
            <h2 className="text-2xl font-extrabold text-white leading-tight">
              Welcome back, Doctor.
            </h2>
            <p className="text-white/70 mt-3 text-sm leading-relaxed">
              Sign in to manage consultations, review patient cases, and provide care.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <VOALogo size={48} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Doctor Sign In</h1>
          <p className="text-sm text-muted mb-8">Enter your credentials to access the doctor portal</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Phone or Email" type="text" placeholder="+234 801 234 5678 or doctor@example.com"
              icon={<Mail className="w-4 h-4" />} error={errors.identifier?.message} {...register('identifier')} />
            <div className="relative">
              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-8">
            Not registered yet?{' '}
            <Link href="/doctor/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
          <p className="text-center mt-4">
            <Link href="/login" className="text-xs text-muted hover:text-foreground underline">
              Back to Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
