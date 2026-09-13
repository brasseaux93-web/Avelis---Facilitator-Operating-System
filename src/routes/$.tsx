import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BackButton } from '../components/BackButton';

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Not found</p>
      <h1 className="hero__title">That path is not an Avelis surface.</h1>
      <p className="section-desc">
        If you were given an invite, use <Link to="/join">join</Link>. Facilitators sign in at{' '}
        <Link to="/auth">auth</Link>.
      </p>
    </div>
  );
}
