'use client';
import { useEffect, useState, useCallback } from 'react';
import { announcementService } from '@/services/api.service';
import { Announcement } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Table';
import { Badge, statusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate, truncate, cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, Pin, Eye, Megaphone, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface CategoryMeta { value: string; label: string; color: string; icon: string; }

type FormData = { title: string; message: string; category: string; visibility: string; departmentTag?: string; };

// Category color map for cards
const categoryStyle = (cat: string): { border: string; badge: string } => {
  const map: Record<string, { border: string; badge: string }> = {
    executive:    { border: 'border-l-[#1E3A8A]', badge: 'bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-blue-900/30 dark:text-blue-400' },
    emergency:    { border: 'border-l-red-500',    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    finance:      { border: 'border-l-[#22C55E]',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    contribution: { border: 'border-l-[#22C55E]',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    payment_reminder: { border: 'border-l-[#F97316]', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    meeting:      { border: 'border-l-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    membership:   { border: 'border-l-[#F97316]',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    publicity:    { border: 'border-l-[#1E3A8A]',  badge: 'bg-[#1E3A8A]/10 text-[#1E3A8A] dark:bg-blue-900/30 dark:text-blue-400' },
    welfare:      { border: 'border-l-[#22C55E]',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    program:      { border: 'border-l-[#F97316]',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  };
  return map[cat] || { border: 'border-l-slate-300', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
};

const roleLabel = (role: string) => role?.replace(/_/g, ' ');

export default function AnnouncementsPage() {
  const { user: me } = useAuthStore();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [viewTarget, setViewTarget] = useState<Announcement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [allowedCategories, setAllowedCategories] = useState<CategoryMeta[]>([]);

  const canManage = hasPermission(me, PERMISSIONS.MANAGE_ANNOUNCEMENTS);
  const canPost = canManage;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { visibility: 'internal', category: '' },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAll({ page, limit: 12, category: categoryFilter || undefined });
      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } finally { setLoading(false); }
  }, [page, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  // Load allowed categories for this user's role
  useEffect(() => {
    if (canPost) {
      announcementService.getMyCategories()
        .then(r => {
          setAllowedCategories(r.data.data);
          if (r.data.data.length > 0) setValue('category', r.data.data[0].value);
        })
        .catch(() => {});
    }
  }, [canPost, setValue]);

  const openEdit = (a: Announcement) => {
    setEditTarget(a);
    setValue('title', a.title);
    setValue('message', a.message);
    setValue('category', a.category);
    setValue('visibility', a.visibility);
    setValue('departmentTag', a.departmentTag || '');
  };

  const onSubmit = async (data: FormData) => {
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (editTarget) {
        await announcementService.update(editTarget._id, data);
        toast.success('Announcement updated');
        setEditTarget(null);
      } else {
        await announcementService.create(fd);
        toast.success('Announcement published!');
        setCreateModal(false);
      }
      reset();
      load();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try { await announcementService.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const AnnouncementForm = () => {
    const selectedCat = watch('category');
    const catMeta = allowedCategories.find(c => c.value === selectedCat);
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Category selector — filtered to role's allowed categories */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Announcement Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            {allowedCategories.map(cat => (
              <button key={cat.value} type="button"
                onClick={() => setValue('category', cat.value)}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all text-xs font-semibold',
                  selectedCat === cat.value
                    ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 text-[#1E3A8A] dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                )}>
                <span className="text-base">{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
          {catMeta && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500">
              <span>{catMeta.icon}</span>
              <span>Posting as <strong className="capitalize">{roleLabel(me?.role || '')}</strong> — {catMeta.label} announcement</span>
            </div>
          )}
        </div>

        <Input label="Title" placeholder="Announcement title" error={errors.title?.message} {...register('title', { required: 'Required' })} />
        <Textarea label="Message" placeholder="Write your announcement..." rows={4} error={errors.message?.message} {...register('message', { required: 'Required' })} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Visibility" options={[
            { value: 'internal', label: 'Internal (All members)' },
            { value: 'public', label: 'Public (Website)' },
            { value: 'specific_roles', label: 'Specific Roles' },
          ]} {...register('visibility')} />
          <Input label="Department Tag (optional)" placeholder="e.g. Finance Dept" {...register('departmentTag')} />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" type="button" onClick={() => { setCreateModal(false); setEditTarget(null); reset(); }}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{editTarget ? 'Update' : 'Publish'}</Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title text-slate-800 dark:text-white">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1 capitalize">
            {canPost ? `Posting as ${roleLabel(me?.role || '')}` : 'Read-only access'}
          </p>
        </div>
        {canPost && allowedCategories.length > 0 && (
          <button onClick={() => { setCreateModal(true); reset(); }}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Role duty banner */}
      {canPost && allowedCategories.length > 0 && (
        <div className="bg-[#1E3A8A]/5 dark:bg-[#1E3A8A]/20 rounded-2xl p-4 border border-[#1E3A8A]/20">
          <p className="text-xs font-bold text-[#1E3A8A] dark:text-blue-400 uppercase tracking-wider mb-2">
            📢 Your Announcement Duties
          </p>
          <div className="flex flex-wrap gap-2">
            {allowedCategories.map(cat => (
              <span key={cat.value} className="inline-flex items-center gap-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300">
                {cat.icon} {cat.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <button onClick={() => { setCategoryFilter(''); setPage(1); }}
          className={cn('text-xs font-semibold px-3 py-1.5 rounded-full transition-colors', !categoryFilter ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
          All
        </button>
        {['executive', 'finance', 'meeting', 'membership', 'publicity', 'program', 'welfare', 'general'].map(cat => (
          <button key={cat} onClick={() => { setCategoryFilter(cat); setPage(1); }}
            className={cn('text-xs font-semibold px-3 py-1.5 rounded-full transition-colors capitalize', categoryFilter === cat ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
            {cat}
          </button>
        ))}
      </div>

      {/* Announcement cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="skeleton h-4 w-3/4 mb-3" />
              <div className="skeleton h-3 w-full mb-2" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No announcements found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(a => {
            const style = categoryStyle(a.category);
            const isOwner = a.createdBy?._id === me?._id || (typeof a.createdBy === 'string' && a.createdBy === me?._id);
            const canEdit = canManage && (isOwner || me?.role === 'super_admin' || me?.role === 'chairman');
            return (
              <div key={a._id} className={cn(
                'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3',
                style.border
              )}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {a.isPinned && <Pin className="w-3 h-3 text-[#F97316] shrink-0" />}
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', style.badge)}>
                        {a.category?.replace(/_/g, ' ')}
                      </span>
                      <Badge variant={statusBadge(a.visibility)} className="text-[10px]">{a.visibility}</Badge>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight line-clamp-2">{a.title}</h3>
                  </div>
                </div>

                {/* Message preview */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{a.message}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
                      {a.createdBy?.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{roleLabel(a.createdByRole)} · {formatDate(a.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewTarget(a)} className="p-1.5 rounded-lg text-[#1E3A8A] dark:text-blue-400 hover:bg-[#1E3A8A]/10 transition-colors" title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canEdit && (
                      <>
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(a._id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={cn('w-8 h-8 rounded-lg text-xs font-semibold transition-colors', p === page ? 'bg-[#1E3A8A] text-white' : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={createModal || !!editTarget} onClose={() => { setCreateModal(false); setEditTarget(null); reset(); }}
        title={editTarget ? 'Edit Announcement' : 'New Announcement'}
        subtitle={editTarget ? undefined : `Posting as ${roleLabel(me?.role || '')}`}
        size="lg">
        <AnnouncementForm />
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTarget} onClose={() => setViewTarget(null)} title={viewTarget?.title} size="lg">
        {viewTarget && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full capitalize', categoryStyle(viewTarget.category).badge)}>
                {viewTarget.category?.replace(/_/g, ' ')}
              </span>
              <Badge variant={statusBadge(viewTarget.visibility)}>{viewTarget.visibility}</Badge>
              {viewTarget.departmentTag && <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{viewTarget.departmentTag}</span>}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{viewTarget.message}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Posted by <strong className="text-slate-600 dark:text-slate-300">{viewTarget.createdBy?.fullName}</strong> ({roleLabel(viewTarget.createdByRole)})</span>
              <span>{formatDate(viewTarget.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
