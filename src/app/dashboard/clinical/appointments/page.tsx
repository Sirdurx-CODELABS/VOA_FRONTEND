'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Clock, AlertTriangle, Calendar } from 'lucide-react';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  const canManage = hasPermission(user, PERMISSIONS.MANAGE_APPOINTMENTS as any);
  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <p className="text-sm text-muted mt-1">Schedule and manage clinical appointments</p>
      </div>
      {!canManage && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted">You do not have appointment management permissions.</p>
        </div>
      )}
      <div className="rounded-xl border border-default bg-card-bg p-12 text-center">
        <Calendar className="w-12 h-12 text-muted mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-1">Appointment Scheduling</h2>
        <p className="text-sm text-muted max-w-md mx-auto">Appointment management will be available in the next update. This will include calendar view, slot management, and SMS reminders.</p>
      </div>
    </div>
  );
}
