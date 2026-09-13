import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BackButton } from '../components/BackButton';
import './sessions.css';

export const Route = createFileRoute('/materials')({
  component: MaterialsPage,
});

const FILES = [
  {
    href: '/downloads/Avelis-Pitch-Decks-2026-09.zip',
    name: 'All decks (zip)',
    note: 'Investor, evaluation, financials, one-pager, chart system.',
  },
  {
    href: '/downloads/Avelis-Investor-Deck-2026-09.pptx',
    name: 'Investor deck',
    note: 'Confidential. Native PowerPoint charts. Speaker notes included.',
  },
  {
    href: '/downloads/Avelis-Institutional-Evaluation-2026-09.pptx',
    name: 'Institutional evaluation',
    note: 'For counsel and hosts. Not a consumer pitch.',
  },
  {
    href: '/downloads/Avelis-Financial-Appendix-2026-09.pptx',
    name: 'Financial appendix',
    note: 'Five-year cases. Editable charts.',
  },
  {
    href: '/downloads/Avelis-One-Pager-2026-09.pptx',
    name: 'One-pager',
    note: 'Leave-behind.',
  },
  {
    href: '/legal/dpa-packet.md',
    name: 'DPA packet (markdown)',
    note: 'Send to counsel. Groq named as RAM inference. Not a signed contract.',
  },
  {
    href: '/legal/loi-mediator.md',
    name: 'Mediator LOI (markdown)',
    note: 'Non-binding 90-day design-partner letter. Print to letterhead.',
  },
];

function MaterialsPage() {
  return (
    <div className="legal-document">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <BackButton />
      </div>
      <p className="section-eyebrow">Materials</p>
      <h1 className="hero__title">Download the decks here</h1>
      <p className="section-desc" style={{ maxWidth: '40rem' }}>
        Files are served from this site. Use the button — they are PowerPoint, not web slides.
      </p>
      <div className="legal-document__surface">
        <div className="legal-document__content">
          <ul className="duality__list" role="list">
            {FILES.map((f) => (
              <li key={f.href} className="duality__item" style={{ marginBottom: 'var(--space-4)' }}>
                <a className="btn btn--primary" href={f.href} download>
                  {f.name}
                </a>
                <p className="sessions-page__subtitle" style={{ marginTop: 'var(--space-2)' }}>
                  {f.note}
                </p>
              </li>
            ))}
          </ul>
          <p>
            Also: <Link to="/partners">design-partner kit</Link> · <Link to="/legal/dpa">DPA</Link> ·{' '}
            <Link to="/legal/data-processing">subprocessors</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
