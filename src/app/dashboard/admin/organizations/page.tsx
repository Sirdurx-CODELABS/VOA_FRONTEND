'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { organizationService } from '@/services/api.service';
import { Organization } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, Building2, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20',
  inactive: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
  pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  suspended: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  active: CheckCircle,
  pending: Clock,
  suspended: XCircle,
};

export default function AdminOrganizationsPage() {
  const { user: me } = useAuthStore();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (me && me.role !== 'super_admin') router.replace('/dashboard');
  }, [me, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      const res = await organizationService.getAll(params);
      setOrgs(Array.isArray(res.data.data) ? res.data.data : res.data.data?.organizations || []);
    } catch {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { if (me?.role === 'super_admin') load(); }, [me, load]);

  const handleStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await organizationService.updateStatus(id, status);
      toast.success(`Organization ${status === 'active' ? 'approved' : 'rejected'}`);
      load();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (!me || me.role !== 'super_admin') return null;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="page-title text-slate-800 dark:text-white">Organizations</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all registered organizations</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          />
        </div>
        <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A]" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No organizations found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Short Name</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Members</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orgs.map(org => {
                  const StatusIcon = STATUS_ICONS[org.status] || Clock;
                  return (
                    <tr key={org._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-[#1E3A8A]" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{org.organizationName}</p>
                            {org.contactEmail && <p className="text-xs text-slate-400">{org.contactEmail}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{org.shortName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize text-slate-600 dark:text-slate-400">{org.organizationType?.replace(/_/g, ' ') || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
                          STATUS_COLORS[org.status] || STATUS_COLORS.inactive,
                        )}>
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {org.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{org.memberCount ?? '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {org.status === 'pending' && (
                            <>
                              <Button
                                size="xs"
                                variant="success"
                                loading={actionLoading === org._id}
                                onClick={() => handleStatus(org._id, 'active')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="xs"
                                variant="danger"
                                loading={actionLoading === org._id}
                                onClick={() => handleStatus(org._id, 'inactive')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {org.status === 'active' && (
                            <Button
                              size="xs"
                              variant="danger"
                              onClick={() => handleStatus(org._id, 'inactive')}
                            >
                              Deactivate
                            </Button>
                          )}
                          {(org.status === 'inactive' || org.status === 'suspended') && (
                            <Button
                              size="xs"
                              variant="success"
                              onClick={() => handleStatus(org._id, 'active')}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
