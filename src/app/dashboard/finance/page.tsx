'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { contributionService, accountService, financeTargetService } from '@/services/api.service';
import { MonthlyContribution, Installment, TreasuryAccount, FinanceTarget } from '@/types';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate, membershipTypeLabel, calcAge, cn } from '@/lib/utils';
import {
  CheckCircle, XCircle, Plus, Baby, Heart, Clock, TrendingUp,
  Users, Wallet, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ContributionPanel } from './_ContributionPanel';

type Tab = 'my_contribution' | 'all_records' | 'installments' | 'accounts' | 'targets';
const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

export default function FinancePage() {
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState<Tab>('my_contribution');
  const [allRecords, setAllRecords] = useState<MonthlyContribution[]>([]);
  const [allInstallments, setAllInstallments] = useState<Installment[]>([]);
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [targets, setTargets] = useState<FinanceTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [statusFilter, setStatusFilter] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<Installment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [accountModal, setAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState<TreasuryAccount | null>(null);
  const [accForm, setAccForm] = useState({ accountName: '', bankName: '', accountNumber: '', accountHolderName: '' });
  const [submitting, setSubmitting] = useState(false);

  const isTreasurer = hasPermission(me, PERMISSIONS.MANAGE_CONTRIBUTIONS);
  const canManageAccounts = hasPermission(me, PERMISSIONS.MANAGE_ACCOUNTS);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'all_records') {
        const res = await contributionService.getAllMonthlyRecords({
          page, limit: 15, month: monthFilter || undefined,
          membershipType: membershipFilter || undefined,
        });
        setAllRecords(res.data.data);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } else if (tab === 'installments') {
        const res = await contributionService.getAllInstallments({
          page, limit: 15,
          month: monthFilter || undefined,
          status: statusFilter || undefined,
          membershipType: membershipFilter || undefined,
        });
        setAllInstallments(res.data.data);
        setTotalPages(res.data.pagination?.totalPages ?? 1);
      } else if (tab === 'accounts') {
        const res = await accountService.getAll();
        setAccounts(res.data.data);
      } else if (tab === 'targets') {
        const res = await financeTargetService.getAll({ isCompleted: false });
        setTargets(res.data.data);
      }
    } finally { setLoading(false); }
  }, [tab, page, monthFilter, statusFilter, membershipFilter]);

  useEffect(() => { loadTab(); }, [loadTab]);

  const handleApprove = async (id: string) => {
    try {
      await contributionService.approveInstallment(id);
      toast.success('Payment approved!');
      loadTab();
    } catch { toast.error('Failed'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await contributionService.rejectInstallment(rejectModal._id, rejectReason);
      toast.success('Rejected');
      setRejectModal(null);
      setRejectReason('');
      loadTab();
    } catch { toast.error('Failed'); }
  };

  const handleSaveAccount = async () => {
    setSubmitting(true);
    try {
      if (editAccount) { await accountService.update(editAccount._id, accForm); toast.success('Updated'); }
      else { await accountService.create(accForm); toast.success('Account added'); }
      setAccountModal(false);
      setEditAccount(null);
      setAccForm({ accountName: '', bankName: '', accountNumber: '', accountHolderName: '' });
      loadTab();
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  const tabs = [
    { id: 'my_contribution', label: 'My Contribution' },
    ...(isTreasurer ? [
      { id: 'all_records', label: 'Monthly Records' },
      { id: 'installments', label: 'Payments' },
    ] : []),
    ...(canManageAccounts ? [{ id: 'accounts', label: 'Accounts' }] : []),
    { id: 'targets', label: 'Targets' },
  ] as { id: Tab; label: string }[];

  const filterBar = (
    <div className="flex gap-2 flex-wrap items-end">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Month</label>
        <input type="month" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Membership</label>
        <select value={membershipFilter} onChange={e => { setMembershipFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
          <option value="">All Types</option>
          <option value="adolescent">Adolescent</option>
          <option value="adult">Adult</option>
          <option value="parent_guardian">Parent/Guardian</option>
        </select>
      </div>
      {tab === 'installments' && (
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}
    </div>
  );

  const pagination = totalPages > 1 && (
    <div className="flex justify-between items-center px-4 py-3 border-t border-slate-100 dark:border-slate-800">
      <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex gap-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Prev</button>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="page-title text-slate-800 dark:text-white">Finance & Contributions</h1>
        <p className="text-sm text-slate-500 mt-1">Transparent financial management for VOA</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1.5">
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => { setTab(id); setPage(1); }}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center',
              tab === id ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {label}
          </button>
        ))}
      </div>

      {/* My Contribution */}
      {tab === 'my_contribution' && <ContributionPanel />}

      {/* Monthly Records (Treasurer) */}
      {tab === 'all_records' && isTreasurer && (
        <div className="space-y-4">
          {filterBar}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-4">
                  <div className="skeleton h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-4 w-40" /><div className="skeleton h-3 w-24" /></div>
                </div>
              )) : allRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No records found</div>
              ) : allRecords.map(r => {
                const isExpanded = expandedRecord === r._id;
                const isParent = r.userId?.membershipType === 'parent_guardian';
                return (
                  <div key={r._id}>
                    <div className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Member info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A] font-bold text-sm shrink-0">
                            {r.userId?.fullName?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{r.userId?.fullName}</p>
                            <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
                              {isParent && <Baby className="w-3 h-3 text-[#F97316]" />}
                              {membershipTypeLabel(r.userId?.membershipType)}
                              {r.userId?.gender ? ` · ${r.userId.gender}` : ''}
                              {r.userId?.dob ? ` · age ${calcAge(r.userId.dob)}` : ''}
                            </p>
                          </div>
                        </div>
                        {/* Amounts */}
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Required</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(r.requiredAmount)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Paid</p>
                            <p className="font-bold text-[#22C55E]">{formatCurrency(r.amountPaid)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining</p>
                            <p className={cn('font-bold', r.isCompleted ? 'text-[#22C55E]' : 'text-[#F97316]')}>
                              {r.isCompleted ? '✅ Done' : formatCurrency(r.remainingAmount)}
                            </p>
                          </div>
                          {(r.extraAmount ?? 0) > 0 && (
                            <div className="text-center">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Extra</p>
                              <p className="font-bold text-purple-600 flex items-center gap-0.5"><Heart className="w-3 h-3" />{formatCurrency(r.extraAmount)}</p>
                            </div>
                          )}
                        </div>
                        {/* Progress */}
                        <div className="w-24 shrink-0">
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', r.isCompleted ? 'bg-[#22C55E]' : 'bg-[#1E3A8A]')}
                              style={{ width: `${Math.min(100, r.progressPercent)}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 text-right">{r.progressPercent}%</p>
                        </div>
                        {/* Expand for parent breakdown */}
                        {isParent && r.breakdown && r.breakdown.length > 0 && (
                          <button onClick={() => setExpandedRecord(isExpanded ? null : r._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Parent breakdown expanded */}
                    {isExpanded && isParent && r.breakdown && (
                      <div className="px-5 pb-4 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-2 flex items-center gap-1">
                          <Baby className="w-3 h-3 text-[#F97316]" /> Children Breakdown
                        </p>
                        <div className="space-y-1.5">
                          {r.breakdown.map((b: { childName?: string; childAge?: number; childGender?: string; category: string; amount: number }, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-600 dark:text-slate-400">
                                {b.childName || `Child ${i + 1}`}
                                {b.childAge !== undefined ? ` (age ${b.childAge})` : ''}
                                {b.childGender ? ` · ${b.childGender}` : ''}
                                {' — '}<span className="capitalize">{b.category?.replace(/_/g, ' ')}</span>
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(b.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {pagination}
          </div>
        </div>
      )}

      {/* Installments / Payments (Treasurer) */}
      {tab === 'installments' && isTreasurer && (
        <div className="space-y-4">
          {filterBar}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-4">
                  <div className="skeleton h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-4 w-40" /><div className="skeleton h-3 w-24" /></div>
                </div>
              )) : allInstallments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">No payments found</div>
              ) : allInstallments.map(inst => (
                <div key={inst._id} className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#F97316]/10 flex items-center justify-center text-[#F97316] font-bold text-sm shrink-0">
                        {(inst.userId as { fullName?: string })?.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{(inst.userId as { fullName?: string })?.fullName}</p>
                        <p className="text-xs text-slate-400 capitalize">
                          {membershipTypeLabel((inst.userId as { membershipType?: string })?.membershipType)}
                          {' · '}{inst.paymentMethod?.replace(/_/g, ' ')}
                          {' · '}{formatDate(inst.createdAt)}
                        </p>
                        {inst.referenceNote && <p className="text-xs text-slate-400 mt-0.5">Ref: {inst.referenceNote}</p>}
                        {inst.isExtraPayment && <p className="text-xs text-purple-600 font-semibold flex items-center gap-1 mt-0.5"><Heart className="w-3 h-3" /> Extra payment</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-right">
                        <p className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(inst.amount)}</p>
                        <p className="text-xs text-slate-400">{fmtMonth(inst.month)}</p>
                      </div>
                      {inst.proofImage && (
                        <a href={inst.proofImage} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#1E3A8A] dark:text-blue-400 hover:underline font-semibold">View Proof</a>
                      )}
                      {inst.receiptNumber && <span className="text-[10px] font-mono text-slate-400">{inst.receiptNumber}</span>}
                      <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full',
                        inst.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        inst.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400')}>
                        {inst.status}
                      </span>
                      {inst.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleApprove(inst._id)}
                            className="flex items-center gap-1 bg-[#22C55E] hover:bg-[#16a34a] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => { setRejectModal(inst); setRejectReason(''); }}
                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pagination}
          </div>
        </div>
      )}

      {/* Accounts */}
      {tab === 'accounts' && canManageAccounts && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => { setAccountModal(true); setEditAccount(null); setAccForm({ accountName: '', bankName: '', accountNumber: '', accountHolderName: '' }); }}
              className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Add Account
            </button>
          </div>
          {accounts.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 text-sm">No accounts added yet</div>
          )}
          {accounts.map(acc => (
            <div key={acc._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{acc.accountName}</p>
                <p className="text-xs text-slate-400">{acc.bankName} · {acc.accountNumber} · {acc.accountHolderName}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full',
                  acc.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}>
                  {acc.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => { setEditAccount(acc); setAccForm({ accountName: acc.accountName, bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolderName: acc.accountHolderName }); setAccountModal(true); }}
                  className="text-xs text-[#1E3A8A] dark:text-blue-400 hover:underline font-semibold">Edit</button>
                <button onClick={async () => { await accountService.update(acc._id, { isActive: !acc.isActive }); loadTab(); }}
                  className="text-xs text-slate-500 hover:underline font-semibold">{acc.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Targets */}
      {tab === 'targets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {targets.map(t => (
            <div key={t._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <p className="font-bold text-slate-800 dark:text-white">{t.title}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{t.category}</p>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Target</span><span className="font-bold">{formatCurrency(t.targetAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Raised</span><span className="font-bold text-[#22C55E]">{formatCurrency(t.amountRaised)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Remaining</span><span className="font-bold text-[#F97316]">{formatCurrency(t.amountRemaining)}</span></div>
              </div>
              <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(100, t.progressPercent)}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{t.progressPercent}% funded</p>
            </div>
          ))}
          {targets.length === 0 && !loading && <p className="text-slate-400 text-sm col-span-3 text-center py-8">No active targets</p>}
        </div>
      )}

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Payment" size="sm">
        <div className="space-y-4">
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 resize-none" />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject</Button>
          </div>
        </div>
      </Modal>

      {/* Account Modal */}
      <Modal open={accountModal} onClose={() => { setAccountModal(false); setEditAccount(null); }} title={editAccount ? 'Edit Account' : 'Add Account'}>
        <div className="space-y-4">
          <Input label="Account Name" value={accForm.accountName} onChange={e => setAccForm(f => ({ ...f, accountName: e.target.value }))} placeholder="Main VOA Account" />
          <Input label="Bank Name" value={accForm.bankName} onChange={e => setAccForm(f => ({ ...f, bankName: e.target.value }))} placeholder="First Bank" />
          <Input label="Account Number" value={accForm.accountNumber} onChange={e => setAccForm(f => ({ ...f, accountNumber: e.target.value }))} placeholder="0123456789" />
          <Input label="Account Holder" value={accForm.accountHolderName} onChange={e => setAccForm(f => ({ ...f, accountHolderName: e.target.value }))} placeholder="VOA Organization" />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setAccountModal(false); setEditAccount(null); }}>Cancel</Button>
            <Button onClick={handleSaveAccount} loading={submitting}>{editAccount ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
