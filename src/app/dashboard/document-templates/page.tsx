'use client';
import { useEffect, useState } from 'react';
import { templateConfigService } from '@/services/api.service';
import { FileText, Eye, Loader2, Shield, Check, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATE_ICONS: Record<string, string> = {
  letterhead: '📄',
  membership_card: '🪪',
  meeting_agenda: '📋',
  official_invitation: '💌',
  financial_request: '💰',
  activity_report: '📊',
  official_receipt: '🧾',
  mou: '🤝',
  email_signature: '✉️',
  certificate: '🏆',
};

const ALL_ROLES = ['super_admin', 'chairman', 'vice_chairman', 'secretary',
  'treasurer', 'pro', 'program_coordinator', 'membership_coordinator', 'welfare_officer', 'member'];

interface TemplateConfig {
  _id: string;
  templateType: string;
  name: string;
  isVisible: boolean;
  allowedRoles: string[];
}

export default function DocumentTemplatesPage() {
  const [configs, setConfigs] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await templateConfigService.getAll();
      setConfigs(res.data.data || []);
    } catch {
      toast.error('Failed to load template configs');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (cfg: TemplateConfig) => {
    try {
      await templateConfigService.update(cfg.templateType, { isVisible: !cfg.isVisible });
      setConfigs(prev => prev.map(c => c._id === cfg._id ? { ...c, isVisible: !c.isVisible } : c));
      toast.success(`${cfg.name} is now ${!cfg.isVisible ? 'visible' : 'hidden'}`);
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Document Templates</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage template visibility and role-based access in the Document System</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Template</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Allowed Roles</th>
                  <th className="text-right px-4 py-3.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {configs.map(cfg => (
                  <tr key={cfg._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{TEMPLATE_ICONS[cfg.templateType] || '📄'}</span>
                        <span className="font-semibold text-slate-800 dark:text-white">{cfg.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleVisibility(cfg)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          cfg.isVisible
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cfg.isVisible ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {cfg.isVisible ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ROLES.map(role => {
                          const allowed = cfg.allowedRoles?.includes(role);
                          return (
                            <span
                              key={role}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize transition-colors ${
                                allowed
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                              }`}
                            >
                              {allowed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                              {role.replace(/_/g, ' ')}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setPreview(cfg.templateType)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] hover:bg-[#1E3A8A]/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          templateType={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

/* ── Preview Modal ──────────────────────────────────────────────── */
function PreviewModal({ templateType, onClose }: { templateType: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.NEXT_PUBLIC_DOC_SYSTEM_URL || 'http://localhost:5173';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl w-full max-w-4xl mx-4 h-[85vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white capitalize">
            {templateType.replace(/_/g, ' ')} Preview
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1">
          <iframe
            src={`${baseUrl}/${templateType === 'membership_card' ? 'membership-card' : templateType === 'official_invitation' ? 'invitation' : templateType === 'activity_report' ? 'activity-report' : templateType === 'financial_request' ? 'financial-request' : templateType === 'official_receipt' ? 'receipt' : templateType === 'meeting_agenda' ? 'meeting-agenda' : templateType === 'email_signature' ? 'email-signature' : templateType}`}
            className="w-full h-full bg-white"
            onLoad={() => setLoading(false)}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900">
              <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
