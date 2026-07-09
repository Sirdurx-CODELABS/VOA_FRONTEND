'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  Building2, Search, Plus, Globe,
  Edit, Trash2, ChevronRight, Users, Stethoscope,
} from 'lucide-react';

interface Organisation {
  _id: string; name: string; email?: string; phone?: string;
  type?: string; status: string; createdAt: string;
  hospitalsCount?: number; usersCount?: number;
}

export default function OrganisationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    superAdminService.getOrganizations()
      .then(r => setOrgs(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = orgs.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-400">Loading organisations...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Organisations</h1>
          <p className="text-sm text-slate-400 mt-1">{orgs.length} organisation(s) registered</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Organisation
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search organisations..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-slate-400">No organisations found</div>
        )}
        {filtered.map(o => (
          <div key={o._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{o.name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${
                    o.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>{o.status || 'active'}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => router.push(`/dashboard/admin/organisations/${o._id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600"><Edit className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {o.email && <p className="text-xs text-slate-400 mb-1">{o.email}</p>}
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" /> {o.hospitalsCount || 0} hospitals</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {o.usersCount || 0} users</span>
            </div>
            <button onClick={() => router.push(`/dashboard/admin/websites/editor?orgId=${o._id}&type=organisation`)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" /> Manage Website
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
