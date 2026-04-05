import { getInitials, cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  superAdmin?: boolean;
}

const sizes = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function Avatar({ name, src, size = 'md', className, superAdmin }: AvatarProps) {
  const sizeClass = sizes[size];
  const bgClass = superAdmin ? 'bg-amber-500' : 'bg-[#F97316]';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover shrink-0', sizeClass, className)}
      />
    );
  }

  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold shrink-0', sizeClass, bgClass, className)}>
      {getInitials(name)}
    </div>
  );
}
