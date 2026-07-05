'use client';
import { useEffect, useState, useCallback } from 'react';
import { organizationService } from '@/services/api.service';
import { Organization } from '@/types';
import { cn } from '@/lib/utils';
import { Building2, CheckCircle, XCircle, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function OrganizationsTab() {
  const [orgs, setOrgs] = useState<(Organization & { memberCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await organizationService.getAll({ page, limit: 20, search: search || undefined });
      setOrgs(res.data.data);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch { toast.error('Failed to load organizations'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await organizationService.updateStatus(id, status);
      toast.success(`Organization ${status === 'active' ? 'approved' : status}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
      active: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle className="w-3 h-3" /> },
      pending: { color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <Clock className="w-3 h-3" /> },
      inactive: { color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', icon: <XCircle className="w-3 h-3" /> },
      suspended: { color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: <XCircle className="w-3 h-3" /> },
    };
    const m = map[status] || map.inactive;
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full', m.color, m.bg)}>
        {m.icon} {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#1E3A8A]" /> All Organizations
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white w-64 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30" placeholder="Search organizations..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-semibold">No organizations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => (
            <div key={org._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: org.primaryColor || '#1E3A8A' }}>
                    {org.shortName?.charAt(0) || org.organizationName?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 dark:text-white truncate">{org.organizationName}</h4>
                      {statusBadge(org.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {org.shortName && <span className="font-semibold">{org.shortName}</span>}
                      {org.shortName && org.district && <span> · </span>}
                      {org.district && <span>{org.district}</span>}
                      {org.state && <span>, {org.state}</span>}
                      {org.memberCount !== undefined && <span> · {org.memberCount} members</span>}
                    </p>
                    {org.contactEmail && <p className="text-xs text-slate-400 mt-0.5">{org.contactEmail}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {org.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatus(org._id, 'active')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-xs font-bold transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleStatus(org._id, 'inactive')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-xs font-bold transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}
                  {org.status === 'active' && (
                    <button onClick={() => handleStatus(org._id, 'suspended')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded-xl text-xs font-bold transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}
                  {org.status === 'suspended' && (
                    <button onClick={() => handleStatus(org._id, 'active')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-xs font-bold transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Reactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
