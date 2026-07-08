'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoctorAuthStore } from '@/store/doctorAuthStore';
import { doctorService } from '@/services/doctorApi.service';
import { DoctorScheduleDay } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  Loader2, Save, Clock, Calendar, ToggleLeft, ToggleRight,
} from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

function defaultSchedule(): DoctorScheduleDay[] {
  return DAYS.map((day) => ({
    day,
    isAvailable: day !== 'saturday' && day !== 'sunday',
    startTime: '08:00',
    endTime: '17:00',
    type: 'both',
  }));
}

export default function DoctorSchedulePage() {
  const router = useRouter();
  const { doctor, isAuthenticated, _hydrated, updateDoctor } = useDoctorAuthStore();
  const [schedule, setSchedule] = useState<DoctorScheduleDay[]>(defaultSchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) router.replace('/doctor/login');
  }, [_hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!doctor?.schedule) return;
    const existing = DAYS.map((day) => {
      const found = doctor.schedule!.find((s) => s.day === day);
      return found || { day, isAvailable: false, startTime: '08:00', endTime: '17:00', type: 'both' as const };
    });
    setSchedule(existing);
    setLoading(false);
  }, [doctor?.schedule]);

  useEffect(() => {
    if (doctor && !doctor.schedule) setLoading(false);
  }, [doctor]);

  const handleToggle = (i: number) => {
    setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, isAvailable: !d.isAvailable } : d));
  };

  const handleTime = (i: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));
  };

  const handleType = (i: number, type: DoctorScheduleDay['type']) => {
    setSchedule((prev) => prev.map((d, idx) => idx === i ? { ...d, type } : d));
  };

  const handleSave = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      const res = await doctorService.updateProfile(doctor._id, { schedule } as Partial<import('@/types').Doctor>);
      updateDoctor({ schedule: res.data.data.schedule });
      toast.success('Schedule saved successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save schedule';
      toast.error(msg);
    }
    setSaving(false);
  };

  if (!_hydrated || !isAuthenticated || !doctor) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    );
  }

  const availableCount = schedule.filter((d) => d.isAvailable).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weekly Schedule</h1>
        <p className="text-sm text-muted mt-1">
          Dr. {doctor.name?.split(' ')[0]} &middot; {availableCount}/7 days available
          <span className="ml-3 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            <Calendar className="w-3 h-3" />
            Max {doctor.maxDailyPatients} patients/day
          </span>
        </p>
      </div>

      {/* Doctor Profile Summary */}
      <div className="rounded-xl border border-default bg-card-bg p-4 flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-xs text-muted">Availability</span>
          <p className={`font-medium flex items-center gap-1 ${doctor.isAvailable ? 'text-green-500' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${doctor.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
            {doctor.isAvailable ? 'Available' : 'Unavailable'}
          </p>
        </div>
        <div>
          <span className="text-xs text-muted">Max Daily Patients</span>
          <p className="font-medium text-foreground">{doctor.maxDailyPatients}</p>
        </div>
        <div>
          <span className="text-xs text-muted">Today's Count</span>
          <p className="font-medium text-foreground">{doctor.todayPatientCount || 0}</p>
        </div>
      </div>

      {/* Schedule Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {schedule.map((day, i) => (
          <div
            key={day.day}
            className="rounded-xl border border-default bg-card-bg p-4 transition-all"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground capitalize">{DAY_LABELS[day.day]}</h3>
              <button
                onClick={() => handleToggle(i)}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                  day.isAvailable
                    ? 'border-green-500/30 bg-green-500/10 text-green-600'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                )}
              >
                {day.isAvailable ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                {day.isAvailable ? 'Available' : 'Unavailable'}
              </button>
            </div>

            {day.isAvailable && (
              <div className="space-y-3">
                {/* Time Range */}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted shrink-0" />
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => handleTime(i, 'startTime', e.target.value)}
                    className="flex-1 bg-main-bg border border-default rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <span className="text-xs text-muted">to</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => handleTime(i, 'endTime', e.target.value)}
                    className="flex-1 bg-main-bg border border-default rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>

                {/* Consultation Type */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted mr-1">Type:</span>
                  {(['online', 'physical', 'both'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleType(i, t)}
                      className={cn(
                        'text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors',
                        day.type === t
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-default text-muted hover:border-primary/20'
                      )}
                    >
                      {t === 'both' ? 'Both' : t === 'online' ? 'Online' : 'Physical'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
}
