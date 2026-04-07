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
import {
  Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, ChevronLeft,
  Check, BookOpen, Plus, Trash2, Baby, X,
} from 'lucide-react';
import { cn, calcAge } from '@/lib/utils';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ── Schemas ─────────────────────────────────────────────────────────────── */
const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  gender: z.string().min(1, 'Gender required'),
  password: z.string().min(6, 'Minimum 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
});
type Step1Data = z.infer<typeof step1Schema>;

const step2Schema = z.object({
  dob: z.string().min(1, 'Date of birth required').refine(v => new Date(v) < new Date(), 'DOB cannot be in the future'),
});
type Step2Data = z.infer<typeof step2Schema>;

interface ChildEntry { childName: string; childDob: string; childGender: string; relationship: string; }

const INTERESTS = [
  'Health Advocacy', 'Community Outreach', 'Media & Communications', 'Leadership',
  'Welfare Support', 'Fundraising', 'Public Speaking', 'Volunteering',
  'Skill Development', 'Education', 'Youth Empowerment', 'Other',
];

/* ── Derive membership from age ─────────────────────────────────────────── */
function deriveMembership(dob: string, isParent: boolean): { type: string; label: string; icon: string; desc: string } {
  const age = calcAge(dob);
  if (age === null) return { type: 'adolescent', label: 'Adolescent', icon: '🧒', desc: 'Age 13–25' };
  if (age <= 25) return { type: 'adolescent', label: 'Adolescent', icon: '🧒', desc: `Age ${age}` };
  if (isParent) return { type: 'parent_guardian', label: 'Parent / Guardian', icon: '👨‍👧', desc: `Age ${age} · with children` };
  return { type: 'adult', label: 'Adult', icon: '👤', desc: `Age ${age}` };
}

/* ── Step indicator ──────────────────────────────────────────────────────── */
function StepIndicator({ current }: { current: number }) {
  const steps = ['Basic Info', 'Membership', 'Interests', 'Review'];
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((label, i) => {
        const idx = i + 1; const done = idx < current; const active = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done ? 'bg-[#22C55E] text-white' : active ? 'bg-[#1E3A8A] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400')}>
                {done ? <Check className="w-3.5 h-3.5" /> : idx}
              </div>
              <span className={cn('text-[9px] mt-1 font-semibold whitespace-nowrap hidden sm:block',
                active ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-400')}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-8 sm:w-12 h-0.5 mx-1 mb-4 transition-all', done ? 'bg-[#22C55E]' : 'bg-slate-200 dark:bg-slate-700')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConstitutionModal({ onClose }: { onClose: () => void }) {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  if (!loaded) fetch('/voa-constitution.md').then(r => r.text()).then(t => { setContent(t); setLoaded(true); });
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#1E3A8A]" /><span className="font-bold text-slate-800 dark:text-white">VOA Constitution</span></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {!loaded
            ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}</div>
            : <div className="prose prose-sm prose-slate dark:prose-invert max-w-none prose-headings:text-[#1E3A8A] dark:prose-headings:text-blue-400"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-end">
          <Button onClick={onClose} size="sm">I&apos;ve Read It</Button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [isParentToggle, setIsParentToggle] = useState(false);
  const [children, setChildren] = useState<ChildEntry[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showConstitution, setShowConstitution] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [registeredName, setRegisteredName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const s1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { gender: 'other' } });
  const s2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const dob = s2.watch('dob');

  // Derive membership from DOB + parent toggle
  const membership = dob ? deriveMembership(dob, isParentToggle) : null;
  const age = dob ? calcAge(dob) : null;
  const isAdult = age !== null && age > 25;
  const showParentToggle = isAdult;
  const showChildrenSection = isAdult && isParentToggle;

  const addChild = () => setChildren(p => [...p, { childName: '', childDob: '', childGender: 'other', relationship: 'other' }]);
  const removeChild = (i: number) => setChildren(p => p.filter((_, idx) => idx !== i));
  const updateChild = (i: number, k: keyof ChildEntry, v: string) =>
    setChildren(p => p.map((c, idx) => idx === i ? { ...c, [k]: v } : c));

  const onStep1 = (data: Step1Data) => { setStep1Data(data); setStep(2); };
  const onStep2 = (data: Step2Data) => { setStep2Data(data); setStep(3); };
  const onStep3 = () => {
    if (!agreeToTerms) return toast.error('You must agree to the VOA Constitution');
    setStep(4);
  };

  const onSubmit = async () => {
    if (!step1Data || !step2Data) return;
    setSubmitting(true);
    try {
      await authService.register({
        fullName: step1Data.fullName,
        email: step1Data.email,
        password: step1Data.password,
        phone: step1Data.phone,
        gender: step1Data.gender,
        dob: step2Data.dob,
        interests: selectedInterests,
        children: showChildrenSection ? children.filter(c => c.childName && c.childDob) : [],
      });
      setRegisteredName(step1Data.fullName.split(' ')[0]);
      setShowCelebration(true);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const fieldCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]';
  const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=900&auto=format&fit=crop&q=80" alt="Youth" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/90 to-[#1e4db7]/80" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <VOALogo size={52} onDark />
          <div>
            <h2 className="text-3xl font-extrabold text-white leading-tight">Empowering Voices.<br />Building Futures.</h2>
            <p className="text-white/70 mt-3 text-sm leading-relaxed max-w-xs">Join thousands of young change-makers shaping communities.</p>
            <div className="flex gap-3 mt-6">
              {[{ icon: '🧒', label: 'Adolescent', desc: 'Age 13–25' }, { icon: '👤', label: 'Adult', desc: 'Age 25+' }, { icon: '👨‍👧', label: 'Parent', desc: 'With children' }].map(t => (
                <div key={t.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 text-center flex-1">
                  <p className="text-lg">{t.icon}</p>
                  <p className="text-[10px] text-white/70 font-semibold mt-0.5">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/30 text-xs">&copy; {new Date().getFullYear()} Voice of Adolescents</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0F172A] overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          <div className="lg:hidden mb-5 flex justify-center"><VOALogo size={52} /></div>
          <StepIndicator current={step} />

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">

            {/* ── STEP 1: Basic Info ────────────────────────────────── */}
            {step === 1 && (
              <>
                <div className="mb-5">
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Basic Information</h1>
                  <p className="text-slate-500 text-sm mt-1">Your account details — no DOB here</p>
                </div>
                <form onSubmit={s1.handleSubmit(onStep1)} className="space-y-4">
                  <Input label="Full Name" placeholder="John Doe" icon={<User className="w-4 h-4" />} error={s1.formState.errors.fullName?.message} {...s1.register('fullName')} />
                  <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail className="w-4 h-4" />} error={s1.formState.errors.email?.message} {...s1.register('email')} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Phone (optional)" placeholder="08012345678" icon={<Phone className="w-4 h-4" />} {...s1.register('phone')} />
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select className={fieldCls} {...s1.register('gender')}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters" icon={<Lock className="w-4 h-4" />} error={s1.formState.errors.password?.message} {...s1.register('password')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-9 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Input label="Confirm Password" type="password" placeholder="Repeat password" icon={<Lock className="w-4 h-4" />} error={s1.formState.errors.confirmPassword?.message} {...s1.register('confirmPassword')} />
                  <Button type="submit" className="w-full mt-2" size="lg">Continue <ChevronRight className="w-4 h-4" /></Button>
                </form>
              </>
            )}

            {/* ── STEP 2: Membership + DOB ──────────────────────────── */}
            {step === 2 && (
              <>
                <div className="mb-5">
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Membership Details</h1>
                  <p className="text-slate-500 text-sm mt-1">Your membership type is determined automatically from your date of birth</p>
                </div>
                <form onSubmit={s2.handleSubmit(onStep2)} className="space-y-5">
                  {/* DOB */}
                  <div>
                    <label className={labelCls}>Date of Birth</label>
                    <input type="date" max={new Date().toISOString().split('T')[0]}
                      className={cn(fieldCls, s2.formState.errors.dob && 'border-red-400')} {...s2.register('dob')} />
                    {s2.formState.errors.dob && <p className="mt-1 text-xs text-red-500">{s2.formState.errors.dob.message}</p>}
                  </div>

                  {/* Auto-derived membership display */}
                  {membership && (
                    <div className="p-4 rounded-xl border-2 border-[#1E3A8A]/30 bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/10">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your Membership Type</p>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{membership.icon}</span>
                        <div>
                          <p className="font-extrabold text-[#1E3A8A] dark:text-blue-400 text-base">{membership.label}</p>
                          <p className="text-xs text-slate-500">{membership.desc} · auto-classified from your DOB</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parent/Guardian toggle — only for age > 25 */}
                  {showParentToggle && (
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <input type="checkbox" checked={isParentToggle} onChange={e => {
                        setIsParentToggle(e.target.checked);
                        if (!e.target.checked) setChildren([]);
                      }} className="mt-0.5 w-4 h-4 rounded accent-[#F97316]" />
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">I am registering as a parent / guardian</p>
                        <p className="text-xs text-slate-400 mt-0.5">Check this if you have children to add. You can also add them later from your profile.</p>
                      </div>
                    </label>
                  )}

                  {/* Children section */}
                  {showChildrenSection && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#F97316] uppercase tracking-wider flex items-center gap-1.5">
                          <Baby className="w-3.5 h-3.5" /> Children (optional)
                        </label>
                        <button type="button" onClick={addChild} className="flex items-center gap-1 text-xs font-semibold text-[#F97316] hover:underline">
                          <Plus className="w-3 h-3" /> Add child
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">You can skip this and add children later from your profile settings.</p>
                      {children.map((child, i) => (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-500">Child {i + 1}</span>
                            <button type="button" onClick={() => removeChild(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Name</label>
                              <input value={child.childName} onChange={e => updateChild(i, 'childName', e.target.value)} placeholder="Child's name" className={cn(fieldCls, 'text-xs py-2')} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Date of Birth</label>
                              <input type="date" value={child.childDob} max={new Date().toISOString().split('T')[0]} onChange={e => updateChild(i, 'childDob', e.target.value)} className={cn(fieldCls, 'text-xs py-2')} />
                              {child.childDob && <p className="text-[10px] text-[#1E3A8A] dark:text-blue-400 mt-0.5">Age: {calcAge(child.childDob)}</p>}
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Gender</label>
                              <select value={child.childGender} onChange={e => updateChild(i, 'childGender', e.target.value)} className={cn(fieldCls, 'text-xs py-2')}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Relationship</label>
                              <select value={child.relationship} onChange={e => updateChild(i, 'relationship', e.target.value)} className={cn(fieldCls, 'text-xs py-2')}>
                                <option value="son">Son</option>
                                <option value="daughter">Daughter</option>
                                <option value="ward">Ward</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" type="button" onClick={() => setStep(1)} className="flex-1"><ChevronLeft className="w-4 h-4" /> Back</Button>
                    <Button type="submit" className="flex-1">Continue <ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </form>
              </>
            )}

            {/* ── STEP 3: Interests ─────────────────────────────────── */}
            {step === 3 && (
              <>
                <div className="mb-5">
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Your Interests</h1>
                  <p className="text-slate-500 text-sm mt-1">Select all that apply — helps us match you with the right programs</p>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {INTERESTS.map(interest => {
                    const selected = selectedInterests.includes(interest);
                    return (
                      <button key={interest} type="button"
                        onClick={() => setSelectedInterests(p => p.includes(interest) ? p.filter(x => x !== interest) : [...p, interest])}
                        className={cn('flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-semibold transition-all',
                          selected
                            ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 text-[#1E3A8A] dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300')}>
                        {selected && <Check className="w-3 h-3" />}
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-[#1E3A8A]" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      I agree to the{' '}
                      <button type="button" onClick={() => setShowConstitution(true)} className="text-[#1E3A8A] dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1">
                        VOA Constitution <BookOpen className="w-3 h-3" />
                      </button>
                    </span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ChevronLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={onStep3} className="flex-1">Continue <ChevronRight className="w-4 h-4" /></Button>
                </div>
              </>
            )}

            {/* ── STEP 4: Review ────────────────────────────────────── */}
            {step === 4 && step1Data && step2Data && (
              <>
                <div className="mb-5">
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">Review & Submit</h1>
                  <p className="text-slate-500 text-sm mt-1">Confirm your details before joining</p>
                </div>
                <div className="space-y-3 mb-5">
                  {/* Basic info */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Basic Info</p>
                      <button onClick={() => setStep(1)} className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">Edit</button>
                    </div>
                    {[['Name', step1Data.fullName], ['Email', step1Data.email], ['Phone', step1Data.phone || '—'], ['Gender', step1Data.gender]].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm py-0.5">
                        <span className="text-slate-400">{l}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* Membership */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Membership</p>
                      <button onClick={() => setStep(2)} className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">Edit</button>
                    </div>
                    {membership && [
                      ['Type', `${membership.icon} ${membership.label}`],
                      ['DOB', new Date(step2Data.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
                      ['Age', `${age} years old`],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between text-sm py-0.5">
                        <span className="text-slate-400">{l}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{v}</span>
                      </div>
                    ))}
                    {showChildrenSection && children.filter(c => c.childName).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-400 mb-1">Children:</p>
                        {children.filter(c => c.childName).map((c, i) => (
                          <p key={i} className="text-xs text-slate-600 dark:text-slate-400">
                            • {c.childName} ({c.relationship}){c.childDob ? ` — age ${calcAge(c.childDob)}` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Interests */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interests</p>
                      <button onClick={() => setStep(3)} className="text-xs text-[#1E3A8A] dark:text-blue-400 font-semibold hover:underline">Edit</button>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedInterests.length > 0 ? selectedInterests.join(', ') : 'None selected'}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1"><ChevronLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={onSubmit} loading={submitting} className="flex-1">Join VOA 🎉</Button>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already a member? <Link href="/login" className="text-[#F97316] font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {showConstitution && <ConstitutionModal onClose={() => setShowConstitution(false)} />}

      {/* Pending approval screen */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#1E3A8A] to-[#F97316] w-full" />
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#1E3A8A]/10 dark:bg-[#1E3A8A]/30 flex items-center justify-center mx-auto mb-5">
                <span className="text-4xl">⏳</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Welcome, {registeredName}!</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                Your account is <strong className="text-[#F97316]">pending approval</strong>.
              </p>
              <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-left space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">What happens next?</p>
                {[
                  { icon: '👥', text: 'Membership Coordinator reviews your registration' },
                  { icon: '👑', text: 'Chairman or Super Admin assigns your role' },
                  { icon: '🔔', text: 'You receive a notification when approved' },
                  { icon: '✅', text: 'Then you can log in' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-2">
                    <span className="text-sm shrink-0">{icon}</span>
                    <p className="text-xs text-amber-600 dark:text-amber-500">{text}</p>
                  </div>
                ))}
              </div>
              <Link href="/login" className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#1E3A8A] to-[#1e4db7] text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 shadow-lg">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
