'use client';
import { useEffect, useState, useCallback } from 'react';
import { documentAdminService, systemInfoService } from '@/services/api.service';
import { FileText, ExternalLink, Plus, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATE_LABELS: Record<string, string> = {
  letterhead: 'Letterhead',
  membership_card: 'Membership Card',
  meeting_agenda: 'Meeting Agenda',
  official_invitation: 'Official Invitation',
  financial_request: 'Financial Request',
  activity_report: 'Activity Report',
  official_receipt: 'Official Receipt',
  mou: 'MOU Document',
  email_signature: 'Email Signature',
  certificate: 'Certificate',
};

interface Document {
  _id: string;
  name: string;
  templateType: string;
  userId: { _id: string; fullName: string; email: string; role: string };
  createdAt: string;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [docSystemUrl, setDocSystemUrl] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem('voa_doc_system_url');
    if (cached) setDocSystemUrl(cached);
    systemInfoService.get()
      .then(r => {
        const url = r.data.data.documentSystemUrl || 'http://localhost:5173';
        setDocSystemUrl(url);
        localStorage.setItem('voa_doc_system_url', url);
      })
      .catch(() => {});
  }, []);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentAdminService.getAll({ page, limit: 20 });
      setDocs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const openDoc = (id: string) => {
    const token = localStorage.getItem('voa_token');
    window.open(`${docSystemUrl}/document/${id}${token ? `?token=${token}` : ''}`, '_blank', 'noopener,noreferrer');
  };

  const newDoc = () => {
    const token = localStorage.getItem('voa_token');
    window.open(`${docSystemUrl}${token ? `?token=${token}` : ''}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Document Generator</h1>
          <p className="text-sm text-slate-400 mt-0.5">View and manage documents from the Document Management System</p>
        </div>
        <button onClick={newDoc}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-bold hover:bg-[#1E3A8A]/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No documents found</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create a new document to get started</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Author</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Created</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {docs.map(doc => (
                    <tr key={doc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{doc.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                          {TEMPLATE_LABELS[doc.templateType] || doc.templateType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {doc.userId?.fullName || 'Unknown'}
                        <span className="text-xs ml-1 text-slate-400">({doc.userId?.role || '?'})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openDoc(doc._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-[#1E3A8A]/10 rounded-lg transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{total} document{total !== 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-2">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
