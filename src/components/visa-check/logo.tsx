// VisaCheck brand mark — shield + checkmark. Teal on transparent.
// Used both as inline React in the header AND as the source SVG for the PNG icons.

import { cn } from '@/lib/utils';

export function VisaCheckLogo({
  className,
  size = 28,
  title = 'VisaCheck',
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={title}
      className={cn('inline-block', className)}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="vc-shield-grad" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      {/* Shield outline */}
      <path
        d="M32 3 L57 12 V31 C57 47 46.5 56.5 32 61 C17.5 56.5 7 47 7 31 V12 Z"
        fill="url(#vc-shield-grad)"
      />
      {/* Inner shield highlight */}
      <path
        d="M32 8 L52 15 V31 C52 44 43.5 52 32 56 C20.5 52 12 44 12 31 V15 Z"
        fill="#0f766e"
        opacity="0.45"
      />
      {/* Checkmark */}
      <path
        d="M23 32.5 L29.5 39 L42 25.5"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Raw SVG string used by icon generation scripts (kept here for reference / audits).
export const VISA_CHECK_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="g" x1="32" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0d9488"/>
    </linearGradient>
  </defs>
  <path d="M32 3 L57 12 V31 C57 47 46.5 56.5 32 61 C17.5 56.5 7 47 7 31 V12 Z" fill="url(#g)"/>
  <path d="M32 8 L52 15 V31 C52 44 43.5 52 32 56 C20.5 52 12 44 12 31 V15 Z" fill="#0f766e" opacity="0.45"/>
  <path d="M23 32.5 L29.5 39 L42 25.5" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
