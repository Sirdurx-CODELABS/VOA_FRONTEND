'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { analyticsService } from '@/services/doctorApi.service';
import toast from 'react-hot-toast';
import {
  BarChart3, TrendingUp, Users, Activity, FileText, DollarSign,
  Download, Loader2, Calendar,
} from 'lucide-react';

interface ChartData {
  labels: string[];
  data: number[];
}

interface RevenueData {
  daily: number[];
  monthly: number[];
  labels: string[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<ChartData | null>(null);
  const [monthly, setMonthly] = useState<ChartData | null>(null);
  const [demographics, setDemographics] = useState<ChartData | null>(null);
  const [consultTypes, setConsultTypes] = useState<ChartData | null>(null);
  const [diseases, setDiseases] = useState<ChartData | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAll = async () => {
      try {
        const [
          wRes, mRes, dRes, cRes, disRes, rRes,
        ] = await Promise.all([
          analyticsService.getWeeklyConsultations(),
          analyticsService.getMonthlyConsultations(),
          analyticsService.getPatientDemographics(),
          analyticsService.getConsultationTypes(),
          analyticsService.getCommonDiseases(),
          analyticsService.getRevenueAnalytics(),
        ]);
        setWeekly(wRes.data.data);
        setMonthly(mRes.data.data);
        setDemographics(dRes.data.data);
        setConsultTypes(cRes.data.data);
        setDiseases(disRes.data.data);
        setRevenue(rRes.data.data);
      } catch {
        toast.error('Failed to load analytics');
      }
      setLoading(false);
    };
    fetchAll();
  }, [isAuthenticated]);

  const handleDownloadReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      doctor: doctor?.name,
      specialization: doctor?.specialization,
      weekly,
      monthly,
      demographics,
      consultationTypes: consultTypes,
      commonDiseases: diseases,
      revenue,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  if (!_hydrated || !isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted mt-1">Performance metrics and insights</p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-all"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Weekly Consultations */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Weekly Consultations</h2>
        </div>
        <div className="flex items-end gap-2 h-40">
          {(weekly?.labels || []).map((label, i) => {
            const max = Math.max(...(weekly?.data || [0]), 1);
            const h = ((weekly?.data?.[i] || 0) / max) * 100;
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-muted">{weekly?.data?.[i] || 0}</span>
                <div className="w-full rounded-md bg-blue-500/20 relative" style={{ height: `${Math.max(h, 4)}%` }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-md bg-blue-500 transition-all"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted truncate w-full text-center">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Consultations */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <h2 className="text-sm font-semibold text-foreground">Monthly Consultations</h2>
        </div>
        <div className="flex items-end gap-1.5 h-40">
          {(monthly?.labels || []).map((label, i) => {
            const max = Math.max(...(monthly?.data || [0]), 1);
            const h = ((monthly?.data?.[i] || 0) / max) * 100;
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-muted">{monthly?.data?.[i] || 0}</span>
                <div className="w-full rounded-md bg-purple-500/20 relative" style={{ height: `${Math.max(h, 4)}%` }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-md bg-purple-500 transition-all"
                    style={{ height: `${h}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted truncate w-full text-center">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient Demographics & Consultation Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Demographics */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-teal-500" />
            <h2 className="text-sm font-semibold text-foreground">Patient Demographics</h2>
          </div>
          <div className="space-y-3">
            {(demographics?.labels || []).map((label, i) => {
              const total = (demographics?.data || []).reduce((a, b) => a + b, 0);
              const pct = total ? ((demographics?.data?.[i] || 0) / total) * 100 : 0;
              const colors = ['bg-teal-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-green-500', 'bg-blue-500'];
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{label}</span>
                    <span className="text-muted">{demographics?.data?.[i] || 0} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-2 rounded-full ${colors[i % colors.length]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!demographics?.labels || demographics.labels.length === 0) && (
              <p className="text-sm text-muted text-center py-4">No demographic data</p>
            )}
          </div>
        </div>

        {/* Consultation Types */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">Consultation Types</h2>
          </div>
          <div className="space-y-3">
            {(consultTypes?.labels || []).map((label, i) => {
              const total = (consultTypes?.data || []).reduce((a, b) => a + b, 0);
              const pct = total ? ((consultTypes?.data?.[i] || 0) / total) * 100 : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground capitalize">{label.replace('-', ' ')}</span>
                    <span className="text-muted">{consultTypes?.data?.[i] || 0} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className={`h-2.5 rounded-full ${colors[i % colors.length]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!consultTypes?.labels || consultTypes.labels.length === 0) && (
              <p className="text-sm text-muted text-center py-4">No consultation type data</p>
            )}
          </div>
        </div>
      </div>

      {/* Common Diseases & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Common Diseases */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-foreground">Common Diseases</h2>
          </div>
          <div className="space-y-3">
            {(diseases?.labels || []).map((label, i) => {
              const max = Math.max(...(diseases?.data || [0]), 1);
              const pct = ((diseases?.data?.[i] || 0) / max) * 100;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-24 truncate shrink-0">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-2 rounded-full bg-red-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted w-8 text-right shrink-0">{diseases?.data?.[i] || 0}</span>
                </div>
              );
            })}
            {(!diseases?.labels || diseases.labels.length === 0) && (
              <p className="text-sm text-muted text-center py-4">No disease data</p>
            )}
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="rounded-xl border border-default bg-card-bg p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-foreground">Revenue Analytics</h2>
          </div>
          {revenue ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span className="text-xs font-medium text-foreground">Daily Revenue</span>
                </div>
                <div className="flex items-end gap-1 h-24">
                  {(revenue.labels || []).slice(-7).map((label, i) => {
                    const vals = revenue.daily.slice(-7);
                    const max = Math.max(...vals, 1);
                    const h = (vals[i] / max) * 100;
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-sm bg-emerald-500/20 relative" style={{ height: `${Math.max(h, 3)}%` }}>
                          <div className="absolute bottom-0 left-0 right-0 rounded-sm bg-emerald-500" style={{ height: `${h}%` }} />
                        </div>
                        <span className="text-[8px] text-muted truncate w-full text-center">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  <span className="text-xs font-medium text-foreground">Monthly Revenue</span>
                </div>
                <div className="flex items-end gap-1 h-24">
                  {(revenue.labels || []).map((label, i) => {
                    const max = Math.max(...revenue.monthly, 1);
                    const h = (revenue.monthly[i] / max) * 100;
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-sm bg-emerald-500/20 relative" style={{ height: `${Math.max(h, 3)}%` }}>
                          <div className="absolute bottom-0 left-0 right-0 rounded-sm bg-emerald-500" style={{ height: `${h}%` }} />
                        </div>
                        <span className="text-[8px] text-muted truncate w-full text-center">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-4">No revenue data</p>
          )}
        </div>
      </div>
    </div>
  );
}
