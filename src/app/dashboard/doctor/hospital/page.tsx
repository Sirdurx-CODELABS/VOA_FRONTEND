'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService, hospitalService } from '@/services/doctorApi.service';
import { Doctor } from '@/types';
import toast from 'react-hot-toast';
import {
  Building2, MapPin, Phone, Stethoscope, Users, Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface HospitalData {
  _id: string;
  name: string;
  state: string;
  lga: string;
  address?: string;
  phone?: string;
}

export default function HospitalPage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated } = useDoctorAuthStore();
  const [hospital, setHospital] = useState<HospitalData | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchHospital = async () => {
      try {
        // Get full doctor profile with populated hospital
        const profileRes = await doctorService.getProfile();
        const profile = profileRes.data.data as Doctor & { hospital?: HospitalData | string };
        const hospitalId = typeof profile.hospital === 'object' ? profile.hospital?._id : profile.hospital;

        if (!hospitalId) {
          setLoading(false);
          return;
        }

        const [hRes, dRes] = await Promise.all([
          hospitalService.getById(hospitalId),
          hospitalService.getDoctors(hospitalId),
        ]);
        setHospital(hRes.data.data);
        setDoctors(dRes.data.data || []);
      } catch {
        toast.error('Failed to load hospital data');
      }
      setLoading(false);
    };
    fetchHospital();
  }, [isAuthenticated]);

  if (!_hydrated || !isAuthenticated) return null;

  const departments = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Building2 className="w-16 h-16 text-muted" />
        <p className="text-muted text-lg font-medium">No Hospital Assigned</p>
        <p className="text-sm text-muted/70 max-w-sm text-center">
          You are not currently assigned to a hospital. Contact your administrator to be linked to a facility.
        </p>
        <Link
          href="/dashboard/doctor"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/doctor"
          className="p-2 rounded-lg hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{hospital.name}</h1>
          <p className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {hospital.lga}, {hospital.state}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-default bg-card-bg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted">Total Doctors</p>
              <p className="text-lg font-bold text-foreground">{doctors.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-default bg-card-bg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted">Departments</p>
              <p className="text-lg font-bold text-foreground">{departments.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-default bg-card-bg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted">Phone</p>
              <p className="text-sm font-bold text-foreground">{hospital.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Details */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-primary" />
          Hospital Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted">State</span>
            <p className="text-foreground font-medium mt-0.5">{hospital.state}</p>
          </div>
          <div>
            <span className="text-muted">LGA</span>
            <p className="text-foreground font-medium mt-0.5">{hospital.lga}</p>
          </div>
          <div>
            <span className="text-muted">Address</span>
            <p className="text-foreground font-medium mt-0.5">{hospital.address || 'N/A'}</p>
          </div>
          <div>
            <span className="text-muted">Phone</span>
            <p className="text-foreground font-medium mt-0.5">{hospital.phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className="rounded-xl border border-default bg-card-bg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Doctors at this Hospital ({doctors.length})
          </h2>
        </div>
        {doctors.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">No doctors found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {doctors.map(d => (
              <div
                key={d._id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-hover transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                    {d.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted truncate">{d.specialization} &middot; {d.phone}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  d.isAvailable ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-400'
                }`}>
                  {d.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
