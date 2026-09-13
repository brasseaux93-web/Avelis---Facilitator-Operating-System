import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BackButton } from '../components/BackButton';

export const Route = createFileRoute('/evaluation')({
  component: EvaluationComponent,
});

function EvaluationComponent() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Resources</p>
      <h1 className="hero__title">Institutional Evaluation</h1>
      
      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            This module is currently in private preview. 
          </p>
          <p>
            To evaluate Avelis for your institution, please return to the homepage to request facilitator access. Institutional evaluation requires a formal DPA review and infrastructure vetting.
          </p>
        </div>
      </div>
    </div>
  );
}
