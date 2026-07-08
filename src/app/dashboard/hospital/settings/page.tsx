'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Settings } from 'lucide-react';

export default function HospitalSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  useEffect(() => { if (_hydrated && !isAuthenticated) router.replace('/login'); }, [_hydrated, isAuthenticated, router]);
  if (!_hydrated || !isAuthenticated) return null;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Hospital Settings</h1><p className="text-sm text-muted mt-1">Manage hospital configuration</p></div>
      <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
        <Settings className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
        <p className="text-sm text-muted max-w-md mx-auto">Hospital settings coming soon. This will include facility details, contact information, operational hours, service catalog, and integration configuration.</p>
      </div>
    </div>
  );
}
