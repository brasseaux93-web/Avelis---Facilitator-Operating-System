import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BackButton } from '../components/BackButton';

export const Route = createFileRoute('/docs')({
  component: DocsComponent,
});

function DocsComponent() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Resources</p>
      <h1 className="hero__title">Documentation</h1>
      
      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            Avelis platform documentation is currently available exclusively for institutional review. 
            If you are an evaluator, please refer to the onboarding materials provided by your implementation engineer.
          </p>
        </div>
      </div>
    </div>
  );
}
