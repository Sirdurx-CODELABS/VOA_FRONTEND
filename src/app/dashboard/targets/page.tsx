'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { financeTargetService } from '@/services/api.service';
import { FinanceTarget } from '@/types';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Target, Plus, Pencil, CheckCircle, Trash2, TrendingUp, AlertCircle, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'event', label: '🎪 Event Planning' },
  { value: 'welfare', label: '❤️ Welfare Support' },
  { value: 'project', label: '📋 Project Execution' },
  { value: 'office', label: '🏢 Office/Rent' },
  { value: 'outreach', label: '🌍 Outreach Program' },
  { value: 'emergency', label: '🚨 Emergency Fund' },
  { value: 'equipment', label: '🔧 Equipment' },
  { value: 'general', label: '📌 General' },
];

function TargetCard({ target, canManage, onEdit, onComplete, onDelete }: {
  target: FinanceTarget; canManage: boolean;
  onEdit: () => void; onComplete: () => void; onDelete: () => void;
}) {
  const pct = target.progressPercent;
  const isOver = target.amountRaised > target.targetAmount;
  const catMeta = CATEGORIES.find(c => c.value === target.category);

  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden',
      target.isCompleted ? 'border-[#22C55E]/40 dark:border-[#22C55E]/30' : 'border-slate-200 dark:border-slate-800'
    )}>
      {/* Progress bar top */}
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800">
        <div className={cn('h-full rounded-full transition-all duration-500', isOver ? 'bg-[#22C55E]' : 'bg-[#1E3A8A]')}
          style={{ width: `${Math.min(100, pct)}%` }} />
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-slate-400">{catMeta?.label || target.category}</span>
              {target.isCompleted && <Badge variant="success">✅ Completed</Badge>}
              {!target.isCompleted && target.isActive && <Badge variant="info">Active</Badge>}
              {isOver && !target.isCompleted && <Badge variant="success">🎉 Overfunded</Badge>}
            </div>
            <h3 className={cn('font-bold text-slate-800 dark:text-white text-base leading-tight', target.isCompleted && 'line-through opacity-60')}>
              {target.title}
            </h3>
            {target.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{target.description}</p>}
          </div>
          {canManage && (
            <div className="flex gap-1 shrink-0">
              {!target.isCompleted && (
                <>
                  <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={onComplete} className="p-1.5 rounded-lg text-[#22C55E] hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Mark complete"><CheckCircle className="w-3.5 h-3.5" /></button>
                </>
              )}
              <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>

        {/* Amounts */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Target</span>
            <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(target.targetAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Raised</span>
            <span className={cn('font-bold', isOver ? 'text-[#22C55E]' : 'text-[#1E3A8A] dark:text-blue-400')}>{formatCurrency(target.amountRaised)}</span>
          </div>
          {!target.isCompleted && target.amountRemaining > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Remaining</span>
              <span className="font-bold text-[#F97316]">{formatCurrency(target.amountRemaining)}</span>
            </div>
          )}
          {isOver && (
            <div className="flex justify-between text-sm">
              <span className="text-[#22C55E] font-semibold">Extra Balance</span>
              <span className="font-extrabold text-[#22C55E]">+{formatCurrency(target.excessAmount)}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{pct}% funded</span>
            {target.deadline && <span>Due: {formatDate(target.deadline)}</span>}
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-700', isOver ? 'bg-[#22C55E]' : pct >= 75 ? 'bg-[#F97316]' : 'bg-[#1E3A8A]')}
              style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        </div>

        {target.isCompleted && target.completedAt && (
          <p className="text-xs text-[#22C55E] mt-2 font-semibold">Completed {formatDate(target.completedAt)}</p>
        )}
      </div>
    </div>
  );
}

export default function TargetsPage() {
  const { user: me } = useAuthStore();
  const [targets, setTargets] = useState<FinanceTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [modal, setModal] = useState(false);
  const [editTarget, setEditTarget] = useState<FinanceTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', targetAmount: '', deadline: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canManage = hasPermission(me, PERMISSIONS.MANAGE_FINANCE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeTargetService.getAll({ isCompleted: tab === 'completed' });
      setTargets(res.data.data);
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditTarget(null); setForm({ title: '', description: '', category: 'general', targetAmount: '', deadline: '' }); setModal(true); };
  const openEdit = (t: FinanceTarget) => { setEditTarget(t); setForm({ title: t.title, description: t.description || '', category: t.category, targetAmount: String(t.targetAmount), deadline: t.deadline ? t.deadline.slice(0, 10) : '' }); setModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.targetAmount) return toast.error('Title and target amount are required');
    setSubmitting(true);
    try {
      const data = { ...form, targetAmount: parseFloat(form.targetAmount), deadline: form.deadline || undefined };
      if (editTarget) { await financeTargetService.update(editTarget._id, data); toast.success('Target updated'); }
      else { await financeTargetService.create(data); toast.success('Target created!'); }
      setModal(false);
      load();
    } catch (e: unknown) { toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Mark this target as completed?')) return;
    try { await financeTargetService.markComplete(id); toast.success('Target completed!'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this target?')) return;
    try { await financeTargetService.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const totalRaised = targets.reduce((s, t) => s + t.amountRaised, 0);
  const totalTarget = targets.reduce((s, t) => s + t.targetAmount, 0);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title text-slate-800 dark:text-white">Finance Targets</h1>
          <p className="text-sm text-slate-500 mt-1">Fundraising goals and transparency</p>
        </div>
        {canManage && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" /> New Target
          </button>
        )}
      </div>

      {/* Summary stats */}
      {targets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Targets', value: targets.length, icon: Target, color: 'text-[#1E3A8A]', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Total Goal', value: formatCurrency(totalTarget), icon: TrendingUp, color: 'text-[#F97316]', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { label: 'Total Raised', value: formatCurrency(totalRaised), icon: Trophy, color: 'text-[#22C55E]', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Completed', value: targets.filter(t => t.isCompleted).length, icon: CheckCircle, color: 'text-[#22C55E]', bg: 'bg-green-50 dark:bg-green-900/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 shadow-sm">
              <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
              <div><p className="text-base font-extrabold text-slate-800 dark:text-white">{value}</p><p className="text-xs text-slate-400">{label}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1.5 w-fit">
        {(['active', 'completed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-5 py-2 rounded-xl text-sm font-semibold transition-all capitalize', tab === t ? 'bg-white dark:bg-slate-900 text-[#1E3A8A] dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
            {t}
          </button>
        ))}
      </div>

      {/* Target cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 h-48 skeleton" />)}
        </div>
      ) : targets.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No {tab} targets</p>
          {canManage && tab === 'active' && (
            <button onClick={openCreate} className="mt-3 text-[#F97316] text-sm font-semibold hover:underline">Create your first target →</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {targets.map(t => (
            <TargetCard key={t._id} target={t} canManage={canManage}
              onEdit={() => openEdit(t)}
              onComplete={() => handleComplete(t._id)}
              onDelete={() => handleDelete(t._id)} />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editTarget ? 'Edit Target' : 'Create Finance Target'} size="lg">
        <div className="space-y-4">
          <Input label="Title" placeholder="e.g. Annual Gala Event Fund" value={form.title} onChange={e => set('title', e.target.value)} />
          <Textarea label="Description (optional)" placeholder="What is this fund for?" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={e => set('category', e.target.value)} options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))} />
            <Input label="Target Amount (₦)" type="number" placeholder="100000" value={form.targetAmount} onChange={e => set('targetAmount', e.target.value)} />
          </div>
          <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={submitting}>{editTarget ? 'Update' : 'Create'} Target</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
