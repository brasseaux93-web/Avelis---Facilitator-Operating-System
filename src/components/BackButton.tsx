import React from 'react';
import { Link } from '@tanstack/react-router';

interface BackButtonProps {
  to?: string;
  label?: string;
}

export function BackButton({ to = '/', label = 'Back' }: BackButtonProps) {
  return (
    <Link to={to} className="back-button" aria-label={label}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
