const LOGO_URL = 'https://res.cloudinary.com/dvqfrm6rc/image/upload/v1775567811/VOA_LOGO_jriqh6.png';

interface VOALogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  onDark?: boolean;
  plain?: boolean; // kept for API compatibility
}

/**
 * VOA Logo — uses the official Cloudinary-hosted PNG.
 * Works everywhere: sidebar, navbar, loading screen, auth pages, ID card.
 */
export function VOALogo({ size = 36, variant = 'full', onDark = false }: VOALogoProps) {
  const textColor = onDark ? '#FFFFFF' : '#1E3A8A';
  const subColor  = onDark ? 'rgba(255,255,255,0.75)' : '#F97316';

  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_URL}
      alt="VOA Logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  );

  if (variant === 'icon') return mark;

  return (
    <div className="flex items-center gap-2.5 select-none">
      {mark}
      <div className="flex flex-col leading-none">
        <span style={{ color: textColor }} className="font-extrabold text-base tracking-tight">VOA</span>
        <span style={{ color: subColor }} className="font-medium text-[10px] tracking-widest uppercase">Management</span>
      </div>
    </div>
  );
}

/**
 * Inline SVG fallback — used inside html2canvas captures (ID card export)
 * where external images can fail. Kept as a faithful geometric mark.
 */
export function VOALogoSVG({ size = 36, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <circle cx="60" cy="60" r="58" fill="#1E3A8A" />
      <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <circle cx="60" cy="40" r="13" fill="white" opacity="0.95" />
      <path d="M32 84c0-15.464 12.536-28 28-28s28 12.536 28 28" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.95" />
      <path d="M86 56l5-9 5 9" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="91" y1="47" x2="91" y2="62" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="30" cy="60" r="5.5" fill="#22C55E" opacity="0.9" />
      <text x="60" y="110" textAnchor="middle" fill="white" fontSize="13" fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif" opacity="0.9" letterSpacing="3">VOA</text>
    </svg>
  );
}
