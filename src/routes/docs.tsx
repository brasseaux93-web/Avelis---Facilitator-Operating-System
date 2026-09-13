import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/docs')({
  component: DocsComponent,
});

function DocsComponent() {
  return (
    <div className="container" style={{ paddingTop: '160px', paddingBottom: '160px' }}>
      <h1 className="hero__title">Documentation</h1>
      <p className="hero__desc" style={{ marginTop: '24px' }}>
        Avelis platform documentation is available for institutional review.
      </p>
    </div>
  );
}
