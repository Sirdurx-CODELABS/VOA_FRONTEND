'use client';
import { useEffect, useState, useCallback } from 'react';
import { programService, userService } from '@/services/api.service';
import { Program, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = { title: string; description: string; date: string; venue: string; budget: string; status: string };

export default function ProgramsPage() {
  const { user: me } = useAuthStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Program | null>(null);
  const [assignModal, setAssignModal] = useState<Program | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>();

  const canManage = ['chairman', 'program_coordinator'].includes(me?.role || '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await programService.getAll({ page, limit: 10, search, status: statusFilter || undefined });
      setPrograms(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (p: Program) => {
    setEditTarget(p);
    setValue('title', p.title);
    setValue('description', p.description || '');
    setValue('date', p.date.slice(0, 10));
    setValue('venue', p.venue || '');
    setValue('budget', String(p.budget || ''));
    setValue('status', p.status);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editTarget) {
        await programService.update(editTarget._id, data);
        toast.success('Program updated');
        setEditTarget(null);
      } else {
        await programService.create(data);
        toast.success('Program created');
        setCreateModal(false);
      }
      reset();
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this program?')) return;
    await programService.delete(id);
    toast.success('Program deleted');
    load();
  };

  const openAssign = async (p: Program) => {
    setAssignModal(p);
    setSelectedMembers(p.assignedMembers.map((m) => (typeof m === 'string' ? m : m._id)));
    const res = await userService.getAll({ status: 'active', limit: 100 });
    setAllUsers(res.data.data);
  };

  const handleAssign = async () => {
    if (!assignModal) return;
    await programService.assignMembers(assignModal._id, selectedMembers);
    toast.success('Members assigned');
    setAssignModal(null);
    load();
  };

  const columns = [
    { key: 'title', header: 'Program', render: (p: Program) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{p.title}</p>
        <p className="text-xs text-gray-400">{p.venue || 'No venue'}</p>
      </div>
    )},
    { key: 'date', header: 'Date', render: (p: Program) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(p.date)}</span> },
    { key: 'status', header: 'Status', render: (p: Program) => <Badge variant={statusBadge(p.status)}>{p.status}</Badge> },
    { key: 'members', header: 'Members', render: (p: Program) => <Badge variant="default">{p.assignedMembers.length}</Badge> },
    { key: 'budget', header: 'Budget', render: (p: Program) => <span className="text-sm text-gray-600 dark:text-gray-400">{p.budget ? `₦${p.budget.toLocaleString()}` : '—'}</span> },
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (p: Program) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openAssign(p)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Assign Members"><Users className="w-4 h-4" /></button>
          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    }] : []),
  ];

  const ProgramForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title" placeholder="Program title" error={errors.title?.message} {...register('title', { required: 'Required' })} />
      <Textarea label="Description" placeholder="Program description" rows={3} {...register('description')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date" type="date" error={errors.date?.message} {...register('date', { required: 'Required' })} />
        <Input label="Venue" placeholder="Location" {...register('venue')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Budget (₦)" type="number" placeholder="0" {...register('budget')} />
        <Select label="Status" options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }]} {...register('status')} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" type="button" onClick={() => { setCreateModal(false); setEditTarget(null); reset(); }}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{editTarget ? 'Update' : 'Create'} Program</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Programs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage organization programs and events</p>
        </div>
        {canManage && <Button onClick={() => { setCreateModal(true); reset(); }} size="sm"><Plus className="w-4 h-4" /> New Program</Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search programs..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardHeader>
        <Table columns={columns} data={programs} loading={loading} emptyMessage="No programs found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal open={createModal || !!editTarget} onClose={() => { setCreateModal(false); setEditTarget(null); reset(); }} title={editTarget ? 'Edit Program' : 'Create Program'} size="lg">
        <ProgramForm />
      </Modal>

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign Members — ${assignModal?.title}`} size="lg">
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
            {allUsers.map((u) => (
              <label key={u._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg">
                <input type="checkbox" checked={selectedMembers.includes(u._id)} onChange={(e) => {
                  setSelectedMembers(e.target.checked ? [...selectedMembers, u._id] : selectedMembers.filter((id) => id !== u._id));
                }} className="rounded text-indigo-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{u.fullName}</span>
                <span className="text-xs text-gray-400 capitalize ml-auto">{u.role.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setAssignModal(null)}>Cancel</Button>
            <Button onClick={handleAssign}>Save Assignments</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
