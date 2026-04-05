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
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, ChevronLeft, Check, BookOpen, Heart, Megaphone, Users, Code, Music, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type Step1Data = z.infer<typeof step1Schema>;

const INTERESTS = [
  { id: 'community', label: 'Community Service', icon: Heart, color: 'text-red-500' },
  { id: 'advocacy', label: 'Advocacy & Policy', icon: Megaphone, color: 'text-[#F97316]' },
  { id: 'leadership', label: 'Leadership', icon: Users, color: 'text-[#1E3A8A]' },
  { id: 'tech', label: 'Technology', icon: Code, color: 'text-purple-500' },
  { id: 'arts', label: 'Arts & Culture', icon: Music, color: 'text-pink-500' },
  { id: 'global', label: 'Global Issues', icon: Globe, color: 'text-[#22C55E]' },
];

function StepIndicator({ current }: { current: number }) {
  const steps = ['Personal Info', 'Interests', 'Review'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300', done ? 'step-done' : active ? 'step-active' : 'step-inactive')}>
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <span className={cn('text-[10px] mt-1 font-semibold whitespace-nowrap', active ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400')}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={cn('w-12 h-0.5 mx-1 mb-4 transition-all duration-300', done ? 'bg-[#22C55E]' : 'bg-slate-200 dark:bg-slate-700')} />}
          </div>
        );
      })}
    </div>
  );
}

function ConstitutionModal({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  if (!loaded) {
    fetch('/voa-constitution.md').then(r => r.text()).then(t => { setContent(t); setLoaded(true); });
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
            <span className="font-bold text-slate-800 dark:text-white">VOA Constitution & Policies</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {!loaded ? (
            <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}</div>
          ) : (
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:text-[#1E3A8A] dark:prose-headings:text-blue-400 prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800 prose-h2:pb-2 prose-blockquote:border-l-[#F97316] prose-blockquote:bg-orange-50 dark:prose-blockquote:bg-orange-900/10 prose-blockquote:rounded-r-lg prose-table:text-xs prose-th:bg-slate-50 dark:prose-th:bg-slate-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-between items-center">
          <Link href="/constitution" target="_blank" className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
            Open full page <ChevronRight className="w-3 h-3" />
          </Link>
          <Button onClick={onClose} size="sm">I&apos;ve Read It</Button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showConstitution, setShowConstitution] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  const onStep1 = (data: Step1Data) => { setStep1Data(data); setStep(2); };

  const onStep2 = () => {
    if (selectedInterests.length === 0) return toast.error('Select at least one interest');
    if (!agreeToTerms) return toast.error('You must agree to the VOA Constitution');
    setStep(3);
  };

  const onSubmit = async () => {
    if (!step1Data) return;
    setSubmitting(true);
    try {
      await authService.register({ fullName: step1Data.fullName, email: step1Data.email, password: step1Data.password, phone: step1Data.phone });
      setShowCelebration(true);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const toggleInterest = (id: string) =>
    setSelectedInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=900&auto=format&fit=crop&q=80" alt="Youth community" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 auth-image-overlay" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <VOALogo size={56} onDark />
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight">Empowering Voices.<br />Building Futures.</h2>
            <p className="text-white/70 mt-3 text-sm leading-relaxed max-w-xs">Join thousands of young change-makers shaping communities and building a better tomorrow.</p>
            <div className="flex gap-4 mt-8">
              {[{ n: '500+', l: 'Members' }, { n: '50+', l: 'Programs' }, { n: '3yrs', l: 'Impact' }].map(s => (
                <div key={s.l} className="glass rounded-xl px-4 py-3 text-center">
                  <p className="text-xl font-extrabold text-white">{s.n}</p>
                  <p className="text-xs text-white/60 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-xs">&copy; {new Date().getFullYear()} Voice of Adolescents</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0F172A] overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden mb-6 flex justify-center"><VOALogo size={64} /></div>
          <StepIndicator current={step} />

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-7 animate-slide-up">

            {/* Step 1 */}
            {step === 1 && (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Personal Information</h1>
                  <p className="text-slate-500 text-sm mt-1">Tell us about yourself</p>
                </div>
                <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
                  <Input label="Full Name" placeholder="John Doe" icon={<User className="w-4 h-4" />} error={errors.fullName?.message} {...register('fullName')} />
                  <Input label="Email Address" type="email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} error={errors.email?.message} {...register('email')} />
                  <Input label="Phone (optional)" placeholder="08012345678" icon={<Phone className="w-4 h-4" />} {...register('phone')} />
                  <div className="relative">
                    <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" icon={<Lock className="w-4 h-4" />} error={errors.password?.message} {...register('password')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Input label="Confirm Password" type="password" placeholder="Repeat password" icon={<Lock className="w-4 h-4" />} error={errors.confirmPassword?.message} {...register('confirmPassword')} />
                  <Button type="submit" className="w-full mt-2" size="lg">Continue <ChevronRight className="w-4 h-4" /></Button>
                </form>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Your Interests</h1>
                  <p className="text-slate-500 text-sm mt-1">What areas are you passionate about?</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {INTERESTS.map(({ id, label, icon: Icon, color }) => {
                    const selected = selectedInterests.includes(id);
                    return (
                      <button key={id} type="button" onClick={() => toggleInterest(id)}
                        className={cn('flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150 text-sm font-semibold',
                          selected ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 text-[#1E3A8A] dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300')}>
                        <Icon className={cn('w-4 h-4 shrink-0', selected ? 'text-[#1E3A8A] dark:text-blue-400' : color)} />
                        {label}
                        {selected && <Check className="w-3.5 h-3.5 ml-auto text-[#22C55E]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#1E3A8A] cursor-pointer" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      I have read and agree to the{' '}
                      <button type="button" onClick={() => setShowConstitution(true)} className="text-[#1E3A8A] dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1">
                        VOA Constitution & Policies <BookOpen className="w-3 h-3" />
                      </button>
                    </span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ChevronLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={onStep2} className="flex-1">Continue <ChevronRight className="w-4 h-4" /></Button>
                </div>
              </>
            )}

            {/* Step 3 */}
            {step === 3 && step1Data && (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Review & Confirm</h1>
                  <p className="text-slate-500 text-sm mt-1">Everything look good?</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3 mb-5 border border-slate-200 dark:border-slate-700">
                  {[
                    { label: 'Full Name', value: step1Data.fullName },
                    { label: 'Email', value: step1Data.email },
                    { label: 'Phone', value: step1Data.phone || 'Not provided' },
                    { label: 'Interests', value: selectedInterests.map(id => INTERESTS.find(i => i.id === id)?.label).join(', ') || 'None' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 text-right font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-5 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
                  <span className="text-xs text-green-700 dark:text-green-400 font-semibold">VOA Constitution agreed</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ChevronLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={onSubmit} loading={submitting} className="flex-1">Join VOA 🎉</Button>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already a member?{' '}
            <Link href="/login" className="text-[#F97316] font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {showConstitution && <ConstitutionModal onClose={() => setShowConstitution(false)} />}
      {showCelebration && <CelebrationModal name={step1Data?.fullName.split(' ')[0] || 'Friend'} onClose={() => setShowCelebration(false)} />}
    </div>
  );
}
