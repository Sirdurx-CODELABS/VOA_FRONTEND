'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doctorAuthService, referenceService } from '@/services/doctorApi.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { VOALogo } from '@/components/ui/VOALogo';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Full name required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  medicalLicense: z.string().min(3, 'Medical license number required'),
  specialization: z.string().min(2, 'Specialization required'),
  department: z.string().optional(),
  state: z.string().min(2, 'State required'),
  lga: z.string().min(2, 'LGA required'),
  yearsOfExperience: z.string().min(1, 'Required'),
  consultationFee: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormData>({ resolver: zodResolver(schema) });
  const selectedState = watch('state');

  useEffect(() => {
    Promise.all([
      referenceService.getStates(),
      referenceService.getSpecializations(),
      referenceService.getDepartments(),
    ]).then(([sRes, specRes, depRes]) => {
      setStates(sRes.data.data);
      setSpecializations(specRes.data.data);
      setDepartments(depRes.data.data);
    }).catch(() => {
      toast.error('Failed to load reference data');
    }).finally(() => setLoadingRefs(false));
  }, []);

  useEffect(() => {
    if (selectedState) {
      referenceService.getLGAs(selectedState).then(res => {
        setLgas(res.data.data);
        setValue('lga', '');
      }).catch(() => setLgas([]));
    } else {
      setLgas([]);
    }
  }, [selectedState, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data, yearsOfExperience: parseInt(data.yearsOfExperience) || 0,
        consultationFee: parseInt(data.consultationFee) || 0,
      };
      const res = await doctorAuthService.register(payload);
      toast.success(res.data.message || 'Registration successful!');
      router.push('/doctor/login');
    } catch (err: unknown) {
      const msg: string = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    }
  };

  const selectClass = 'w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none';

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80"
          alt="Medical professionals"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 auth-image-overlay" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <VOALogo size={56} onDark />
          <div className="max-w-xs">
            <div className="glass rounded-2xl p-5 mb-6">
              <p className="text-white font-bold text-lg leading-snug">
                &ldquo;Join our network<br />of healthcare providers.&rdquo;
              </p>
              <p className="text-white/60 text-xs mt-2">— VOA Doctor Network</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex justify-center mb-8">
            <VOALogo size={48} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Doctor Registration</h1>
          <p className="text-sm text-muted mb-8">Register to provide care through VOA Health</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full Name" placeholder="Dr. John Doe" error={errors.name?.message} {...register('name')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone" type="tel" placeholder="+234 801 234 5678" error={errors.phone?.message} {...register('phone')} />
              <Input label="Email (optional)" type="email" placeholder="doctor@example.com" error={errors.email?.message} {...register('email')} />
            </div>
            <div className="relative">
              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                error={errors.password?.message} {...register('password')} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Medical License #" placeholder="MLN-12345" error={errors.medicalLicense?.message} {...register('medicalLicense')} />
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Specialization</label>
                <select className={selectClass} disabled={loadingRefs} {...register('specialization')}>
                  <option value="">{loadingRefs ? 'Loading...' : 'Select specialization'}</option>
                  {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Department (optional)</label>
              <select className={selectClass} disabled={loadingRefs} {...register('department')}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">State</label>
                <select className={selectClass} disabled={loadingRefs} {...register('state')}>
                  <option value="">{loadingRefs ? 'Loading...' : 'Select state'}</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">LGA</label>
                <select className={selectClass} disabled={!selectedState || loadingRefs} {...register('lga')}>
                  <option value="">{!selectedState ? 'Select state first' : 'Select LGA'}</option>
                  {lgas.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {errors.lga && <p className="text-xs text-red-500 mt-1">{errors.lga.message}</p>}
              </div>
            </div>
            <Input label="Years of Experience" type="number" placeholder="5" error={errors.yearsOfExperience?.message} {...register('yearsOfExperience')} />
            <Input label="Consultation Fee (NGN)" type="number" placeholder="5000" error={errors.consultationFee?.message} {...register('consultationFee')} />
            <Button type="submit" loading={isSubmitting} className="w-full">Register</Button>
          </form>

          <p className="text-center text-sm text-muted mt-8">
            Already registered?{' '}
            <Link href="/doctor/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
