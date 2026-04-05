'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { contributionService, accountService, transactionService } from '@/services/api.service';
import { Contribution, TreasuryAccount, Transaction } from '@/types';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { ReceiptModal } from '@/components/ui/ContributionReceipt';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  Plus, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle,
  Upload, Copy, MessageCircle, Users, Clock, Wallet, Building2, Receipt,
  Heart, Star, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'contributions' | 'transactions' | 'accounts';
const currentMonth = () => new Date().toISOString().slice(0, 7);
const fmtMonth = (m: string) => {
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

import { SubmitContributionModal } from './_SubmitModal';

export default function FinancePage() {
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState<Tab>('contributions');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [summary, setSummary] = useState<{ total: number; approved: number; pending: number; totalAmount: number; totalExtraContributions: number; topSupportersCount: number } | null>(null);
  const [minimum, setMinimum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [month, setMonth] = useState(currentMonth());
  const [statusFilter, setStatusFilter] = useState('');
  const [submitModal, setSubmitModal] = useState(false);
  const [rejectModal, setRejectModal] = useState<Contribution | null>(null);
  const [receiptModal, setReceiptModal] = useState<Contribution | null>(null);
  const [accountModal, setAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState<TreasuryAccount | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accForm, setAccForm] = useState({ accountName: '', bankName: '', accountNumber: '', accountHolderName: '' });

  const isTreasurer = hasPermission(me, PERMISSIONS.MANAGE_CONTRIBUTIONS);
  const canViewAll = hasPermission(me, PERMISSIONS.VIEW_CONTRIBUTIONS);
  const canSubmit = hasPermission(me, PERMISSIONS.SUBMIT_CONTRIBUTION);
  const canManageAccounts = hasPermission(me, PERMISSIONS.MANAGE_ACCOUNTS);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, reqRes, accRes] = await Promise.allSettled([
        contributionService.getSummary(month),
        contributionService.getRequiredAmount(),
        accountService.getAll(),
      ]);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data);
      if (reqRes.status === 'fulfilled') setMinimum(reqRes.value.data.data.minimum);
      if (accRes.status === 'fulfilled') setAccounts(accRes.value.data.data);

      const cRes = await contributionService.getAll({ page, limit: 10, month, status: statusFilter || undefined });
      setContributions(cRes.data.data);
      setTotalPages(cRes.data.pagination.totalPages);

      if (canViewAll) {
        const txRes = await transactionService.getAll({ page: 1, limit: 10 });
        setTransactions(txRes.data.data);
      }
    } finally { setLoading(false); }
  }, [page, month, statusFilter, canViewAll]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    try { await contributionService.approve(id); toast.success('Approved! Receipt generated.'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try { await contributionService.reject(rejectModal._id, rejectReason); toast.success('Rejected'); setRejectModal(null); setRejectReason(''); load(); }
    catch { toast.error('Failed'); }
  };

  const handleSaveAccount = async () => {
    setSubmitting(true);
    try {
      if (editAccount) { await accountService.update(editAccount._id, accForm); toast.success('Account updated'); }
      else { await accountService.create(accForm); toast.success('Account added'); }
      setAccountModal(false); setEditAccount(null);
      setAccForm({ accountName: '', bankName: '', accountNumber: '', accountHolderName: '' });
      load();
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  // Check if current user has paid this month
  const myContribution = contributions.find(c => c.userId?._id === me?._id || (typeof c.userId === 'string' && c.userId === me?._id));
  const hasPaid = myContribution?.status === 'approved';
  const hasPending = myContribution?.status === 'pending';

  const contribColumns = [
    { key: 'member', header: 'Member', render: (c: Contribution) => (
      <div className="flex items-center gap-2">
        <div>
          <p className="font-semibold text-sm text-slate-800 dark:text-white">{c.userId?.fullName}</p>
          <p className="text-xs text-slate-400">{c.month}</p>
        </div>
        {c.isAboveMinimum && <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-[#F97316] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Heart className="w-2.5 h-2.5" />Top Supporter</span>}
      </div>
    )},
    { key: 'minimum', header: 'Minimum', render: (c: Contribution) => <span className="text-xs text-slate-500">₦{c.minimumRequiredAmount?.toLocaleString()}</span> },
    { key: 'amount', header: 'Paid', render: (c: Contribution) => (
      <div>
        <span className="font-bold text-[#22C55E]">₦{c.amount?.toLocaleString()}</span>
        {c.isAboveMinimum && <p className="text-[10px] text-[#F97316] font-semibold">+₦{c.extraAmount?.toLocaleString()} extra</p>}
      </div>
    )},
    { key: 'method', header: 'Method', render: (c: Contribution) => <span className="text-xs capitalize text-slate-500">{c.paymentMethod?.replace(/_/g, ' ')}</span> },
    { key: 'status', header: 'Status', render: (c: Contribution) => <Badge variant={statusBadge(c.status)}>{c.status}</Badge> },
    { key: 'proof', header: 'Proof', render: (c: Contribution) => c.proofImage ? (
      <a href={c.proofImage} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1E3A8A] dark:text-blue-400 hover:underline">View</a>
    ) : <span className="text-xs text-slate-400">—</span> },
    { key: 'actions', header: '', render: (c: Contribution) => (
      <div className="flex gap-2 items-center">
        {c.status === 'approved' && c.receiptNumber && (
          <button onClick={() => setReceiptModal(c)} className="text-xs text-[#22C55E] hover:underline flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" /> Receipt
          </button>
        )}
        {isTreasurer && c.status === 'pending' && (
          <>
            <button onClick={() => handleApprove(c._id)} className="p-1.5 rounded-lg text-[#22C55E] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
            <button onClick={() => { setRejectModal(c); setRejectReason(''); }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Finance & Contributions</h1>
          <p className="text-sm text-slate-500 mt-1">Transparent financial management for VOA</p>
        </div>
        {canSubmit && !hasPaid && !hasPending && (
          <button onClick={() => setSubmitModal(true)}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Submit Contribution
          </button>
        )}
      </div>

      {/* Member contribution status banner */}
      {canSubmit && (
        <div className={`rounded-2xl p-5 border ${hasPaid ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : hasPending ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 border-[#1E3A8A]/20'}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${hasPaid ? 'bg-green-100 dark:bg-green-900/40' : hasPending ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-[#1E3A8A]/10'}`}>
                {hasPaid ? <CheckCircle className="w-5 h-5 text-[#22C55E]" /> : hasPending ? <Clock className="w-5 h-5 text-amber-600" /> : <AlertCircle className="w-5 h-5 text-[#1E3A8A]" />}
              </div>
              <div>
                <p className={`font-bold text-sm ${hasPaid ? 'text-[#22C55E]' : hasPending ? 'text-amber-700 dark:text-amber-400' : 'text-[#1E3A8A] dark:text-blue-400'}`}>
                  {hasPaid ? '✅ Contribution Paid' : hasPending ? '⏳ Awaiting Approval' : '📌 Contribution Due'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {hasPaid
                    ? `₦${myContribution?.amount?.toLocaleString()} paid for ${fmtMonth(month)}${myContribution?.isAboveMinimum ? ` · +₦${myContribution.extraAmount?.toLocaleString()} extra ❤️` : ''}`
                    : hasPending
                      ? `₦${myContribution?.amount?.toLocaleString()} submitted — waiting for treasurer approval`
                      : `Required: ₦${minimum.toLocaleString()} (${me?.gender || 'standard'} rate) for ${fmtMonth(month)}`}
                </p>
              </div>
            </div>
            {!hasPaid && !hasPending && minimum > 0 && (
              <button onClick={() => setSubmitModal(true)}
                className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                <Upload className="w-3.5 h-3.5" /> Pay Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Transparency stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Collected" value={formatCurrency(summary?.totalAmount ?? 0)} icon={Wallet} color="green" subtitle={fmtMonth(month)} />
        <StatCard title="Paid Members" value={summary?.approved ?? 0} icon={Users} color="blue" />
        <StatCard title="Pending" value={summary?.pending ?? 0} icon={Clock} color="orange" />
        <StatCard title="Top Supporters" value={summary?.topSupportersCount ?? 0} icon={Heart} color="red" subtitle="Above minimum" />
      </div>

      {/* Extra contributions highlight */}
      {(summary?.totalExtraContributions ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-[#F97316]/10 to-[#F97316]/5 dark:from-[#F97316]/20 dark:to-transparent rounded-2xl p-4 border border-[#F97316]/20 flex items-center gap-3">
          <Heart className="w-5 h-5 text-[#F97316] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#F97316]">Extra Contributions This Month</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary?.topSupportersCount} member{summary?.topSupportersCount !== 1 ? 's' : ''} contributed above minimum — total extra: <strong className="text-[#F97316]">{formatCurrency(summary?.totalExtraContributions ?? 0)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Account cards */}
      {accounts.filter(a => a.isActive).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1E3A8A]" /> Payment Accounts
            </h2>
            {canManageAccounts && (
              <button onClick={() => { setAccountModal(true); setEditAccount(null); setAccForm({ accountName: '', bankName: '', accountNumber: '', accountHolderName: '' }); }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] dark:text-blue-400 hover:underline">
                <Plus className="w-3.5 h-3.5" /> Add Account
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.filter(a => a.isActive).map(acc => (
              <div key={acc._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-[#1E3A8A]/10 rounded-xl"><Building2 className="w-5 h-5 text-[#1E3A8A]" /></div>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="font-extrabold text-slate-800 dark:text-white">{acc.accountName}</p>
                <p className="text-sm text-slate-500 mt-0.5">{acc.bankName}</p>
                <div className="mt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                  <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{acc.accountNumber}</span>
                  <button onClick={() => { navigator.clipboard.writeText(acc.accountNumber); toast.success('Copied!'); }}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Holder: {acc.accountHolderName}</p>
                {canManageAccounts && (
                  <button onClick={() => { setEditAccount(acc); setAccForm({ accountName: acc.accountName, bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolderName: acc.accountHolderName }); setAccountModal(true); }}
                    className="mt-3 text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] dark:hover:text-blue-400 transition-colors">Edit</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1.5">
        {([
          { id: 'contributions', label: 'Contributions', icon: Wallet },
          ...(canViewAll ? [{ id: 'transactions', label: 'Transactions', icon: DollarSign }] : []),
          ...(canManageAccounts ? [{ id: 'accounts', label: 'All Accounts', icon: Building2 }] : []),
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-1 justify-center',
              tab === id ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            <Icon className="w-4 h-4" /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'contributions' && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <CardTitle>Contribution Records</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <input type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" />
                {isTreasurer && (
                  <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                )}
              </div>
            </div>
          </CardHeader>
          <Table columns={contribColumns} data={contributions} loading={loading} emptyMessage="No contributions found" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}

      {tab === 'transactions' && canViewAll && (
        <Card>
          <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
          <Table columns={[
            { key: 'title', header: 'Title', render: (t: Transaction) => <p className="font-medium text-sm text-slate-800 dark:text-white">{t.title}</p> },
            { key: 'amount', header: 'Amount', render: (t: Transaction) => <span className={`font-bold text-sm ${t.type === 'income' ? 'text-[#22C55E]' : 'text-red-500'}`}>{t.type === 'income' ? '+' : '-'}₦{t.amount?.toLocaleString()}</span> },
            { key: 'type', header: 'Type', render: (t: Transaction) => <Badge variant={statusBadge(t.type)}>{t.type}</Badge> },
            { key: 'status', header: 'Status', render: (t: Transaction) => <Badge variant={statusBadge(t.status)}>{t.status}</Badge> },
            { key: 'date', header: 'Date', render: (t: Transaction) => <span className="text-xs text-slate-400">{formatDate(t.createdAt)}</span> },
          ]} data={transactions} loading={loading} emptyMessage="No transactions" />
        </Card>
      )}

      {tab === 'accounts' && canManageAccounts && (
        <div className="space-y-3">
          {accounts.map(acc => (
            <div key={acc._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#1E3A8A]/10 rounded-xl"><Building2 className="w-5 h-5 text-[#1E3A8A]" /></div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{acc.accountName}</p>
                  <p className="text-xs text-slate-400">{acc.bankName} · {acc.accountNumber} · {acc.accountHolderName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={acc.isActive ? 'success' : 'danger'}>{acc.isActive ? 'Active' : 'Inactive'}</Badge>
                <button onClick={() => { setEditAccount(acc); setAccForm({ accountName: acc.accountName, bankName: acc.bankName, accountNumber: acc.accountNumber, accountHolderName: acc.accountHolderName }); setAccountModal(true); }}
                  className="text-xs text-[#1E3A8A] dark:text-blue-400 hover:underline font-semibold">Edit</button>
                <button onClick={async () => { await accountService.update(acc._id, { isActive: !acc.isActive }); load(); }}
                  className="text-xs text-slate-500 hover:underline font-semibold">{acc.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <SubmitContributionModal
        open={submitModal}
        onClose={() => setSubmitModal(false)}
        onSuccess={load}
        minimum={minimum}
        gender={me?.gender || 'other'}
        accounts={accounts}
        userName={me?.fullName || ''}
      />

      {/* Reject Modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Contribution" size="sm">
        <div className="space-y-4">
          <Textarea label="Reason for rejection" placeholder="Explain why the proof is invalid..." rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}>Reject</Button>
          </div>
        </div>
      </Modal>

      {/* Account Modal */}
      <Modal open={accountModal} onClose={() => { setAccountModal(false); setEditAccount(null); }} title={editAccount ? 'Edit Account' : 'Add Treasury Account'}>
        <div className="space-y-4">
          <Input label="Account Name" placeholder="e.g. Main VOA Account" value={accForm.accountName} onChange={e => setAccForm(f => ({ ...f, accountName: e.target.value }))} />
          <Input label="Bank Name" placeholder="e.g. First Bank" value={accForm.bankName} onChange={e => setAccForm(f => ({ ...f, bankName: e.target.value }))} />
          <Input label="Account Number" placeholder="0123456789" value={accForm.accountNumber} onChange={e => setAccForm(f => ({ ...f, accountNumber: e.target.value }))} />
          <Input label="Account Holder Name" placeholder="VOA Organization" value={accForm.accountHolderName} onChange={e => setAccForm(f => ({ ...f, accountHolderName: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setAccountModal(false); setEditAccount(null); }}>Cancel</Button>
            <Button onClick={handleSaveAccount} loading={submitting}>{editAccount ? 'Update' : 'Add'} Account</Button>
          </div>
        </div>
      </Modal>

      {receiptModal && <ReceiptModal contribution={receiptModal} open={!!receiptModal} onClose={() => setReceiptModal(null)} />}
    </div>
  );
}
