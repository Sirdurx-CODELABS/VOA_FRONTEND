'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  CreditCard, Plus, Edit3, Trash2, CheckCircle, XCircle,
  DollarSign, Users, Globe, Database, Cpu, ArrowLeft, Star,
} from 'lucide-react';

interface Plan {
  _id: string; planName: string; description: string; amount: number;
  billingCycle: string; status: string; features: string[];
  hospitals: number; organisations: number; staff: number; storage: number;
}

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminService.getSubscriptions().then(r => setPlans(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const defaultPlans = [
    { _id: 'basic', planName: 'Basic', description: 'For small clinics and organisations', amount: 0, billingCycle: 'monthly', status: 'active', features: ['1 Hospital', '5 Staff', '1 Website', '1GB Storage', 'Basic Analytics'], hospitals: 1, organisations: 1, staff: 5, storage: 1 },
    { _id: 'standard', planName: 'Standard', description: 'For growing hospitals', amount: 99, billingCycle: 'monthly', status: 'active', features: ['5 Hospitals', '25 Staff', '3 Websites', '10GB Storage', 'Advanced Analytics', 'AI Credits: 1000'], hospitals: 5, organisations: 3, staff: 25, storage: 10 },
    { _id: 'professional', planName: 'Professional', description: 'For large hospitals and organisations', amount: 249, billingCycle: 'monthly', status: 'active', features: ['Unlimited Hospitals', '100 Staff', '10 Websites', '50GB Storage', 'Full Analytics', 'AI Credits: 10000', 'Custom Domain', 'API Access'], hospitals: -1, organisations: 10, staff: 100, storage: 50 },
    { _id: 'enterprise', planName: 'Enterprise', description: 'For hospital groups and networks', amount: 499, billingCycle: 'monthly', status: 'active', features: ['Unlimited Everything', '500 Staff', 'Unlimited Websites', '500GB Storage', 'Enterprise Analytics', 'AI Credits: Unlimited', 'Dedicated Support', 'Custom Integrations', 'SLA'], hospitals: -1, organisations: -1, staff: 500, storage: 500 },
  ];

  const allPlans = plans.length > 0 ? plans : defaultPlans;

  if (loading) return <div className="p-8 text-center text-slate-400">Loading plans...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin/subscriptions')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><ArrowLeft className="w-4 h-4" /></button>
          <div><h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Subscription Plans</h1><p className="text-sm text-slate-400 mt-1">{allPlans.length} plan(s)</p></div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" /> New Plan</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allPlans.map(plan => (
          <div key={plan._id} className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-5 shadow-sm relative ${
            plan.planName === 'Professional' ? 'border-[#1E3A8A] dark:border-blue-500' : 'border-slate-200 dark:border-slate-800'
          }`}>
            {plan.planName === 'Professional' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E3A8A] text-white px-3 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3" /> Popular
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">{plan.planName}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${plan.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{plan.status}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">${plan.amount}</span>
              <span className="text-sm text-slate-400">/{plan.billingCycle}</span>
            </div>
            <div className="space-y-2 mb-4">
              {plan.features.slice(0, 6).map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50"><Edit3 className="w-3.5 h-3.5 inline mr-1" /> Edit</button>
              <button className="flex-1 px-3 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Billing Models Supported</h3>
        <div className="flex flex-wrap gap-2">
          {['Per User', 'Per Member', 'Per Staff', 'Per Patient', 'Per Revenue', 'Monthly', 'Quarterly', 'Biannual', 'Yearly', 'Lifetime', 'Custom Billing'].map(m => (
            <span key={m} className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
