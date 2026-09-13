import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BackButton } from '../components/BackButton';

export const Route = createFileRoute('/threat-model')({
  component: ThreatModelComponent,
});

function ThreatModelComponent() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Architecture</p>
      <h1 className="hero__title">Threat & Privilege Architecture</h1>
      
      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            Avelis threat model documentation is available for institutional review. 
            This document outlines our approach to zero-knowledge routing, ephemeral buffer memory, and cryptographic destruction of process keys.
          </p>
          <p>
            If you are an institutional evaluator, please contact your implementation engineer for the full whitepaper and architectural review guide.
          </p>
        </div>
      </div>
    </div>
  );
}
