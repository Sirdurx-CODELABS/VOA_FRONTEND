'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { contributionService, accountService } from '@/services/api.service';
import { MonthlyContribution, Installment, TreasuryAccount } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, membershipTypeLabel, cn } from '@/lib/utils';
import {
  Upload, Copy, MessageCircle, CheckCircle, Info, Heart,
  Clock, ChevronDown, ChevronUp, Baby, AlertCircle, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Constants ───────────────────────────────────────────────────────────── */
const MAX_PAYMENT = 100_000;
const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

type PaymentMode = 'required' | 'custom' | 'installment';

interface RequiredInfo {
  requiredAmount: number;
  calculationSource: string;
  breakdown?: { childId?: string; childName?: string; category: string; amount: number; childAge?: number; childGender?: string }[];
  note?: string;
  treasurerPhone?: string | null;
  treasurerName?: string | null;
  minimumPayment: number;
}

/* ── Shared input style ──────────────────────────────────────────────────── */
const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all';
const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

export function ContributionPanel() {
  const { user: me } = useAuthStore();
  const [month, setMonth] = useState(currentMonth());
  const [record, setRecord] = useState<MonthlyContribution | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [requiredInfo, setRequiredInfo] = useState<RequiredInfo | null>(null);
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [payModal, setPayModal] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  /* ── Modal state ─────────────────────────────────────────────────────── */
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('required');
  const [customAmount, setCustomAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [referenceNote, setReferenceNote] = useState('');
  const [accountId, setAccountId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isParent = me?.membershipType === 'parent_guardian';

  const load = useCallback(async () => {
    try {
      const [statusRes, reqRes, accRes] = await Promise.all([
        contributionService.getMonthlyStatus(month),
        contributionService.getRequiredAmount(),
        accountService.getAll(),
      ]);
      setRecord(statusRes.data.data.record);
      setInstallments(statusRes.data.data.installments);
      setRequiredInfo(reqRes.data.data);
      const active = (accRes.data.data as TreasuryAccount[]).filter((a: TreasuryAccount) => a.isActive);
      setAccounts(active);
      if (active.length > 0 && !accountId) setAccountId(active[0]._id);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => { load(); }, [load]);

  /* ── Derived values ──────────────────────────────────────────────────── */
  const required = requiredInfo?.requiredAmount ?? 0;
  const alreadyPaid = record?.amountPaid ?? 0;
  const remaining = Math.max(0, required - alreadyPaid);
  const isComplete = record?.isCompleted ?? false;
  const pct = record?.progressPercent ?? 0;

  // The amount that will actually be submitted
  const effectiveAmount: number = (() => {
    if (paymentMode === 'required') return remaining > 0 ? remaining : required;
    return parseFloat(customAmount) || 0;
  })();

  const extraAboveRequired = Math.max(0, (alreadyPaid + effectiveAmount) - required);
  const estimatedPoints = effectiveAmount > 0 ? 10 + Math.floor(Math.max(0, effectiveAmount - required) / 500) : 0;

  /* ── Validation ──────────────────────────────────────────────────────── */
  const validateAmount = (val: string): boolean => {
    const n = parseFloat(val);
    if (!val || isNaN(n) || n <= 0) {
      setAmountError('Please enter a valid amount');
      return false;
    }
    if (n > MAX_PAYMENT) {
      setAmountError(`Maximum payment is ${formatCurrency(MAX_PAYMENT)}`);
      return false;
    }
    setAmountError('');
    return true;
  };

  const isSubmitDisabled = (): boolean => {
    if (paymentMode === 'required') return false; // always valid — uses remaining
    const n = parseFloat(customAmount);
    return !customAmount || isNaN(n) || n <= 0 || n > MAX_PAYMENT;
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (paymentMode !== 'required' && !validateAmount(customAmount)) return;

    const amt = effectiveAmount;
    if (!amt || amt <= 0) return toast.error('Please enter a valid amount');
    if (amt > MAX_PAYMENT) return toast.error(`Maximum payment is ${formatCurrency(MAX_PAYMENT)}`);

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('month', month);
      fd.append('amount', String(amt));
      fd.append('paymentMode', paymentMode);
      fd.append('paymentMethod', paymentMethod);
      if (referenceNote) fd.append('referenceNote', referenceNote);
      if (accountId) fd.append('accountId', accountId);
      if (proofFile) fd.append('proofImage', proofFile);

      await contributionService.submitInstallment(fd);

      const modeMsg = paymentMode === 'installment'
        ? `Installment of ${formatCurrency(amt)} submitted!`
        : paymentMode === 'custom' && amt > required
        ? `Custom payment of ${formatCurrency(amt)} submitted — ${formatCurrency(amt - remaining)} extra!`
        : `Payment of ${formatCurrency(amt)} submitted!`;

      toast.success(`${modeMsg} Awaiting treasurer approval.`);
      closeModal();
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const closeModal = () => {
    setPayModal(false);
    setPaymentMode('required');
    setCustomAmount('');
    setAmountError('');
    setReferenceNote('');
    setProofFile(null);
  };

  /* ── WhatsApp ────────────────────────────────────────────────────────── */
  const openWhatsApp = (acc?: TreasuryAccount) => {
    const selectedAcc = acc || accounts.find(a => a._id === accountId) || accounts[0];
    const bankInfo = selectedAcc
      ? `\nBank: ${selectedAcc.bankName}\nAccount: ${selectedAcc.accountNumber} (${selectedAcc.accountHolderName})`
      : '';
    const modeLabel = paymentMode === 'installment' ? 'Installment' : paymentMode === 'custom' ? 'Custom' : 'Full';
    const msg = encodeURIComponent(
      `Hello${requiredInfo?.treasurerName ? ` ${requiredInfo.treasurerName}` : ' Treasurer'}, I have made my VOA monthly contribution.\n\n` +
      `👤 Name: ${me?.fullName}\n` +
      `💰 Amount: ${formatCurrency(effectiveAmount)}\n` +
      `📋 Mode: ${modeLabel} Payment\n` +
      `📅 Month: ${fmtMonth(month)}\n` +
      `💳 Method: ${paymentMethod.replace(/_/g, ' ')}` +
      bankInfo +
      (referenceNote ? `\n📝 Ref: ${referenceNote}` : '') +
      `\n\nKindly confirm receipt. Thank you! 🙏`
    );
    const phone = requiredInfo?.treasurerPhone
      ? requiredInfo.treasurerPhone.replace(/\D/g, '').replace(/^0/, '234')
      : '';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  /* ── CTA label ───────────────────────────────────────────────────────── */
  const ctaLabel = paymentMode === 'required'
    ? 'Submit Full Payment'
    : paymentMode === 'installment'
    ? 'Submit Installment'
    : 'Submit Custom Payment';

  return (
    <div className="space-y-5">
      {/* Month selector + pay button */}
      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className={labelCls}>Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
        </div>
        {!isComplete && required > 0 && (
          <button onClick={() => setPayModal(true)}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Upload className="w-4 h-4" /> Make Payment
          </button>
        )}
      </div>

      {/* Contribution status card */}
      {requiredInfo && (
        <div className={cn('rounded-2xl border overflow-hidden',
          isComplete ? 'border-[#22C55E]/40 bg-green-50 dark:bg-green-900/10' : 'border-[#1E3A8A]/20 bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/10')}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isComplete
                    ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22C55E] bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Complete</span>
                    : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> In Progress</span>
                  }
                  {(record?.extraAmount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-1 rounded-full">
                      <Heart className="w-3 h-3" /> Extra
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 capitalize">
                  {membershipTypeLabel(me?.membershipType)} · {fmtMonth(month)}
                </p>
                {requiredInfo.note && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />{requiredInfo.note}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(required)}</p>
                <p className="text-xs text-slate-400 mt-0.5">required / month</p>
              </div>
            </div>

            {required > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Paid: <strong className="text-[#22C55E]">{formatCurrency(alreadyPaid)}</strong></span>
                  <span className="font-bold text-slate-600 dark:text-slate-400">{pct}%</span>
                  {!isComplete && <span className="text-[#F97316] font-semibold">Remaining: {formatCurrency(remaining)}</span>}
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-700',
                    isComplete ? 'bg-[#22C55E]' : pct >= 75 ? 'bg-[#F97316]' : 'bg-[#1E3A8A]')}
                    style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                {(record?.extraAmount ?? 0) > 0 && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1.5 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Extra contribution: +{formatCurrency(record!.extraAmount)} — thank you!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Parent breakdown */}
          {isParent && requiredInfo.breakdown && requiredInfo.breakdown.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowBreakdown(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <span className="flex items-center gap-1.5"><Baby className="w-3.5 h-3.5 text-[#F97316]" /> Children Breakdown ({requiredInfo.breakdown.length})</span>
                {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showBreakdown && (
                <div className="px-5 pb-4 space-y-2">
                  <p className="text-xs text-slate-400 mb-3">Your contribution is based on your children only — no personal adult contribution applies.</p>
                  {requiredInfo.breakdown.map((b, i) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{b.childName || `Child ${i + 1}`}</p>
                        <p className="text-xs text-slate-400 capitalize">
                          {b.childAge !== undefined ? `Age ${b.childAge}` : ''}
                          {b.childGender ? ` · ${b.childGender}` : ''}
                          {' · '}{b.category?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <span className="font-bold text-[#1E3A8A] dark:text-blue-400">{formatCurrency(b.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 rounded-xl border border-[#1E3A8A]/20">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Required</span>
                    <span className="text-base font-extrabold text-[#1E3A8A] dark:text-blue-400">{formatCurrency(required)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment accounts */}
      {accounts.length > 0 && (
        <div>
          <p className={cn(labelCls, 'mb-2')}>Payment Accounts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map(acc => (
              <div key={acc._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <p className="font-bold text-slate-800 dark:text-white text-sm">{acc.bankName}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono font-bold text-[#1E3A8A] dark:text-blue-400">{acc.accountNumber}</span>
                  <button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); toast.success('Copied!'); }}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{acc.accountHolderName}</p>
                <button onClick={() => openWhatsApp(acc)}
                  className="mt-2.5 flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {requiredInfo?.treasurerPhone ? 'Notify Treasurer' : 'WhatsApp'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      {installments.length > 0 && (
        <div>
          <p className={cn(labelCls, 'mb-2')}>Payment History — {fmtMonth(month)}</p>
          <div className="space-y-2">
            {installments.map(inst => (
              <div key={inst._id} className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{formatCurrency(inst.amount)}</p>
                    {inst.paymentMode && inst.paymentMode !== 'required' && (
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                        inst.paymentMode === 'installment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400')}>
                        {inst.paymentMode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{inst.paymentMethod?.replace(/_/g, ' ')} · {formatDate(inst.createdAt)}</p>
                  {inst.isExtraPayment && <p className="text-xs text-purple-600 font-semibold flex items-center gap-1 mt-0.5"><Heart className="w-3 h-3" /> Extra payment</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {inst.receiptNumber && <span className="text-[10px] font-mono text-slate-400">{inst.receiptNumber}</span>}
                  <span className={cn('text-xs font-bold px-2.5 py-0.5 rounded-full',
                    inst.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    inst.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400')}>
                    {inst.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      <Modal open={payModal} onClose={closeModal}
        title="Make Contribution Payment"
        subtitle={`${fmtMonth(month)} · Due: ${formatCurrency(required)} · Remaining: ${formatCurrency(remaining)}`}
        size="lg">
        <div className="space-y-5">

          {/* Account info */}
          {accounts.length > 0 && (
            <div className="bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 rounded-2xl p-4 border border-[#1E3A8A]/20">
              <p className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 mb-3">Transfer to this account first, then submit below</p>
              {accounts.slice(0, 1).map(acc => (
                <div key={acc._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-white">{acc.bankName}</p>
                      <p className="text-xs text-slate-500">{acc.accountHolderName}</p>
                    </div>
                    <button onClick={() => openWhatsApp(acc)}
                      className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {requiredInfo?.treasurerPhone ? 'Notify Treasurer' : 'WhatsApp'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
                    <span className="font-mono font-extrabold text-xl text-[#1E3A8A] dark:text-blue-400 flex-1">{acc.accountNumber}</span>
                    <button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); toast.success('Copied!'); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Payment Mode Selector ─────────────────────────────────────── */}
          <div>
            <label className={labelCls}>Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                {
                  mode: 'required' as PaymentMode,
                  icon: CheckCircle,
                  label: 'Pay Required',
                  sub: formatCurrency(remaining > 0 ? remaining : required),
                  desc: 'Full remaining balance',
                  active: 'border-[#22C55E] bg-green-50 dark:bg-green-900/20',
                  iconColor: 'text-[#22C55E]',
                  labelColor: 'text-[#22C55E]',
                },
                {
                  mode: 'custom' as PaymentMode,
                  icon: Heart,
                  label: 'Custom Amount',
                  sub: 'Any amount',
                  desc: 'Pay above or below',
                  active: 'border-[#F97316] bg-orange-50 dark:bg-orange-900/20',
                  iconColor: 'text-[#F97316]',
                  labelColor: 'text-[#F97316]',
                },
                {
                  mode: 'installment' as PaymentMode,
                  icon: Layers,
                  label: 'Installment',
                  sub: 'Partial payment',
                  desc: 'Counts toward balance',
                  active: 'border-[#1E3A8A] bg-blue-50 dark:bg-blue-900/20',
                  iconColor: 'text-[#1E3A8A] dark:text-blue-400',
                  labelColor: 'text-[#1E3A8A] dark:text-blue-400',
                },
              ] as const).map(({ mode, icon: Icon, label, sub, desc, active, iconColor, labelColor }) => (
                <button key={mode} type="button" onClick={() => { setPaymentMode(mode); setCustomAmount(''); setAmountError(''); }}
                  className={cn('flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all text-center',
                    paymentMode === mode ? active : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600')}>
                  <Icon className={cn('w-5 h-5', paymentMode === mode ? iconColor : 'text-slate-300 dark:text-slate-600')} />
                  <span className={cn('text-xs font-extrabold leading-tight', paymentMode === mode ? labelColor : 'text-slate-500 dark:text-slate-400')}>{label}</span>
                  <span className={cn('text-sm font-extrabold', paymentMode === mode ? labelColor : 'text-slate-400')}>{sub}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Amount display / input ────────────────────────────────────── */}
          {paymentMode === 'required' ? (
            /* Required mode: locked display */
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">Amount to Pay</p>
                  <p className="text-xs text-slate-500 mt-0.5">Remaining balance for {fmtMonth(month)}</p>
                </div>
                <p className="text-2xl font-extrabold text-[#22C55E]">{formatCurrency(remaining > 0 ? remaining : required)}</p>
              </div>
              {alreadyPaid > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 flex justify-between text-xs text-slate-500">
                  <span>Already paid this month</span>
                  <span className="font-bold text-[#22C55E]">{formatCurrency(alreadyPaid)}</span>
                </div>
              )}
            </div>
          ) : (
            /* Custom / Installment: editable input */
            <div>
              <label className={labelCls}>
                {paymentMode === 'installment' ? 'Installment Amount' : 'Custom Amount'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); if (e.target.value) validateAmount(e.target.value); else setAmountError(''); }}
                  placeholder={paymentMode === 'installment' ? `Any amount up to ${formatCurrency(MAX_PAYMENT)}` : `Any amount up to ${formatCurrency(MAX_PAYMENT)}`}
                  min={1}
                  max={MAX_PAYMENT}
                  className={cn('w-full rounded-xl border pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 transition-all',
                    amountError ? 'border-red-400 focus:ring-red-400/30' :
                    paymentMode === 'installment' ? 'border-[#1E3A8A]/40 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A]' :
                    'border-[#F97316]/40 focus:ring-[#F97316]/30 focus:border-[#F97316]')}
                />
              </div>
              {amountError && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{amountError}
                </div>
              )}
              {paymentMode === 'installment' && (
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  This installment will count toward your {formatCurrency(required)} monthly balance. Remaining after this: {formatCurrency(Math.max(0, remaining - (parseFloat(customAmount) || 0)))}
                </p>
              )}
              {paymentMode === 'custom' && customAmount && !amountError && (
                <p className="text-xs text-slate-400 mt-1.5">
                  {parseFloat(customAmount) > remaining && remaining > 0
                    ? `${formatCurrency(parseFloat(customAmount) - remaining)} will be recorded as extra contribution`
                    : parseFloat(customAmount) < remaining
                    ? `${formatCurrency(remaining - parseFloat(customAmount))} will remain unpaid this month`
                    : 'Covers the full remaining balance'}
                </p>
              )}
            </div>
          )}

          {/* ── Live payment preview ──────────────────────────────────────── */}
          {effectiveAmount > 0 && !amountError && (
            <div className={cn('rounded-2xl p-4 border',
              extraAboveRequired > 0 ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' :
              paymentMode === 'installment' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
              'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('text-sm font-bold',
                    extraAboveRequired > 0 ? 'text-purple-600' :
                    paymentMode === 'installment' ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-[#22C55E]')}>
                    {extraAboveRequired > 0
                      ? `❤️ Includes +${formatCurrency(extraAboveRequired)} extra`
                      : paymentMode === 'installment'
                      ? `📦 Installment toward ${formatCurrency(required)}`
                      : '✅ Payment confirmed'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Estimated: <strong>+{estimatedPoints} points</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(effectiveAmount)}</p>
                  <p className="text-xs text-slate-400">{fmtMonth(month)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Payment method ────────────────────────────────────────────── */}
          <div>
            <label className={labelCls}>Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputCls}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          {accounts.length > 1 && (
            <div>
              <label className={labelCls}>Account Paid To</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputCls}>
                {accounts.map(a => <option key={a._id} value={a._id}>{a.bankName} — {a.accountNumber}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Reference / Note (optional)</label>
            <input value={referenceNote} onChange={e => setReferenceNote(e.target.value)}
              placeholder="Transaction reference or note..."
              className={inputCls} />
          </div>

          {/* ── Proof of payment ──────────────────────────────────────────── */}
          <div>
            <label className={labelCls}>
              Proof of Payment <span className="font-normal text-slate-400 normal-case">(optional)</span>
            </label>
            <input type="file" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1E3A8A] file:text-white hover:file:bg-[#1e3480] cursor-pointer" />
            {proofFile
              ? <p className="text-xs text-[#22C55E] mt-1.5 font-medium">✓ {proofFile.name}</p>
              : (
                <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    No proof? Use the WhatsApp button above to notify the Treasurer directly.
                  </p>
                </div>
              )
            }
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={isSubmitDisabled()}
              className={cn(
                paymentMode === 'installment' ? 'bg-[#1E3A8A] hover:bg-[#1e3480]' :
                paymentMode === 'custom' ? 'bg-[#F97316] hover:bg-[#EA6C0A]' :
                'bg-[#22C55E] hover:bg-[#16a34a]'
              )}>
              {ctaLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
