import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BackButton } from '../../components/BackButton';

export const Route = createFileRoute('/legal/data-processing')({
  component: DataProcessingComponent,
});

function DataProcessingComponent() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Legal & Compliance</p>
      <h1 className="hero__title">Subprocessors & processing description</h1>

      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            <strong>Last updated: 13 September 2026</strong>
          </p>
          <p>
            Companion to the <Link to="/legal/dpa">evaluation DPA</Link>. This list is what is true
            of the product, not a SOC-2 brochure.
          </p>

          <h3>1. Speech</h3>
          <p>
            Room text lives in volatile memory on the room process long enough to deliver. Optional
            voice is a direct WebRTC mesh between browsers. Signaling (session description, ICE) may
            ride the room socket. Audio frames do not. Avelis does not record, caption, or
            transcribe.
          </p>

          <h3>2. Subprocessors</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-4)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--space-2) 0' }}>Party</th>
                <th style={{ padding: 'var(--space-2) 0' }}>Role</th>
                <th style={{ padding: 'var(--space-2) 0' }}>Sees speech?</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) 0' }}>Host (you, or Avelis-operated)</td>
                <td style={{ padding: 'var(--space-3) 0' }}>Compute, Postgres for process records</td>
                <td style={{ padding: 'var(--space-3) 0' }}>No live-room bodies. Ledger and optional minute, until destruction.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) 0' }}>Groq</td>
                <td style={{ padding: 'var(--space-3) 0' }}>
                  Optional inference for the disclosed conflict agent
                </td>
                <td style={{ padding: 'var(--space-3) 0' }}>
                  RAM window of live text while the room is open, if configured. Not stored by Avelis.
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) 0' }}>SMTP provider (if configured)</td>
                <td style={{ padding: 'var(--space-3) 0' }}>One-time invite mail</td>
                <td style={{ padding: 'var(--space-3) 0' }}>Invite code in the message. Not room talk.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-3) 0' }}>STUN (Cloudflare, default)</td>
                <td style={{ padding: 'var(--space-3) 0' }}>NAT for optional mesh voice</td>
                <td style={{ padding: 'var(--space-3) 0' }}>Addresses, not audio.</td>
              </tr>
            </tbody>
          </table>
          <p>
            AWS, Cloudflare DNS, or a mail vendor appear here only when that host actually uses
            them. Do not assume a region or a SOC report from this page.
          </p>

          <h3>3. Incidents</h3>
          <p>
            Historical room talk cannot be exfiltrated from Avelis because it is not kept. Process
            records and facilitator accounts are the remaining surface. Affected hosts will be
            notified within 72 hours of a confirmed incident affecting that surface.
          </p>
        </div>
      </div>
    </div>
  );
}
