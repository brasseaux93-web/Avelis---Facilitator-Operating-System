import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
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
      <h1 className="hero__title">Data Processing Agreement</h1>

      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            <strong>Last updated: 13 September 2026</strong>
          </p>
          <p>
            This is the evaluation DPA. It is not a signed contract until both sides execute it. It
            describes what Avelis actually does with data — not what would sound better in a pitch.
          </p>

          <h3>1. What is processed</h3>
          <ul>
            <li>
              <strong>Facilitator account:</strong> email and credentials for the organization seat.
            </li>
            <li>
              <strong>Invite delivery address:</strong> optional email used only to send a one-time
              code. Wiped when the party joins or the invite is revoked.
            </li>
            <li>
              <strong>Process ledger:</strong> closed-vocabulary lines (opened, invited, tabled,
              agreed, closed). Not quotation. Not a transcript.
            </li>
            <li>
              <strong>Joint minute (optional):</strong> facilitator-authored text, separate from the
              live room. Destroyed at the retention deadline or when wiped.
            </li>
            <li>
              <strong>Destruction receipt:</strong> hashes and timestamps after purge. No speech.
            </li>
          </ul>

          <h3>2. What is not processed</h3>
          <p>
            Live-room messages are delivered to connected clients and dropped. They are not written
            to disk, not logged, and not exported. Optional mesh voice is browser-to-browser.
            Avelis does not receive audio frames. Avelis does not create a transcript, captions, or
            an AI summary of the talk.
          </p>
          <p>
            A shared process clock may be set in RAM. When it elapses, the room does not close and
            no record of speech is written.
          </p>

          <h3>3. The conflict agent</h3>
          <p>
            If inference is configured, a rolling RAM window of live-room text may be sent to Groq
            while the room is open. That path is disclosed to every party before they speak. The
            window is not stored by Avelis and is not a transcript. The agent does not write ledger
            lines.
          </p>

          <h3>4. Retention</h3>
          <p>
            Retention is chosen in draft (0–30 days), locked when the session opens, and enforced.
            After purge, process bodies are gone. The destruction receipt remains. There is no
            undelete.
          </p>

          <h3>5. Subprocessors</h3>
          <p>
            See the <Link to="/legal/data-processing">subprocessor list</Link>. Material changes
            will be noticed 30 days in advance where the relationship is executed.
          </p>

          <h3>6. What we will not say</h3>
          <p>
            Avelis does not claim attorney–client privilege, subpoena immunity, or that a court
            cannot order a facilitator to testify. We claim this: we cannot produce a transcript we
            never made.
          </p>

          <div className="legal-document__note">
            <p style={{ margin: 0 }}>
              For counsel: this page is the packet you can send tomorrow. Execute a bilateral DPA
              before production traffic. Tyler Brasseaux, founder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
