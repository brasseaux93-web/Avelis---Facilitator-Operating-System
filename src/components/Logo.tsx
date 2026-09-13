import React from "react";

/** Geometric protocol mark — Hourglass / Ledger Seal representing ephemeral speech and scheduled destruction */
function ProtocolMark({
  className = "",
  accent = "currentColor",
}: {
  className?: string;
  accent?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* Outer bounds / ledger frame */}
      <rect x="6" y="6" width="52" height="52" rx="10" stroke={accent} strokeWidth="4.5" />
      {/* Hourglass geometry */}
      <path
        d="M18 16 L46 16 L32 32 L46 48 L18 48 L32 32 Z"
        stroke={accent}
        strokeWidth="4"
        strokeLinejoin="miter"
      />
      {/* Center focal point */}
      <circle cx="32" cy="32" r="3" fill={accent} />
    </svg>
  );
}

export function LogoLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`logo-lockup ${className}`}>
      <ProtocolMark className="logo-lockup__emblem" accent="currentColor" />
      <span className="logo-lockup__wordmark">AVELIS</span>
    </div>
  );
}

export function VerificationStamp({ className = "" }: { className?: string }) {
  const accent = "var(--color-accent)";
  const ink = "var(--color-text)";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 540 210"
      width="100%"
      height="100%"
      className={className}
      aria-hidden="true"
    >
      <line
        x1="20"
        y1="20"
        x2="520"
        y2="20"
        stroke={accent}
        strokeWidth="2"
        strokeDasharray="6 5"
        opacity="0.85"
      />
      <line
        x1="20"
        y1="190"
        x2="520"
        y2="190"
        stroke={accent}
        strokeWidth="2"
        strokeDasharray="6 5"
        opacity="0.85"
      />

      <g transform="translate(48, 48) scale(1.7)">
        <ProtocolMark accent={accent} />
      </g>

      <g fontFamily="system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', sans-serif">
        <text
          x="195"
          y="105"
          fill={ink}
          fontSize="64"
          fontWeight="700"
          letterSpacing="0.14em"
        >
          AVELIS
        </text>
        <text
          x="197"
          y="155"
          fill={accent}
          fontSize="28"
          fontWeight="600"
          letterSpacing="0.22em"
          opacity="0.95"
        >
          RECEIPT
        </text>
      </g>
    </svg>
  );
}

export { ProtocolMark };
