import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
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
      <h1 className="hero__title">How Avelis works</h1>

      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            Avelis is a facilitator operating system. The object is a session: an ephemeral room,
            a closed-vocabulary process ledger, and an optional joint minute that dies on a clock
            you set.
          </p>
          <h3>What to read first</h3>
          <ul>
            <li>
              <a href="/#principles">Product laws</a> — speech is ephemeral; the ledger is process,
              not quotation.
            </li>
            <li>
              <Link to="/threat-model">Threat model</Link> — what we defend, and what we do not claim.
            </li>
            <li>
              <Link to="/legal/privacy">Privacy</Link> and <Link to="/legal/dpa">DPA template</Link>{' '}
              — operator data vs participant speech.
            </li>
          </ul>
          <h3>Two doors</h3>
          <p>
            Facilitators sign in with a provisioned work account and run a management console.
            Participants redeem a one-time invite. They never create an account. The only join path
            is invite redeem.
          </p>
          <p>
            Institutional evaluation packets and runbooks are still issued by implementation
            engineers. This page is the public map, not a substitute for a DPA review.
          </p>
        </div>
      </div>
    </div>
  );
}
