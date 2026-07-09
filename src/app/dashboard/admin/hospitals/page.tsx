'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  Stethoscope, Search, Plus, MoreHorizontal, Globe,
  ChevronRight, Eye, Edit, Trash2, Building2,
} from 'lucide-react';

interface Hospital {
  _id: string; name: string; email?: string; phone?: string;
  address?: string; status: string; createdAt: string;
  organisation?: { _id: string; name: string };
}

export default function HospitalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    superAdminService.getHospitals()
      .then(r => setHospitals(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = hospitals.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (id: string) => router.push(`/dashboard/admin/hospitals/${id}`);
  const handleViewWebsite = (id: string) => router.push(`/dashboard/admin/websites/editor?id=${id}&type=hospital`);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading hospitals...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Hospitals</h1>
          <p className="text-sm text-slate-400 mt-1">{hospitals.length} hospital(s) registered</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Hospital
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search hospitals..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Organisation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">No hospitals found</td></tr>
              )}
              {filtered.map(h => (
                <tr key={h._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{h.name}</p>
                        <p className="text-xs text-slate-400">{h.address || 'No address'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{h.organisation?.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      h.status === 'active' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                      h.status === 'inactive' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                      'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}>{h.status || 'active'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{h.email || '—'}</td>
                  <td className="px-4 py-3.5 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleViewWebsite(h._id)} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-400 hover:text-purple-600 transition-colors" title="Website"><Globe className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(h._id)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
