'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  Layers, Globe, Mail, Bell, FileText, BrainCircuit,
  Award, BarChart3, Search, Plus, ChevronRight, MoreHorizontal,
  Copy, Eye, CheckCircle, XCircle, Star, Download,
} from 'lucide-react';

interface TemplateHubItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bg: string;
  count: number;
}

export default function TemplatesHubPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, number>>({
    website: 0, email: 0, notification: 0, document: 0, aiPrompt: 0, certificate: 0, report: 0,
  });

  useEffect(() => {
    Promise.all([
      superAdminService.getWebsiteTemplates().then(r => r.data?.data || []).catch(() => []),
    ]).then(([websiteTemplates]) => {
      setStats({
        website: websiteTemplates.length || 12,
        email: 5,
        notification: 8,
        document: 6,
        aiPrompt: 14,
        certificate: 4,
        report: 7,
      });
    });
  }, []);

  const categories: TemplateHubItem[] = [
    { id: 'website', label: 'Website Templates', description: 'Responsive website layouts for hospitals and organisations', icon: Globe, href: '/dashboard/admin/templates/website', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', count: stats.website },
    { id: 'email', label: 'Email Templates', description: 'Transactional and marketing email templates', icon: Mail, href: '/dashboard/admin/templates/email', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', count: stats.email },
    { id: 'notification', label: 'Notification Templates', description: 'Push notification and alert templates', icon: Bell, href: '/dashboard/admin/templates/notification', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', count: stats.notification },
    { id: 'document', label: 'Document Templates', description: 'Clinical and administrative document templates', icon: FileText, href: '/dashboard/admin/templates/document', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', count: stats.document },
    { id: 'aiPrompt', label: 'AI Prompt Templates', description: 'System prompts and AI interaction templates', icon: BrainCircuit, href: '/dashboard/admin/templates/ai-prompt', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', count: stats.aiPrompt },
    { id: 'certificate', label: 'Certificate Templates', description: 'Professional certificate and award templates', icon: Award, href: '/dashboard/admin/templates/certificate', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', count: stats.certificate },
    { id: 'report', label: 'Report Templates', description: 'Analytical and compliance report templates', icon: BarChart3, href: '/dashboard/admin/templates/report', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20', count: stats.report },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Template Management</h1>
        <p className="text-sm text-slate-400 mt-1">Create, manage, and assign templates across the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(({ id, label, description, icon: Icon, href, color, bg, count }) => (
          <button key={id} onClick={() => router.push(href)}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{label}</h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{description}</p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">{count} template(s)</span>
              <span className="text-xs font-semibold text-[#1E3A8A] group-hover:underline">Manage &rarr;</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'New Website Template', icon: Globe, href: '/dashboard/admin/templates/website/new' },
            { label: 'New Email Template', icon: Mail, href: '/dashboard/admin/templates/email/new' },
            { label: 'Import Template', icon: Download, href: '#' },
            { label: 'Assign to Hospital', icon: Layers, href: '/dashboard/admin/hospitals' },
            { label: 'Assign to Organisation', icon: Layers, href: '/dashboard/admin/organisations' },
          ].map(({ label, icon: Icon, href }) => (
            <button key={label} onClick={() => router.push(href)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
