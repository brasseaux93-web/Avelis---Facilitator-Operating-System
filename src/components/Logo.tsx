import React from "react";

/** Geometric protocol mark — flanking rules + open A. Not a lock or shield. */
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
      {/* Flanking ledger rules */}
      <rect x="4" y="8" width="5" height="48" rx="0.5" fill={accent} />
      <rect x="55" y="8" width="5" height="48" rx="0.5" fill={accent} />
      {/* Geometric A — open aperture, not a vault */}
      <path
        d="M20 52 L32 12 L44 52"
        stroke={accent}
        strokeWidth="4.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M25 36 H39"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function LogoLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`logo-lockup ${className}`}>
      <ProtocolMark className="logo-lockup__emblem" accent="var(--color-accent-solid, #5AAAB0)" />
      <span className="logo-lockup__wordmark">AVELIS</span>
    </div>
  );
}

export function VerificationStamp({ className = "" }: { className?: string }) {
  const accent = "var(--color-accent-solid, #5AAAB0)";
  const ink = "var(--color-text, #F4F0E8)";
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
