'use client';
import { useEffect, useState, useCallback } from 'react';
import { projectService } from '@/services/api.service';
import { Project } from '@/types';
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
  title: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  status: 'planning' | 'ongoing' | 'completed' | 'on-hold';
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: string;
  impact?: string;
  isPublic: boolean;
};

export default function ProjectsPage() {
  const { user: me } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [viewModal, setViewModal] = useState<Project | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      status: 'planning',
      isPublic: true
    }
  });

  const canManage = ['chairman', 'pro'].includes(me?.role || '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectService.getAll({ page, limit: 10, search, status: statusFilter || undefined });
      setProjects(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (project: Project) => {
    setEditTarget(project);
    setValue('title', project.title);
    setValue('description', project.description);
    setValue('shortDescription', project.shortDescription);
    setValue('category', project.category);
    setValue('status', project.status);
    setValue('startDate', project.startDate ? project.startDate.slice(0, 10) : '');
    setValue('endDate', project.endDate ? project.endDate.slice(0, 10) : '');
    setValue('budget', project.budget);
    setValue('location', project.location);
    setValue('impact', project.impact);
    setValue('isPublic', project.isPublic);
    setExistingImages(project.images || []);
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
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      selectedImages.forEach(file => {
        formData.append('images', file);
      });

      if (editTarget) {
        await projectService.update(editTarget._id, formData);
        toast.success('Project updated');
        setEditTarget(null);
      } else {
        await projectService.create(formData);
        toast.success('Project created');
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
    if (!confirm('Delete this project?')) return;
    await projectService.delete(id);
    toast.success('Project deleted');
    load();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedImages([...selectedImages, ...newFiles]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planning': return 'default';
      case 'ongoing': return 'warning';
      case 'completed': return 'success';
      case 'on-hold': return 'danger';
      default: return 'default';
    }
  };

  const columns = [
    { key: 'title', header: 'Project', render: (project: Project) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{project.title}</p>
        <p className="text-xs text-gray-400">{project.shortDescription || 'No description'}</p>
      </div>
    )},
    { key: 'category', header: 'Category', render: (project: Project) => <span className="text-sm text-gray-600 dark:text-gray-400">{project.category || 'Uncategorized'}</span> },
    { key: 'status', header: 'Status', render: (project: Project) => <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge> },
    { key: 'date', header: 'Start Date', render: (project: Project) => <span className="text-sm text-gray-600 dark:text-gray-400">{project.startDate ? formatDate(project.startDate) : '-'}</span> },
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (project: Project) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewModal(project)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(project._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    }] : []),
  ];

  const ProjectForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title" placeholder="Project title" error={errors.title?.message} {...register('title', { required: 'Required' })} />
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Images</label>
        <div className="grid grid-cols-5 gap-2 mb-3">
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
          {selectedImages.map((file, i) => (
            <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeSelectedImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {canManage && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
              <ImagePlus className="w-8 h-8 text-gray-400" />
            </label>
          )}
        </div>
      </div>

      <Textarea label="Short Description" placeholder="Brief description" rows={2} {...register('shortDescription')} />
      <Textarea label="Description" placeholder="Detailed description" rows={4} {...register('description')} />
      <Textarea label="Impact" placeholder="Project impact" rows={2} {...register('impact')} />
      
      <div className="grid grid-cols-2 gap-3">
        <Input label="Category" placeholder="e.g., Education, Community" {...register('category')} />
        <Input label="Location" placeholder="Project location" {...register('location')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" type="date" {...register('startDate')} />
        <Input label="End Date" type="date" {...register('endDate')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Budget" type="number" placeholder="0" {...register('budget', { valueAsNumber: true })} />
        <Select label="Status" options={[
          { value: 'planning', label: 'Planning' },
          { value: 'ongoing', label: 'Ongoing' },
          { value: 'completed', label: 'Completed' },
          { value: 'on-hold', label: 'On Hold' }
        ]} {...register('status')} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch('isPublic')}
                  onChange={(e) => setValue('isPublic', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1E3A8A]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Public</span>
              </label>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" type="button" onClick={() => { setCreateModal(false); setEditTarget(null); reset(); setSelectedImages([]); setExistingImages([]); }}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{editTarget ? 'Update' : 'Create'} Project</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage projects</p>
        </div>
        {canManage && <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" /> New Project</Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search projects..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="planning">Planning</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </CardHeader>
        <Table columns={columns} data={projects} loading={loading} emptyMessage="No projects found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal open={createModal || !!editTarget} onClose={() => { setCreateModal(false); setEditTarget(null); reset(); setSelectedImages([]); setExistingImages([]); }} title={editTarget ? 'Edit Project' : 'Create Project'} size="xl">
        <ProjectForm />
      </Modal>

      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal?.title} size="xl">
        {viewModal && (
          <div className="space-y-4">
            {viewModal.images && viewModal.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {viewModal.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            )}
            {viewModal.shortDescription && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Short Description</p>
                <p className="text-gray-900 dark:text-white">{viewModal.shortDescription}</p>
              </div>
            )}
            {viewModal.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewModal.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {viewModal.category && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="text-gray-900 dark:text-white">{viewModal.category}</p>
                </div>
              )}
              {viewModal.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-gray-900 dark:text-white">{viewModal.location}</p>
                </div>
              )}
              {viewModal.startDate && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Start Date</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(viewModal.startDate)}</p>
                </div>
              )}
              {viewModal.endDate && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">End Date</p>
                  <p className="text-gray-900 dark:text-white">{formatDate(viewModal.endDate)}</p>
                </div>
              )}
              {viewModal.budget && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Budget</p>
                  <p className="text-gray-900 dark:text-white">{viewModal.budget}</p>
                </div>
              )}
            </div>
            {viewModal.impact && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Impact</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewModal.impact}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(viewModal.status)}>{viewModal.status}</Badge>
              <Badge variant={viewModal.isPublic ? 'success' : 'default'}>{viewModal.isPublic ? 'Public' : 'Private'}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
