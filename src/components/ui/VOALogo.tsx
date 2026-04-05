import Image from 'next/image';

interface VOALogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  onDark?: boolean;
  /** Use img tag instead of next/image (needed inside modals/portals) */
  plain?: boolean;
}

/**
 * Official VOA logo using the real asset from /public.
 * Falls back to the SVG mark if the image fails to load.
 */
export function VOALogo({ size = 36, variant = 'full', onDark = false, plain = false }: VOALogoProps) {
  const textColor = onDark ? '#FFFFFF' : '#1E3A8A';
  const subColor  = onDark ? 'rgba(255,255,255,0.75)' : '#F97316';

  const logoEl = plain ? (
    // Plain <img> — works everywhere including canvas capture contexts
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/voa-logo.svg"
      alt="VOA Logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
    />
  ) : (
    <Image
      src="/voa-logo.svg"
      alt="VOA Logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
      priority
    />
  );

  if (variant === 'icon') return logoEl;

  return (
    <div className="flex items-center gap-2.5 select-none">
      {logoEl}
      <div className="flex flex-col leading-none">
        <span style={{ color: textColor }} className="font-extrabold text-base tracking-tight">VOA</span>
        <span style={{ color: subColor }} className="font-medium text-[10px] tracking-widest uppercase">Management</span>
      </div>
    </div>
  );
}

/**
 * Inline SVG version — used inside html2canvas captures (ID card export)
 * because external images can fail in canvas. Matches the real logo style.
 */
export function VOALogoSVG({ size = 36, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle */}
      <circle cx="60" cy="60" r="58" fill="#1E3A8A" stroke={onDark ? 'rgba(255,255,255,0.15)' : 'rgba(30,58,138,0.2)'} strokeWidth="2" />
      {/* Inner white circle accent */}
      <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {/* Person head */}
      <circle cx="60" cy="42" r="12" fill="white" opacity="0.95" />
      {/* Person body arc */}
      <path d="M34 82c0-14.359 11.641-26 26-26s26 11.641 26 26" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.95" />
      {/* Orange upward arrow (growth) */}
      <path d="M84 54l5-8 5 8" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M89 46v14" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" />
      {/* Green leaf dot (impact) */}
      <circle cx="32" cy="58" r="5.5" fill="#22C55E" opacity="0.9" />
      {/* VOA text */}
      <text x="60" y="108" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="Inter, system-ui, sans-serif" opacity="0.9" letterSpacing="3">VOA</text>
    </svg>
  );
}
