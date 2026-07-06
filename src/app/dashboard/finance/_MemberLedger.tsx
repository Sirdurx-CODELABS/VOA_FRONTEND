'use client';
import { useState, useEffect } from 'react';
import { ledgerService, userService, financeTargetService } from '@/services/api.service';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate, membershipTypeLabel, cn } from '@/lib/utils';
import {
  Eye, Plus, Edit, FileText, TrendingUp, CheckCircle, XCircle,
  ChevronRight, User, Calendar, DollarSign, Target, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

type LedgerEntry = {
  _id: string;
  memberId: {
    _id: string;
    fullName: string;
    email: string;
    membershipType: string;
  };
  membershipType: string;
  monthlyRequiredAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  arrears: number;
  status: 'fully_paid' | 'partially_paid' | 'outstanding' | 'overpaid';
  monthsPaid: number;
  monthsOwing: number;
  lastPaymentDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type MonthEntry = {
  _id: string;
  month: string;
  year: number;
  requiredAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';
};

export function MemberLedger() {
  const [ledgers, setLedgers] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<LedgerEntry | null>(null);
  const [selectedLedgerDetails, setSelectedLedgerDetails] = useState<{
    ledger: LedgerEntry;
    months: MonthEntry[];
    recentPayments: any[];
  } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'platform' | 'external'>('platform');
  const [paymentForm, setPaymentForm] = useState({
    memberId: '',
    externalMemberName: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
    paidForMonths: [new Date().toISOString().slice(0, 7)]
  });
  const [targetAllocations, setTargetAllocations] = useState<{ targetId: string; amount: string }[]>([]);
  const [availableTargets, setAvailableTargets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const loadLedgers = async () => {
    setLoading(true);
    try {
      const [ledgersRes, targetsRes, usersRes] = await Promise.all([
        ledgerService.getAllLedgers(),
        financeTargetService.getAll({ isCompleted: false }),
        userService.getAll()
      ]);
      setLedgers(ledgersRes.data.data);
      setAvailableTargets(targetsRes.data.data);
      setMembers(usersRes.data.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgers();
  }, []);

  const viewLedger = async (ledger: LedgerEntry) => {
    setSelectedLedger(ledger);
    try {
      const res = await ledgerService.getMemberLedger(ledger.memberId._id);
      setSelectedLedgerDetails(res.data.data);
      setShowDetailsModal(true);
    } catch {
      toast.error('Failed to load ledger details');
    }
  };

  const handleAddPayment = async () => {
    try {
      // Prepare data with target allocations
      const payload = {
        ...paymentForm,
        targetAllocations: targetAllocations
          .filter(a => a.amount && parseFloat(a.amount) > 0)
          .map(a => ({ targetId: a.targetId, amount: parseFloat(a.amount) }))
      };
      
      await ledgerService.addManualPayment(payload);
      toast.success('Payment recorded');
      setShowAddPaymentModal(false);
      setPaymentType('platform');
      setPaymentForm({
        memberId: '',
        externalMemberName: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: '',
        paidForMonths: [new Date().toISOString().slice(0, 7)]
      });
      setTargetAllocations([]);
      loadLedgers();
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const addTargetAllocation = () => {
    if (availableTargets.length > 0) {
      setTargetAllocations([
        ...targetAllocations,
        { targetId: availableTargets[0]._id, amount: '' }
      ]);
    }
  };

  const removeTargetAllocation = (index: number) => {
    setTargetAllocations(targetAllocations.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fully_paid': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'partially_paid': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'overpaid': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
      default: return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'fully_paid': return 'Fully Paid';
      case 'partially_paid': return 'Partially Paid';
      case 'overpaid': return 'Overpaid';
      default: return 'Outstanding';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Member Ledgers</h2>
        <Button onClick={() => {
          setPaymentType('platform');
          setPaymentForm({
            memberId: '',
            externalMemberName: '',
            amount: '',
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            referenceNumber: '',
            notes: '',
            paidForMonths: [new Date().toISOString().slice(0, 7)]
          });
          setShowAddPaymentModal(true);
        }} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Payment
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : ledgers.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No ledgers found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Required</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Paid</th>
                <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Months Paid</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Months Owing</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ledgers.map((ledger) => (
                <tr key={ledger._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center text-[#1E3A8A] font-bold">
                        {ledger.memberId.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 dark:text-white">{ledger.memberId.fullName}</div>
                        <div className="text-xs text-slate-500">{ledger.memberId.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="capitalize text-slate-700 dark:text-slate-300">{membershipTypeLabel(ledger.membershipType)}</span>
                  </td>
                  <td className="py-4 px-4 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatCurrency(ledger.monthlyRequiredAmount)}
                  </td>
                  <td className="py-4 px-4 text-right text-slate-700 dark:text-slate-300 font-medium">
                    {formatCurrency(ledger.totalPaid)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={cn('font-medium', ledger.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                      {formatCurrency(ledger.outstandingBalance)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-slate-700 dark:text-slate-300">
                    {ledger.monthsPaid}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn('font-medium', ledger.monthsOwing > 0 ? 'text-red-600' : 'text-green-600')}>
                      {ledger.monthsOwing}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn('px-3 py-1 rounded-full text-xs font-bold', getStatusColor(ledger.status))}>
                      {getStatusLabel(ledger.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => viewLedger(ledger)} className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setPaymentType('platform');
                        setPaymentForm({
                          ...paymentForm,
                          memberId: ledger.memberId._id,
                          externalMemberName: ''
                        });
                        setShowAddPaymentModal(true);
                      }} className="flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Payment
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Member Ledger Details" size="lg">
        {selectedLedgerDetails && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase">Total Paid</div>
                <div className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(selectedLedgerDetails.ledger.totalPaid)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase">Outstanding</div>
                <div className="text-xl font-bold text-red-600">{formatCurrency(selectedLedgerDetails.ledger.outstandingBalance)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase">Months Paid</div>
                <div className="text-xl font-bold text-green-600">{selectedLedgerDetails.ledger.monthsPaid}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase">Months Owing</div>
                <div className="text-xl font-bold text-red-600">{selectedLedgerDetails.ledger.monthsOwing}</div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Monthly Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedLedgerDetails.months.map((month) => (
                    <div key={month._id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div>
                        <div className="font-medium">
                          {new Date(`${month.month}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500">
                          Required: {formatCurrency(month.requiredAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">Paid: {formatCurrency(month.paidAmount)}</div>
                        {month.outstandingAmount > 0 && (
                          <div className="text-xs text-red-500">Owing: {formatCurrency(month.outstandingAmount)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Modal>

      {/* Add Payment Modal */}
      <Modal open={showAddPaymentModal} onClose={() => setShowAddPaymentModal(false)} title="Record Manual Payment" size="xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('platform');
                  setPaymentForm({ ...paymentForm, externalMemberName: '' });
                }}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  paymentType === 'platform'
                    ? 'border-[#1E3A8A] bg-[#1E3A8A]/10 text-[#1E3A8A] dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span>Platform Member</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentType('external');
                  setPaymentForm({ ...paymentForm, memberId: '' });
                }}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  paymentType === 'external'
                    ? 'border-[#1E3A8A] bg-[#1E3A8A]/10 text-[#1E3A8A] dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <User className="w-5 h-5" />
                  <span>External Member</span>
                </div>
              </button>
            </div>
          </div>

          {paymentType === 'platform' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Member</label>
              <select
                value={paymentForm.memberId}
                onChange={(e) => setPaymentForm({ ...paymentForm, memberId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
              >
                <option value="">-- Select a member --</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="External Member Name"
              value={paymentForm.externalMemberName}
              onChange={(e) => setPaymentForm({ ...paymentForm, externalMemberName: e.target.value })}
              placeholder="Enter member name"
            />
          )}

          <Input
            label="Amount (₦)"
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            placeholder="Enter amount"
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Month</label>
            <input
              type="month"
              value={paymentForm.paidForMonths[0]}
              onChange={(e) => setPaymentForm({ ...paymentForm, paidForMonths: [e.target.value] })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
            <p className="text-xs text-slate-500 mt-1">You can select any month, including future months</p>
          </div>
          
          <Input
            label="Payment Date"
            type="date"
            value={paymentForm.paymentDate}
            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
          />
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <Input
            label="Reference Number (Optional)"
            value={paymentForm.referenceNumber}
            onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
            placeholder="Leave blank to auto-generate"
          />
          
          <Input
            label="Notes"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            placeholder="Any additional notes"
          />
          
          {/* Target Allocation */}
          {availableTargets.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4" /> Allocate to Targets
                </h3>
                <Button variant="outline" size="sm" onClick={addTargetAllocation} className="flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              
              {targetAllocations.map((allocation, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={allocation.targetId}
                    onChange={(e) => {
                      const newAllocations = [...targetAllocations];
                      newAllocations[index].targetId = e.target.value;
                      setTargetAllocations(newAllocations);
                    }}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  >
                    {availableTargets.map((target) => (
                      <option key={target._id} value={target._id}>
                        {target.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={allocation.amount}
                    onChange={(e) => {
                      const newAllocations = [...targetAllocations];
                      newAllocations[index].amount = e.target.value;
                      setTargetAllocations(newAllocations);
                    }}
                    placeholder="Amount"
                    className="w-32 px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                  <button
                    onClick={() => removeTargetAllocation(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowAddPaymentModal(false)}>Cancel</Button>
            <Button onClick={handleAddPayment}>Record Payment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
