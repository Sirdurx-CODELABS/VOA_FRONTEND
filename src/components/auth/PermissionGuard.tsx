'use client';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/lib/permissions';
import { getRequiredPermission } from '@/lib/routePermissions';

export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const required = getRequiredPermission(pathname);
  if (required && !hasPermission(user, required)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-7xl font-black text-slate-200 dark:text-slate-700 mb-4">403</div>
        <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
          You don&apos;t have the required permissions to view this page.
        </p>
        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
          {required?.replace(/_/g, ' ')}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
