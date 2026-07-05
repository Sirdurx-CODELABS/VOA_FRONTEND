'use client';
import { useEffect, useState, useCallback } from 'react';
import { teamService, userService } from '@/services/api.service';
import { TeamMember, User } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, Eye, ImagePlus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = {
  user: string;
  position: string;
  bio?: string;
  order?: number;
  isPublic: boolean;
};

export default function TeamPage() {
  const { user: me } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [viewModal, setViewModal] = useState<TeamMember | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      isPublic: true,
      order: 0
    }
  });

  const canManage = ['super_admin', 'chairman', 'pro'].includes(me?.role || '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        teamService.getAll({ page, limit: 10, search }),
        userService.getAll({ limit: 100 })
      ]);
      setMembers(membersRes.data.data);
      setTotalPages(membersRes.data.pagination.totalPages);
      setUsers(usersRes.data.data);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (member: TeamMember) => {
    setEditTarget(member);
    setValue('user', (member.user as User)?._id || (typeof member.user === 'string' ? member.user : ''));
    setValue('position', member.position);
    setValue('bio', member.bio);
    setValue('order', member.order);
    setValue('isPublic', member.isPublic);
    setExistingPhoto(member.photo || null);
    setSelectedPhoto(null);
  };

  const openCreate = () => {
    setCreateModal(true);
    setExistingPhoto(null);
    setSelectedPhoto(null);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }

      if (editTarget) {
        await teamService.update(editTarget._id, formData);
        toast.success('Team member updated');
        setEditTarget(null);
      } else {
        await teamService.create(formData);
        toast.success('Team member added');
        setCreateModal(false);
      }
      
      reset();
      setSelectedPhoto(null);
      setExistingPhoto(null);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this team member?')) return;
    await teamService.delete(id);
    toast.success('Team member removed');
    load();
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedPhoto(e.target.files[0]);
    }
  };

  const columns = [
    { key: 'member', header: 'Member', render: (member: TeamMember) => (
      <div className="flex items-center gap-3">
        {(member.user as User)?.profileImage || member.photo ? (
          <img
            src={(member.user as User)?.profileImage || member.photo}
            alt={(member.user as User)?.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {(member.user as User)?.fullName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{(member.user as User)?.fullName}</p>
          <p className="text-xs text-gray-400">{member.position}</p>
        </div>
      </div>
    )},
    { key: 'order', header: 'Order', render: (member: TeamMember) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">{member.order}</span>
    )},
    { key: 'status', header: 'Visibility', render: (member: TeamMember) => (
      <Badge variant={member.isPublic ? 'success' : 'default'}>
        {member.isPublic ? 'Public' : 'Private'}
      </Badge>
    )},
    { key: 'date', header: 'Added', render: (member: TeamMember) => (
      <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(member.createdAt)}</span>
    )},
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (member: TeamMember) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewModal(member)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(member)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(member._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    }] : []),
  ];

  const MemberForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Member"
        options={users.map(u => ({ value: u._id, label: u.fullName }))}
        error={errors.user?.message}
        {...register('user', { required: 'Member is required' })}
      />
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Photo</label>
        <div className="flex flex-col gap-3">
          {existingPhoto ? (
            <div className="relative w-24 h-24">
              <img src={existingPhoto} alt="" className="w-full h-full object-cover rounded-full border" />
              {canManage && (
                <button type="button" onClick={() => setExistingPhoto(null)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : selectedPhoto ? (
            <div className="relative w-24 h-24">
              <img src={URL.createObjectURL(selectedPhoto)} alt="" className="w-full h-full object-cover rounded-full border" />
              <button type="button" onClick={() => setSelectedPhoto(null)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : null}
          {canManage && (
            <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors w-fit">
              <ImagePlus className="w-4 h-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Upload Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <Input
        label="Position"
        placeholder="e.g., Chairman, Secretary, PRO"
        error={errors.position?.message}
        {...register('position', { required: 'Position is required' })}
      />
      
      <Textarea
        label="Bio"
        placeholder="Short biography"
        rows={4}
        {...register('bio')}
      />
      
      <Input
        label="Display Order"
        type="number"
        placeholder="0"
        {...register('order', { valueAsNumber: true })}
      />

      <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch('isPublic')}
                  onChange={(e) => setValue('isPublic', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1E3A8A]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show on public website</span>
              </label>

      <div className="flex gap-3 justify-end pt-2">
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setCreateModal(false);
            setEditTarget(null);
            reset();
            setSelectedPhoto(null);
            setExistingPhoto(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {editTarget ? 'Update' : 'Add'} Member
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members</p>
        </div>
        {canManage && <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" /> Add Member</Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search team..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </CardHeader>
        <Table columns={columns} data={members} loading={loading} emptyMessage="No team members yet" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal open={createModal || !!editTarget} onClose={() => {
        setCreateModal(false);
        setEditTarget(null);
        reset();
        setSelectedPhoto(null);
        setExistingPhoto(null);
      }} title={editTarget ? 'Edit Team Member' : 'Add Team Member'} size="lg">
        <MemberForm />
      </Modal>

      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title="Team Member" size="md">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {(viewModal.user as User)?.profileImage || viewModal.photo ? (
                <img
                  src={(viewModal.user as User)?.profileImage || viewModal.photo}
                  alt={(viewModal.user as User)?.fullName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">
                    {(viewModal.user as User)?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{(viewModal.user as User)?.fullName}</p>
                <p className="text-gray-600 dark:text-gray-400">{viewModal.position}</p>
              </div>
            </div>
            {viewModal.bio && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Bio</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewModal.bio}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={viewModal.isPublic ? 'success' : 'default'}>
                {viewModal.isPublic ? 'Public' : 'Private'}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
