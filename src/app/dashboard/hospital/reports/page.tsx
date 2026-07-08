'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { BarChart2 } from 'lucide-react';

export default function HospitalReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  useEffect(() => { if (_hydrated && !isAuthenticated) router.replace('/login'); }, [_hydrated, isAuthenticated, router]);
  if (!_hydrated || !isAuthenticated) return null;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Hospital Reports</h1><p className="text-sm text-muted mt-1">Clinical analytics and operational reports</p></div>
      <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
        <BarChart2 className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Reports Dashboard</h2>
        <p className="text-sm text-muted max-w-md mx-auto">Comprehensive reporting module coming soon. This will include patient volume, adherence rates, lab turnaround times, pharmacy dispensing, and case outcomes.</p>
      </div>
    </div>
  );
}
