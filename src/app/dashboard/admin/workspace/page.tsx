'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { superAdminService } from '@/services/api.service';
import {
  Stethoscope, Building2, Globe,
  ChevronRight, ArrowRight, ShieldCheck,
} from 'lucide-react';

interface Entity {
  _id: string; name: string; type: string; slug?: string; logo?: string;
}

export default function WorkspacePage() {
  const router = useRouter();
  const { setGlobal, setHospital, setOrganisation, clearWorkspace } = useWorkspaceStore();
  const [hospitals, setHospitals] = useState<Entity[]>([]);
  const [organisations, setOrganisations] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      superAdminService.getHospitals().then(r => r.data?.data || []).catch(() => []),
      superAdminService.getOrganizations().then(r => r.data?.data || []).catch(() => []),
    ]).then(([h, o]) => {
      setHospitals(h);
      setOrganisations(o);
      setLoading(false);
    });
  }, []);

  const selectHospital = (h: Entity) => {
    setHospital({ _id: h._id, name: h.name, type: 'hospital' });
    router.push('/dashboard/hms');
  };

  const selectOrganisation = (o: Entity) => {
    setOrganisation({ _id: o._id, name: o.name, type: 'organisation' });
    router.push('/dashboard/organisation');
  };

  const selectGlobal = () => {
    setGlobal();
    router.push('/dashboard/admin');
  };

  const filterEntities = (items: Entity[]) => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(e => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q));
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading workspaces...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Workspace Switcher</h1>
          <p className="text-sm text-slate-400 mt-1">Select a workspace context to manage</p>
        </div>
      </div>

      <input
        type="text" placeholder="Search hospitals or organisations..."
        value={search} onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#0F1D4A] rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={selectGlobal}>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Global Platform</h3>
          <p className="text-white/60 text-sm mt-1">Full platform administration and oversight</p>
          <div className="mt-4 flex items-center gap-1 text-amber-400 text-sm font-semibold">
            Open <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20"><Stethoscope className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Hospitals</h3>
              <p className="text-xs text-slate-400">{filterEntities(hospitals).length} hospitals</p>
            </div>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filterEntities(hospitals).length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No hospitals found</p>}
            {filterEntities(hospitals).map(h => (
              <button key={h._id} onClick={() => selectHospital(h)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    {h.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{h.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20"><Building2 className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Organisations</h3>
              <p className="text-xs text-slate-400">{filterEntities(organisations).length} organisations</p>
            </div>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filterEntities(organisations).length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No organisations found</p>}
            {filterEntities(organisations).map(o => (
              <button key={o._id} onClick={() => selectOrganisation(o)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
                    {o.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{o.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
