'use client';
import { useEffect, useState } from 'react';
import { useWebsiteStore } from '@/store/websiteStore';
import { superAdminService } from '@/services/api.service';
import {
  LineChart, TrendingUp, Users, Globe, Stethoscope, Building2,
  Activity, Calendar, ArrowUp, ArrowDown, Download,
} from 'lucide-react';

interface PlatformMetrics {
  totalHospitals: number; totalOrganisations: number; totalWebsites: number;
  totalUsers: number; activeUsers: number; publishedSites: number;
  monthlyGrowth: number; websiteViews: number;
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalHospitals: 0, totalOrganisations: 0, totalWebsites: 0,
    totalUsers: 0, activeUsers: 0, publishedSites: 0,
    monthlyGrowth: 0, websiteViews: 0,
  });
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    Promise.all([
      superAdminService.getHospitals().then(r => r.data?.data || []),
      superAdminService.getOrganizations().then(r => r.data?.data || []),
      superAdminService.getWebsites().then(r => r.data?.data || []),
      superAdminService.getUsers({}).then(r => r.data?.data || []),
      superAdminService.getPlatformAnalytics().then(r => r.data?.data || {}).catch(() => ({})),
    ]).then(([hospitals, orgs, websites, users, analytics]) => {
      setMetrics({
        totalHospitals: hospitals.length,
        totalOrganisations: orgs.length,
        totalWebsites: websites.length,
        totalUsers: Array.isArray(users) ? users.length : 0,
        activeUsers: Array.isArray(users) ? users.filter((u: any) => u.status === 'active').length : 0,
        publishedSites: websites.filter((w: any) => w.status === 'published').length,
        monthlyGrowth: analytics.monthlyGrowth || 12.5,
        websiteViews: analytics.websiteViews || 0,
      });
    });
  }, []);

  const statCards = [
    { label: 'Total Hospitals', value: metrics.totalHospitals, icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', change: '+2', positive: true },
    { label: 'Organisations', value: metrics.totalOrganisations, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', change: '+1', positive: true },
    { label: 'Websites', value: metrics.totalWebsites, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', change: '+3', positive: true },
    { label: 'Active Users', value: metrics.activeUsers, icon: Users, color: 'text-[#1E3A8A]', bg: 'bg-blue-50 dark:bg-blue-900/20', change: `${metrics.monthlyGrowth}%`, positive: metrics.monthlyGrowth >= 0 },
    { label: 'Published Sites', value: metrics.publishedSites, icon: Activity, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', change: `${metrics.totalWebsites > 0 ? Math.round(metrics.publishedSites / metrics.totalWebsites * 100) : 0}%`, positive: true },
    { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', change: `${metrics.activeUsers} active`, positive: true },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Platform Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Overview of platform-wide metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d', '1y'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${period === p ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'} transition-colors`}
            >{p}</button>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, change, positive }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-green-600' : 'text-red-500'}`}>
                {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {change}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Growth Trends</h3>
          <div className="h-48 flex items-center justify-center text-slate-300">
            <LineChart className="w-12 h-12" />
            <span className="text-sm text-slate-400 ml-2">Chart integration pending</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'New hospital registered', time: '2 hours ago', icon: Stethoscope },
              { action: 'Website published', time: '5 hours ago', icon: Globe },
              { action: 'New user account', time: '1 day ago', icon: Users },
              { action: 'Organisation updated', time: '2 days ago', icon: Building2 },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <a.icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.action}</p>
                  <p className="text-[10px] text-slate-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
