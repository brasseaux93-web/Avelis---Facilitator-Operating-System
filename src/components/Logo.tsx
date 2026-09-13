import React from "react";

export function LogoLockup({ className = "" }: { className?: string }) {
  return (
    <div className={`logo-lockup ${className}`}>
      {/* Emblem */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 220 230" 
        className="logo-lockup__emblem"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="28" height="230" fill="#CF9E42" />
        <rect x="192" y="0" width="28" height="230" fill="#CF9E42" />
        <path d="
          M 95,190 
          L 58,190 
          L 58,40 
          L 162,40 
          L 162,190 
          L 125,190
        " fill="none" stroke="#CF9E42" strokeWidth="15" strokeLinecap="square" strokeLinejoin="miter"/>
      </svg>
      {/* Wordmark */}
      <span className="logo-lockup__wordmark">AVELIS</span>
    </div>
  );
}

export function VerificationStamp({ className = "" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 210" width="100%" height="100%" className={className}>
      <line x1="20" y1="20" x2="520" y2="20" stroke="#CF9E42" strokeWidth="2.5" strokeDasharray="7 5" opacity="0.85" />
      <line x1="20" y1="190" x2="520" y2="190" stroke="#CF9E42" strokeWidth="2.5" strokeDasharray="7 5" opacity="0.85" />
      
      <g transform="translate(38, 30) scale(0.6)">
        <rect x="0" y="0" width="28" height="230" fill="#CF9E42" />
        <rect x="192" y="0" width="28" height="230" fill="#CF9E42" />
        <path d="
          M 95,190 
          L 58,190 
          L 58,40 
          L 162,40 
          L 162,190 
          L 125,190
        " fill="none" stroke="#CF9E42" strokeWidth="15" strokeLinecap="square" strokeLinejoin="miter"/>
      </g>

      <g fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">
        <text 
          x="195" 
          y="105" 
          fill="#F6F3EC"
          fontSize="64" 
          fontWeight="700" 
          letterSpacing="0.14em">AVELIS</text>
        <text 
          x="197" 
          y="155" 
          fill="#CF9E42"
          fontSize="34" 
          fontWeight="600" 
          letterSpacing="0.28em" 
          opacity="0.95">VERIFIED</text>
      </g>
    </svg>
  );
}
