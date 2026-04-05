'use client';
import { useState } from 'react';
import { TreasuryAccount } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { contributionService } from '@/services/api.service';
import { Copy, MessageCircle, AlertCircle, Heart, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Local helper — not imported from page.tsx
function fmtMonth(m: string) {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  minimum: number;
  gender: string;
  accounts: TreasuryAccount[];
  userName: string;
}

export function SubmitContributionModal({ open, onClose, onSuccess, minimum, gender, accounts, userName }: Props) {
  const [amount, setAmount] = useState('');
  const [useMinimum, setUseMinimum] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [referenceNote, setReferenceNote] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?._id || '');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState('');

  const effectiveAmount = useMinimum ? minimum : parseFloat(amount) || 0;
  const extra = Math.max(0, effectiveAmount - minimum);
  const isAbove = effectiveAmount > minimum;
  const points = 10 + Math.floor(extra / 500);

  const validateAmount = (val: string) => {
    const n = parseFloat(val);
    if (!val || isNaN(n)) { setAmountError('Amount is required'); return false; }
    if (n < minimum) { setAmountError(`Amount must not be less than ₦${minimum.toLocaleString()}`); return false; }
    setAmountError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!useMinimum && !validateAmount(amount)) return;
    if (!proofFile) return toast.error('Please upload proof of payment');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('month', month);
      fd.append('amount', String(effectiveAmount));
      fd.append('paymentMethod', paymentMethod);
      if (referenceNote) fd.append('referenceNote', referenceNote);
      if (accountId) fd.append('accountId', accountId);
      fd.append('proofImage', proofFile);
      await contributionService.submit(fd);
      toast.success(isAbove
        ? `Thank you for your extra ₦${extra.toLocaleString()} support ❤️`
        : 'Thank you for fulfilling your contribution!');
      onSuccess();
      onClose();
      setAmount(''); setProofFile(null); setReferenceNote(''); setUseMinimum(true);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const openWhatsApp = (acc: TreasuryAccount) => {
    const msg = encodeURIComponent(
      `Hello Treasurer, I have made my VOA contribution.\n\nName: ${userName}\nAmount: ₦${effectiveAmount.toLocaleString()}\nMonth: ${fmtMonth(month)}\nBank: ${acc.bankName}\nAccount: ${acc.accountNumber}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const activeAccounts = accounts.filter(a => a.isActive);

  return (
    <Modal open={open} onClose={onClose} title="Submit Monthly Contribution" size="lg">
      <div className="space-y-5">
        {/* Account info — shown first to build trust */}
        {activeAccounts.length > 0 && (
          <div className="bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 rounded-2xl p-4 border border-[#1E3A8A]/20">
            <p className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wider mb-3">
              📌 Pay to this account first, then upload proof below
            </p>
            {activeAccounts.slice(0, 1).map(acc => (
              <div key={acc._id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-white">{acc.bankName}</p>
                    <p className="text-xs text-slate-500">{acc.accountHolderName}</p>
                  </div>
                  <button onClick={() => openWhatsApp(acc)}
                    className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
                  <span className="font-mono font-extrabold text-xl text-[#1E3A8A] dark:text-blue-400 flex-1">{acc.accountNumber}</span>
                  <button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); toast.success('Account number copied!'); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Month */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contribution Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
        </div>

        {/* Amount selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contribution Amount</label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Minimum button */}
            <button type="button" onClick={() => { setUseMinimum(true); setAmount(''); setAmountError(''); }}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${useMinimum ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <CheckCircle className={`w-5 h-5 ${useMinimum ? 'text-[#1E3A8A]' : 'text-slate-300'}`} />
              <span className={`text-sm font-extrabold ${useMinimum ? 'text-[#1E3A8A] dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                Pay Minimum
              </span>
              <span className={`text-lg font-extrabold ${useMinimum ? 'text-[#22C55E]' : 'text-slate-500'}`}>
                ₦{minimum.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">{gender} rate</span>
            </button>

            {/* Custom amount button */}
            <button type="button" onClick={() => { setUseMinimum(false); }}
              className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${!useMinimum ? 'border-[#F97316] bg-[#F97316]/5 dark:bg-[#F97316]/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <Heart className={`w-5 h-5 ${!useMinimum ? 'text-[#F97316]' : 'text-slate-300'}`} />
              <span className={`text-sm font-extrabold ${!useMinimum ? 'text-[#F97316]' : 'text-slate-600 dark:text-slate-400'}`}>
                Give More
              </span>
              <span className="text-xs text-slate-400 text-center">Support VOA extra</span>
            </button>
          </div>

          {/* Custom amount input */}
          {!useMinimum && (
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); if (e.target.value) validateAmount(e.target.value); }}
                  placeholder={`Enter amount above ₦${minimum.toLocaleString()}`}
                  className={`w-full rounded-xl border pl-8 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 ${amountError ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'}`}
                />
              </div>
              {amountError && (
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {amountError}
                </div>
              )}
              <p className="text-xs text-slate-400">You can support more by contributing above ₦{minimum.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Live preview */}
        {effectiveAmount >= minimum && (
          <div className={`rounded-2xl p-4 border ${isAbove ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${isAbove ? 'text-[#F97316]' : 'text-[#22C55E]'}`}>
                  {isAbove ? `❤️ Extra support: +₦${extra.toLocaleString()}` : '✅ Minimum contribution'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">You will earn <strong>+{points} points</strong></p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-slate-800 dark:text-white">₦{effectiveAmount.toLocaleString()}</p>
                <p className="text-xs text-slate-400">{fmtMonth(month)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment method */}
        <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
          options={[{ value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cash', label: 'Cash' }, { value: 'other', label: 'Other' }]} />

        {/* Account selection */}
        {activeAccounts.length > 1 && (
          <Select label="Account Paid To" value={accountId} onChange={e => setAccountId(e.target.value)}
            options={[{ value: '', label: 'Select account...' }, ...activeAccounts.map(a => ({ value: a._id, label: `${a.bankName} — ${a.accountNumber}` }))]} />
        )}

        <Input label="Reference / Note (optional)" placeholder="Transaction reference or note" value={referenceNote} onChange={e => setReferenceNote(e.target.value)} />

        {/* Proof upload */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Proof of Payment *</label>
          <input type="file" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1E3A8A] file:text-white hover:file:bg-[#1e3480] cursor-pointer" />
          {proofFile && <p className="text-xs text-[#22C55E] mt-1.5 font-medium">✓ {proofFile.name}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={submitting}>Submit Contribution</Button>
        </div>
      </div>
    </Modal>
  );
}
