'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Cpu } from 'lucide-react';

export default function HospitalAIConfigPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();
  useEffect(() => { if (_hydrated && !isAuthenticated) router.replace('/login'); }, [_hydrated, isAuthenticated, router]);
  if (!_hydrated || !isAuthenticated) return null;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">AI Configuration</h1><p className="text-sm text-muted mt-1">Manage AI clinical decision support settings</p></div>
      <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
        <Cpu className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">AI Settings</h2>
        <p className="text-sm text-muted max-w-md mx-auto">AI configuration coming soon. This will include model selection, prompt customization, confidence thresholds, and role-specific AI behavior tuning.</p>
      </div>
    </div>
  );
}
