'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { activityService } from '@/services/api.service';
import { ActivityMedia, Activity } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate, cn } from '@/lib/utils';
import { Upload, Download, Share2, X, Image as ImageIcon, Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GalleryPage() {
  const { user: me } = useAuthStore();
  const [media, setMedia] = useState<ActivityMedia[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activityFilter, setActivityFilter] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadActivityId, setUploadActivityId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await activityService.getGallery({ page, limit: 24, activityId: activityFilter || undefined });
      setMedia(r.data.data);
      setTotalPages(r.data.pagination?.totalPages ?? 1);
    } finally { setLoading(false); }
  }, [page, activityFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    activityService.getAll({ limit: 100 }).then(r => setActivities(r.data.data)).catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) return toast.error('Maximum 10 images per upload');
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length !== files.length) return toast.error('Only image files are allowed');
    setUploadFiles(imageFiles);
    setCaptions(imageFiles.map(() => ''));
  };

  const handleUpload = async () => {
    if (!uploadActivityId) return toast.error('Please select an activity');
    if (uploadFiles.length === 0) return toast.error('Please select images');
    setUploading(true);
    try {
      const fd = new FormData();
      uploadFiles.forEach(f => fd.append('images', f));
      captions.forEach(c => fd.append('captions', c));
      await activityService.uploadMedia(uploadActivityId, fd);
      toast.success(`${uploadFiles.length} image(s) uploaded!`);
      setUploadModal(false);
      setUploadFiles([]);
      setCaptions([]);
      setUploadActivityId('');
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      await activityService.deleteMedia(mediaId);
      toast.success('Image deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  const copyShareLink = (token: string) => {
    const url = `${window.location.origin}/gallery/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  };

  const downloadImage = async (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.click();
  };

  const lightboxItem = lightbox !== null ? media[lightbox] : null;

  const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30';

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title text-slate-800 dark:text-white">VOA Gallery</h1>
          <p className="text-sm text-slate-500 mt-1">Activity photos and memories</p>
        </div>
        <button onClick={() => setUploadModal(true)}
          className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold px-4 py-2.5 rounded-xl transition-colors text-sm shadow-sm">
          <Upload className="w-4 h-4" /> Upload Photos
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Filter by Activity</label>
          <select value={activityFilter} onChange={e => { setActivityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30">
            <option value="">All Activities</option>
            {activities.map(a => <option key={a._id} value={a._id}>{a.title}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No photos yet</p>
          <button onClick={() => setUploadModal(true)} className="mt-3 text-[#F97316] text-sm font-semibold hover:underline">Upload the first photo →</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {media.map((item, idx) => (
            <div key={item._id} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow-md transition-all"
              onClick={() => setLightbox(idx)}>
              <img src={item.imageUrl} alt={item.caption || 'Gallery image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-2 opacity-0 group-hover:opacity-100">
                <div className="w-full">
                  {item.caption && <p className="text-white text-xs font-semibold truncate">{item.caption}</p>}
                  <p className="text-white/70 text-[10px]">{(item.activityId as { title: string })?.title}</p>
                </div>
              </div>
              {/* Delete button for uploader */}
              {(item.uploadedBy as { _id: string })?._id === me?._id && (
                <button onClick={e => { e.stopPropagation(); handleDelete(item._id); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox */}
      {lightboxItem && lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          {/* Prev/Next */}
          {lightbox > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {lightbox < media.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightboxItem.imageUrl} alt={lightboxItem.caption || ''} className="w-full max-h-[70vh] object-contain rounded-2xl" />
            <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
              <div>
                {lightboxItem.caption && <p className="text-white font-semibold">{lightboxItem.caption}</p>}
                <p className="text-white/60 text-sm mt-1">
                  {(lightboxItem.activityId as { title: string })?.title}
                  {(lightboxItem.activityId as { date: string })?.date ? ` · ${formatDate((lightboxItem.activityId as { date: string }).date)}` : ''}
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  Uploaded by {(lightboxItem.uploadedBy as { fullName: string })?.fullName} · {formatDate(lightboxItem.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadImage(lightboxItem.imageUrl, `voa-${lightboxItem._id}.jpg`)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={() => copyShareLink(lightboxItem.shareToken)}
                  className="flex items-center gap-1.5 bg-[#F97316]/80 hover:bg-[#F97316] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload Photos" size="lg">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Activity *</label>
            <select value={uploadActivityId} onChange={e => setUploadActivityId(e.target.value)} className={inputCls}>
              <option value="">Select activity...</option>
              {activities.map(a => <option key={a._id} value={a._id}>{a.title} — {formatDate(a.date)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Images (max 10, images only)
            </label>
            <input type="file" accept="image/*" multiple onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#1E3A8A] file:text-white hover:file:bg-[#1e3480] cursor-pointer" />
            {uploadFiles.length > 0 && <p className="text-xs text-[#22C55E] mt-1.5">{uploadFiles.length} image(s) selected</p>}
          </div>
          {uploadFiles.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Captions (optional)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadFiles.map((f, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <input value={captions[i] || ''} onChange={e => setCaptions(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                      placeholder="Caption..." className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/30" />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setUploadModal(false)}>Cancel</Button>
            <Button onClick={handleUpload} loading={uploading}>Upload Photos</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
