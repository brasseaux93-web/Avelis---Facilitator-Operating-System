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
      <h1 className="hero__title">Threat model</h1>

      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            Privacy here means non-persistence of speech, least privilege, and a security audit
            store that is not the party-visible ledger. This is not a claim of legal privilege,
            host-operator immunity, or protection for data still inside a retention window.
          </p>

          <h3>What we protect</h3>
          <ul>
            <li>Live room speech — must not persist on disk, in logs, or in a transcript.</li>
            <li>Process ledger and joint-minute bodies — bounded retention, then destruction.</li>
            <li>Facilitator credentials and HMAC room tokens.</li>
            <li>Destruction receipts and restricted security-audit events.</li>
          </ul>

          <h3>Primary threats</h3>
          <table className="sessions-table">
            <thead>
              <tr>
                <th>Threat</th>
                <th>Direction</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Logging or analytics capturing speech</td>
                <td>Startup guards; structured logs without bodies</td>
              </tr>
              <tr>
                <td>Room state on disk or swap</td>
                <td>No room volume; memory-only process</td>
              </tr>
              <tr>
                <td>Weak or placeholder room secret</td>
                <td>Refuse production start</td>
              </tr>
              <tr>
                <td>Raw shared secret used as a room token</td>
                <td>Rejected always; HMAC only</td>
              </tr>
              <tr>
                <td>Backup resurrecting purged bodies</td>
                <td>Purge-aware restore policy</td>
              </tr>
              <tr>
                <td>Mixing security telemetry into the party ledger</td>
                <td>Separate security_audit_events with timed purge</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
