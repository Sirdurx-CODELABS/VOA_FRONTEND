'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, _hydrated } = useAuthStore();

  useEffect(() => {
    if (!_hydrated) return; // wait for localStorage to load
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [_hydrated, isAuthenticated, router]);

  // Show loader while hydrating
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A] flex items-center justify-center shadow-lg">
          <span className="text-white font-extrabold text-lg">V</span>
        </div>
        <Loader2 className="w-5 h-5 text-[#1E3A8A] animate-spin" />
      </div>
    </div>
  );
}
