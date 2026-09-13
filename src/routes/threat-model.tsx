import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/threat-model')({
  component: ThreatModelComponent,
});

function ThreatModelComponent() {
  return (
    <div className="container" style={{ paddingTop: '160px', paddingBottom: '160px' }}>
      <h1 className="hero__title">Threat & Privilege Architecture</h1>
      <p className="hero__desc" style={{ marginTop: '24px' }}>
        Avelis threat model documentation is available for institutional review.
      </p>
    </div>
  );
}
