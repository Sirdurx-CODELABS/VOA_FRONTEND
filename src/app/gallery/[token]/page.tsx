'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { activityService } from '@/services/api.service';
import { ActivityMedia } from '@/types';
import { formatDate } from '@/lib/utils';
import { Download, Share2, Calendar, MapPin } from 'lucide-react';
import { VOALogo } from '@/components/ui/VOALogo';
import toast from 'react-hot-toast';

export default function PublicGalleryPage() {
  const { token } = useParams<{ token: string }>();
  const [media, setMedia] = useState<ActivityMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    activityService.getPublicMedia(token)
      .then(r => setMedia(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F172A]">
      <div className="w-8 h-8 border-4 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !media) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F172A] p-6 text-center">
      <VOALogo size={48} />
      <h1 className="text-xl font-bold text-slate-800 dark:text-white mt-6">Image not found</h1>
      <p className="text-slate-400 text-sm mt-2">This link may have expired or the image was removed.</p>
    </div>
  );

  const activity = media.activityId as { title: string; type: string; date: string; venue?: string; description?: string };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <VOALogo size={36} />
        <p className="text-xs text-slate-400">Voice of Adolescents · Gallery</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden shadow-xl bg-black">
          <img src={media.imageUrl} alt={media.caption || 'VOA Gallery'} className="w-full max-h-[70vh] object-contain" />
        </div>

        {/* Caption */}
        {media.caption && (
          <p className="text-lg font-semibold text-slate-800 dark:text-white">{media.caption}</p>
        )}

        {/* Activity info */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity</p>
          <p className="text-base font-bold text-slate-800 dark:text-white">{activity?.title}</p>
          <p className="text-sm text-slate-500 capitalize">{activity?.type?.replace(/_/g, ' ')}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {activity?.date && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(activity.date)}</span>}
            {activity?.venue && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{activity.venue}</span>}
          </div>
          {activity?.description && <p className="text-sm text-slate-500 leading-relaxed">{activity.description}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <a href={media.imageUrl} download={`voa-gallery-${media._id}.jpg`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#1e3480] text-white font-bold py-3 rounded-xl transition-colors">
            <Download className="w-4 h-4" /> Download
          </a>
          <button onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold py-3 rounded-xl transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Uploaded by {(media.uploadedBy as { fullName: string })?.fullName} · {formatDate(media.createdAt)}
        </p>
        <p className="text-center text-xs text-slate-300 dark:text-slate-600">
          &copy; {new Date().getFullYear()} Voice of Adolescents
        </p>
      </div>
    </div>
  );
}
