import React from 'react';

/**
 * Unsealed chamber: two ledger bars, an open threshold, one vertical presence.
 * Parties on the sides. Avelis in the opening. The room does not close into a file.
 */
function ProtocolMark({
  className = '',
  accent = 'currentColor',
  width,
  height,
}: {
  className?: string;
  accent?: string;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect x="6" y="8" width="8" height="48" fill={accent} />
      <rect x="50" y="8" width="8" height="48" fill={accent} />
      <path
        d="M22 50 V16 H42 V50"
        stroke={accent}
        strokeWidth="5"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <rect x="30.5" y="30" width="3.5" height="20" fill={accent} />
    </svg>
  );
}

export function LogoLockup({ className = '' }: { className?: string }) {
  return (
    <div className={`logo-lockup ${className}`}>
      <ProtocolMark className="logo-lockup__emblem" accent="currentColor" />
      <span className="logo-lockup__wordmark">AVELIS</span>
    </div>
  );
}

export function VerificationStamp({ className = '' }: { className?: string }) {
  const accent = 'var(--color-accent)';
  const ink = 'var(--color-text)';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 540 210"
      width="100%"
      height="100%"
      className={className}
      aria-hidden="true"
    >
      <line x1="20" y1="20" x2="520" y2="20" stroke={accent} strokeWidth="2" strokeDasharray="6 5" opacity="0.85" />
      <line x1="20" y1="190" x2="520" y2="190" stroke={accent} strokeWidth="2" strokeDasharray="6 5" opacity="0.85" />
      <g transform="translate(48, 48) scale(1.7)">
        <ProtocolMark accent={accent} width="64" height="64" />
      </g>
      <g fontFamily="system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif">
        <text x="195" y="105" fill={ink} fontSize="64" fontWeight="700" letterSpacing="0.14em">
          AVELIS
        </text>
        <text x="197" y="155" fill={accent} fontSize="28" fontWeight="600" letterSpacing="0.22em" opacity="0.95">
          RECEIPT
        </text>
      </g>
    </svg>
  );
}

export { ProtocolMark };
