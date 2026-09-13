import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BackButton } from '../components/BackButton';

export const Route = createFileRoute('/partners')({
  component: PartnersPage,
});

function PartnersPage() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Design partners</p>
      <h1 className="hero__title">Three hosts. Real sessions. No consumer loop.</h1>

      <div className="legal-document__surface">
        <div className="legal-document__content">
          <p>
            Avelis does not need a waitlist. It needs two or three facilitators who will run an
            actual difficult conversation on it and say whether the chamber held. Tyler Brasseaux
            is the only operator. This page is the packet you send them.
          </p>

          <h3>Who</h3>
          <ol>
            <li>A boutique ADR / mediation practice (employment or commercial).</li>
            <li>A corporate ombuds or employee-relations facilitation office.</li>
            <li>A campus or institutional ombuds (optional third).</li>
          </ol>
          <p>Not a consumer mediation app. Not a panel of strangers. Named hosts.</p>

          <h3>What they get (90 days, no invoice)</h3>
          <ul>
            <li>One organization seat. Invite-only parties. No standing participant accounts.</li>
            <li>DPA review and a destruction-receipt walkthrough before the first session.</li>
            <li>Live room with disclosed agent, RAM caucus, process clock, optional mesh voice.</li>
            <li>Tyler on call for the first three sessions. Not a helpdesk. A founder in the booth.</li>
          </ul>

          <h3>What we ask</h3>
          <ul>
            <li>Three real sessions on their matter type — not a demo script.</li>
            <li>Written notes: what they would not run on Zoom, and what still failed.</li>
            <li>If it holds, a letter of intent for a paid year at practice ($14.4k) or firm ($54k) terms.</li>
          </ul>

          <h3>Letter of intent</h3>
          <p>
            Full template for letterhead:{' '}
            <a href="/legal/loi-mediator.md" download>
              loi-mediator.md
            </a>
            . Attach the{' '}
            <a href="/legal/dpa-packet.md" download>
              DPA packet
            </a>
            . Non-binding. Ninety days. Three real sessions. No fee. Intent to convert at practice
            or firm rates if the chamber holds. Not a purchase order, not exclusivity, not privilege.
          </p>

          <h3>What we refuse in the trial</h3>
          <ul>
            <li>Persistent transcripts, captions, or AI summaries of the talk.</li>
            <li>Party accounts, a directory, or settlement scoring.</li>
            <li>Recording. If they need a file, they are in the wrong product.</li>
          </ul>

          <p>
            Start at <Link to="/evaluation">evaluation</Link>. Counsel: <Link to="/legal/dpa">DPA</Link>.
            Decks: <Link to="/materials">materials</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
