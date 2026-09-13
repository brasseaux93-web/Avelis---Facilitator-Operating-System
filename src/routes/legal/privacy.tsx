import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BackButton } from '../../components/BackButton';

export const Route = createFileRoute('/legal/privacy')({
  component: PrivacyComponent,
});

function PrivacyComponent() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Legal & Compliance</p>
      <h1 className="hero__title">Privacy Policy</h1>
      
      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p><strong>Last Updated: September 2026</strong></p>
          <p>Avelis is architected around a singular mandate: zero retention of communication contents. Our privacy posture relies on mathematical and infrastructural guarantees rather than policy promises. If data is not collected, it cannot be leaked, sold, or produced under subpoena.</p>
          
          <h3>1. What We Do Not Collect</h3>
          <p>In adherence to our core principles, we do <strong>not</strong> collect, process, or store:</p>
          <ul>
            <li>Audio or video streams (these are routed ephemerally in volatile memory).</li>
            <li>In-session text chat (cryptographically zeroized upon session termination).</li>
            <li>Participant names, phone numbers, or social profiles (identity is handled via ephemeral role classes).</li>
            <li>Device fingerprints, advertising identifiers, or cross-site tracking cookies.</li>
          </ul>

          <h3>2. What We Collect (Minimum Data)</h3>
          <p>We collect only the minimum data strictly necessary to provide the service and maintain the process ledger:</p>
          <ul>
            <li><strong>Facilitator Account Data:</strong> Email address for authentication and billing.</li>
            <li><strong>Process Ledgers:</strong> Procedural metadata (e.g., timestamps, closed-vocabulary event tags like "Session Opened"). Ledgers are retained only for the duration set by the facilitator (0-30 days) before automatic permanent deletion.</li>
            <li><strong>Transient Connection Data:</strong> IP addresses and WebSocket tokens are kept in volatile memory strictly for the duration of the active connection and are purged immediately upon disconnect.</li>
          </ul>

          <h3>3. AI & process copilot</h3>
          <p>
            Avelis does not send live-room speech, audio, or transcripts to a model. A facilitator-only
            process copilot may rank next process actions from the process ledger. Prompts and
            completions are memory-only. We do not train models on Avelis content. No model writes
            a ledger line.
          </p>
        </div>
      </div>
    </div>
  );
}
