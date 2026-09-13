import React from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/legal/data-processing')({
  component: DataProcessingComponent,
});

function DataProcessingComponent() {
  return (
    <div className="container" style={{ paddingTop: '160px', paddingBottom: '160px', maxWidth: '800px' }}>
      <p className="section-eyebrow">Legal & Compliance</p>
      <h1 className="hero__title" style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-8)' }}>Data Processing Addendum</h1>
      
      <div className="legal-content" style={{ color: 'var(--color-text-muted)', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <p><strong>Last Updated: September 2026</strong></p>
        <p>This Data Processing Addendum establishes the technical security controls, cryptographic guarantees, and subprocessor whitelist governing the Avelis Facilitator Operating System.</p>
        
        <h3 style={{ color: 'var(--color-text)', marginTop: 'var(--space-4)' }}>1. Cryptographic Zeroization Architecture</h3>
        <p>Avelis utilizes in-memory volatile routing for all real-time session communications. The platform enforces structural zeroization through the following technical mechanisms:</p>
        <ul style={{ paddingLeft: 'var(--space-6)', listStyle: 'circle' }}>
          <li><strong>Memory-Only Processing:</strong> Audio, video, and text payloads are never written to disk, block storage, or database clusters.</li>
          <li><strong>Session Termination Hook:</strong> Upon the facilitator closing the session, or the expiration of the session timer, all active memory buffers allocated to the session are overwritten and destroyed.</li>
          <li><strong>Cryptographic Shredding:</strong> All symmetric session keys used to encrypt traffic in-transit are immediately discarded upon session end, rendering any intercepted traffic mathematically unrecoverable.</li>
        </ul>

        <h3 style={{ color: 'var(--color-text)', marginTop: 'var(--space-4)' }}>2. Approved Subprocessors</h3>
        <p>We restrict our infrastructure dependencies to heavily vetted, SOC 2 Type II certified infrastructure providers to ensure routing stability. Our subprocessors cannot access plaintext session data.</p>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-4)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text)' }}>
              <th style={{ padding: 'var(--space-2) 0' }}>Subprocessor</th>
              <th style={{ padding: 'var(--space-2) 0' }}>Function</th>
              <th style={{ padding: 'var(--space-2) 0' }}>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <td style={{ padding: 'var(--space-3) 0' }}>Amazon Web Services (AWS)</td>
              <td style={{ padding: 'var(--space-3) 0' }}>Volatile Instance Hosting & Routing</td>
              <td style={{ padding: 'var(--space-3) 0' }}>US East (N. Virginia)</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <td style={{ padding: 'var(--space-3) 0' }}>Cloudflare</td>
              <td style={{ padding: 'var(--space-3) 0' }}>DDoS Protection & DNS</td>
              <td style={{ padding: 'var(--space-3) 0' }}>Global</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <td style={{ padding: 'var(--space-3) 0' }}>Postmark</td>
              <td style={{ padding: 'var(--space-3) 0' }}>Transactional Email (Facilitator auth)</td>
              <td style={{ padding: 'var(--space-3) 0' }}>United States</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ color: 'var(--color-text)', marginTop: 'var(--space-4)' }}>3. Incident Response</h3>
        <p>In the event of an infrastructure compromise, Avelis's architecture ensures that historical session communications cannot be exfiltrated because they do not exist. Facilitator account metadata and process ledgers are encrypted at rest (AES-256). In the event of a breach affecting this metadata, affected institutions will be notified within 72 hours.</p>
      </div>
    </div>
  );
}
