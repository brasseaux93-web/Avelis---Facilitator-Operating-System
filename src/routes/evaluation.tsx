import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/evaluation')({
  component: EvaluationComponent,
});

function EvaluationComponent() {
  return (
    <div className="container" style={{ paddingTop: '160px', paddingBottom: '160px' }}>
      <h1 className="hero__title">Request Institutional Evaluation</h1>
      <p className="hero__desc" style={{ marginTop: '24px' }}>
        This module is currently in private preview. Please return to the homepage to request access.
      </p>
    </div>
  );
}
