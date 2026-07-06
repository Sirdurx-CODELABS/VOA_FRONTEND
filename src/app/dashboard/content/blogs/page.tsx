'use client';
import { useEffect, useState, useCallback } from 'react';
import { blogService } from '@/services/api.service';
import { Blog } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, Eye, ImagePlus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type FormData = {
  title: string;
  content: string;
  category?: string;
  featured: boolean;
  status: 'draft' | 'published';
  isPublic: boolean;
};

export default function BlogsPage() {
  const { user: me } = useAuthStore();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Blog | null>(null);
  const [viewModal, setViewModal] = useState<Blog | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      featured: false,
      status: 'draft',
      isPublic: true
    }
  });

  const canManage = ['super_admin', 'chairman', 'pro'].includes(me?.role || '');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogService.getAll({ page, limit: 10, search, status: statusFilter || undefined });
      setBlogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (blog: Blog) => {
    setEditTarget(blog);
    setValue('title', blog.title);
    setValue('content', blog.content);
    setValue('category', blog.category);
    setValue('featured', blog.featured);
    setValue('status', blog.status);
    setValue('isPublic', blog.isPublic);
    setExistingImage(blog.image || null);
    setSelectedImage(null);
  };

  const openCreate = () => {
    setCreateModal(true);
    setExistingImage(null);
    setSelectedImage(null);
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
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (editTarget) {
        await blogService.update(editTarget._id, formData);
        toast.success('Blog updated');
        setEditTarget(null);
      } else {
        await blogService.create(formData);
        toast.success('Blog created');
        setCreateModal(false);
      }
      
      reset();
      setSelectedImage(null);
      setExistingImage(null);
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this blog?')) return;
    await blogService.delete(id);
    toast.success('Blog deleted');
    load();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const columns = [
    { key: 'title', header: 'Blog', render: (blog: Blog) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white text-sm">{blog.title}</p>
        <p className="text-xs text-gray-400">by {blog.author.fullName}</p>
      </div>
    )},
    { key: 'category', header: 'Category', render: (blog: Blog) => <span className="text-sm text-gray-600 dark:text-gray-400">{blog.category || 'Uncategorized'}</span> },
    { key: 'status', header: 'Status', render: (blog: Blog) => <Badge variant={blog.status === 'published' ? 'success' : 'default'}>{blog.status}</Badge> },
    { key: 'featured', header: 'Featured', render: (blog: Blog) => <Badge variant={blog.featured ? 'success' : 'default'}>{blog.featured ? 'Yes' : 'No'}</Badge> },
    { key: 'date', header: 'Date', render: (blog: Blog) => <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(blog.createdAt)}</span> },
    ...(canManage ? [{
      key: 'actions', header: 'Actions',
      render: (blog: Blog) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewModal(blog)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
          <button onClick={() => openEdit(blog)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(blog._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    }] : []),
  ];

  const BlogForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title" placeholder="Blog title" error={errors.title?.message} {...register('title', { required: 'Required' })} />
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured Image</label>
        <div className="flex flex-col gap-2">
          {existingImage && (
            <div className="relative w-48 h-32">
              <img src={existingImage} alt="" className="w-full h-full object-cover rounded-lg border" />
              {canManage && (
                <button type="button" onClick={() => setExistingImage(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          {selectedImage && (
            <div className="relative w-48 h-32">
              <img src={URL.createObjectURL(selectedImage)} alt="" className="w-full h-full object-cover rounded-lg border" />
              <button type="button" onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {canManage && (
            <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors w-fit">
              <ImagePlus className="w-4 h-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Upload Image</span>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <Textarea label="Content" placeholder="Blog content" rows={10} error={errors.content?.message} {...register('content', { required: 'Required' })} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Category" placeholder="e.g., News, Announcements" {...register('category')} />
        <Select label="Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} {...register('status')} />
      </div>

      <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch('featured')}
                  onChange={(e) => setValue('featured', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1E3A8A]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch('isPublic')}
                  onChange={(e) => setValue('isPublic', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1E3A8A]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Public</span>
              </label>
            </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" type="button" onClick={() => { setCreateModal(false); setEditTarget(null); reset(); setSelectedImage(null); setExistingImage(null); }}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{editTarget ? 'Update' : 'Create'} Blog</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Blogs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage blog posts</p>
        </div>
        {canManage && <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" /> New Blog</Button>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search blogs..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </CardHeader>
        <Table columns={columns} data={blogs} loading={loading} emptyMessage="No blogs found" />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      <Modal open={createModal || !!editTarget} onClose={() => { setCreateModal(false); setEditTarget(null); reset(); setSelectedImage(null); setExistingImage(null); }} title={editTarget ? 'Edit Blog' : 'Create Blog'} size="xl">
        <BlogForm />
      </Modal>

      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal?.title} size="xl">
        {viewModal && (
          <div className="space-y-4">
            {viewModal.image && <img src={viewModal.image} alt="" className="w-full max-h-80 object-cover rounded-lg" />}
            <div>
              <p className="text-sm text-gray-500 mb-1">Author</p>
              <p className="text-gray-900 dark:text-white">{viewModal.author.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Published</p>
              <p className="text-gray-900 dark:text-white">{formatDate(viewModal.createdAt)}</p>
            </div>
            {viewModal.category && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Category</p>
                <p className="text-gray-900 dark:text-white">{viewModal.category}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Content</p>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{viewModal.content}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={viewModal.status === 'published' ? 'success' : 'default'}>{viewModal.status}</Badge>
              {viewModal.featured && <Badge variant="success">Featured</Badge>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
