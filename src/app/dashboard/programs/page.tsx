'use client';
import { useEffect, useState, useCallback } from 'react';
import { programService, userService } from '@/services/api.service';
import { Program, User, JoinRequest } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, Users, ImagePlus, X, Eye, Check, XCircle, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = { 
  title: string; 
  description: string; 
  date: string; 
  venue: string; 
  budget: string; 
  status: string;
  isPublic: boolean;
};

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
  const [joinRequestsModal, setJoinRequestsModal] = useState<Program | null>(null);
  const [viewModal, setViewModal] = useState<Program | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>();

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
    setValue('isPublic', p.isPublic ?? true);
    setExistingImages(p.images || []);
    setSelectedImages([]);
  };

  const openCreate = () => {
    setCreateModal(true);
    setExistingImages([]);
    setSelectedImages([]);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Add images
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      if (editTarget) {
        await programService.update(editTarget._id, formData);
        toast.success('Program updated');
        setEditTarget(null);
      } else {
        await programService.create(formData);
        toast.success('Program created');
        setCreateModal(false);
      }
      
      reset();
      setSelectedImages([]);
      setExistingImages([]);
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

  const openJoinRequests = async (p: Program) => {
    setJoinRequestsModal(p);
    const res = await programService.getJoinRequests(p._id);
    setJoinRequests(res.data.data);
  };

  const handleJoinRequest = async (requestId: string, status: string) => {
    if (!joinRequestsModal) return;
    await programService.updateJoinRequest(joinRequestsModal._id, requestId, status);
    toast.success(`Join request ${status}`);
    // Refresh join requests
    const res = await programService.getJoinRequests(joinRequestsModal._id);
    setJoinRequests(res.data.data);
  };

  const handleAssign = async () => {
    if (!assignModal) return;
    await programService.assignMembers(assignModal._id, selectedMembers);
    toast.success('Members assigned');
    setAssignModal(null);
    load();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const total = existingImages.length + selectedImages.length + newFiles.length;
      if (total > 10) {
        toast.error('Maximum 10 images allowed');
        return;
      }
      setSelectedImages([...selectedImages, ...newFiles]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
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
    { key: 'joinRequests', header: 'Requests', render: (p: Program) => <Badge variant="warning">{(p.joinRequests || []).filter((r: JoinRequest) => r.status === 'pending').length}</Badge> },
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (p: Program) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewModal(p)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openJoinRequests(p)} className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors" title="Join Requests"><UserPlus className="w-4 h-4" /></button>
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
      <Textarea label="Description" placeholder="Program description" rows={6} {...register('description')} />
      
      {/* Images */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Images (Max 10)</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          {/* Existing images */}
          {existingImages.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={img} alt="" className="w-full h-full object-cover" />
              {canManage && (
                <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {/* Selected new images */}
          {selectedImages.map((file, i) => (
            <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeSelectedImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {/* Add image button */}
          {existingImages.length + selectedImages.length < 10 && canManage && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              <ImagePlus className="w-8 h-8 text-gray-400" />
            </label>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Date" type="date" error={errors.date?.message} {...register('date', { required: 'Required' })} />
        <Input label="Venue" placeholder="Location" {...register('venue')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Budget (₦)" type="number" placeholder="0" {...register('budget')} />
        <Select label="Status" options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'ongoing', label: 'Ongoing' }, { value: 'completed', label: 'Completed' }]} {...register('status')} />
      </div>
      <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watch('isPublic')}
                    onChange={(e) => setValue('isPublic', e.target.checked)}
                    className="w-4 h-4 rounded accent-[#1E3A8A]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Public (Allow join requests)</span>
                </label>
              </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" type="button" onClick={() => { setCreateModal(false); setEditTarget(null); reset(); setSelectedImages([]); setExistingImages([]); }}>Cancel</Button>
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
        {canManage && <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" /> New Program</Button>}
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

      <Modal open={createModal || !!editTarget} onClose={() => { setCreateModal(false); setEditTarget(null); reset(); setSelectedImages([]); setExistingImages([]); }} title={editTarget ? 'Edit Program' : 'Create Program'} size="lg">
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

      <Modal open={!!joinRequestsModal} onClose={() => setJoinRequestsModal(null)} title={`Join Requests — ${joinRequestsModal?.title}`} size="lg">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {joinRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No join requests yet</p>
          ) : (
            joinRequests.map((req) => (
              <div key={req._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{req.name}</p>
                    <p className="text-sm text-gray-500">{req.email}</p>
                    {req.phone && <p className="text-sm text-gray-500">{req.phone}</p>}
                    {req.message && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{req.message}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'danger'}>
                      {req.status}
                    </Badge>
                    {req.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleJoinRequest(req._id, 'approved')} className="p-1 rounded text-green-600 hover:bg-green-50">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleJoinRequest(req._id, 'rejected')} className="p-1 rounded text-red-600 hover:bg-red-50">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal?.title} size="xl">
        {viewModal && (
          <div className="space-y-4">
            {/* Images */}
            {viewModal.images?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {viewModal.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="text-gray-900 dark:text-white">{formatDate(viewModal.date)}</p>
            </div>
            {viewModal.venue && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Venue</p>
                <p className="text-gray-900 dark:text-white">{viewModal.venue}</p>
              </div>
            )}
            {viewModal.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewModal.description}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={statusBadge(viewModal.status)}>{viewModal.status}</Badge>
              <Badge variant={viewModal.isPublic ? 'success' : 'default'}>{viewModal.isPublic ? 'Public' : 'Private'}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
