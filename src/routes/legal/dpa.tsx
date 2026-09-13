import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { BackButton } from '../../components/BackButton';

export const Route = createFileRoute('/legal/dpa')({
  component: DpaComponent,
});

function DpaComponent() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Legal & Compliance</p>
      <h1 className="hero__title">Data Processing Agreement (DPA)</h1>
      
      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p><strong>Last Updated: September 2026</strong></p>
          <p>This Data Processing Agreement ("DPA") governs the processing of personal data by Avelis ("Processor") on behalf of the institutional customer ("Controller"). This document is provided as boilerplate and must be customized and executed bilaterally during institutional onboarding.</p>
          
          <h3>1. Nature of Processing & Zero Retention</h3>
          <p>Avelis provides an ephemeral dispute resolution infrastructure. The Controller acknowledges and agrees that the Processor is architecturally restricted from persisting communication contents (audio, video, text messages) beyond the active duration of a session.</p>
          <p>All in-room communications are processed entirely in volatile memory (RAM) and are cryptographically zeroized upon session termination. Consequently, Avelis cannot process, store, or produce transcripts of session communications.</p>

          <h3>2. Types of Personal Data</h3>
          <p>In accordance with Product Law L7 (Minimum Data), the Processor will process only the following data types:</p>
          <ul>
            <li>Facilitator account credentials (email).</li>
            <li>Ephemeral connection metadata (IP addresses, WebSocket tokens) strictly for routing, discarded after connection termination.</li>
            <li>The Process Ledger, containing only structural metadata (e.g., timestamps, closed-vocabulary event tags).</li>
          </ul>
          <p>The Controller agrees not to submit highly sensitive PII (e.g., health data, SSNs) into the process ledger titles or event notes.</p>

          <h3>3. Subprocessors</h3>
          <p>Avelis maintains a strict whitelist of infrastructure subprocessors required to route encrypted ephemeral data. A complete list is available in the <a href="/legal/data-processing">Data Processing</a> addendum. The Controller will be notified 30 days prior to any subprocessor changes.</p>

          <div className="legal-document__note">
            <p style={{ margin: 0 }}><strong>Note for Legal Counsel:</strong> This boilerplate enforces the non-discoverable nature of the platform. By signing, the Controller legally acknowledges that Avelis lacks the technical capacity to produce communication records under subpoena.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
