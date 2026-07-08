'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { Building2, AlertTriangle, Loader2, Plus, X } from 'lucide-react';

const SAMPLE_DEPARTMENTS = [
  { name: 'General Medicine', head: 'Dr. Adebayo', staff: 12 },
  { name: 'Pediatrics', head: 'Dr. Okafor', staff: 8 },
  { name: 'Obstetrics & Gynecology', head: 'Dr. Eze', staff: 10 },
  { name: 'Pharmacy', head: 'Pharm. Musa', staff: 6 },
  { name: 'Laboratory', head: 'Lab Sci. Nnamdi', staff: 5 },
  { name: 'Adherence Counseling', head: 'Helen Grace', staff: 4 },
  { name: 'Case Management', head: 'Sarah John', staff: 3 },
];

export default function HospitalDepartmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hydrated } = useAuthStore();

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/login');
  }, [_hydrated, isAuthenticated, router]);

  if (!_hydrated || !isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-sm text-muted mt-1">Manage hospital departments and units</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SAMPLE_DEPARTMENTS.map(d => (
          <div key={d.name} className="rounded-xl border border-default bg-card-bg p-4 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{d.name}</h3>
                <p className="text-xs text-muted">{d.staff} staff members</p>
              </div>
            </div>
            <p className="text-xs text-muted">Head: <span className="text-foreground font-medium">{d.head}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}
