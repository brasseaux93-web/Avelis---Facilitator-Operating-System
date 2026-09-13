import React, { useEffect, useState } from 'react';
import { LogoLockup, VerificationStamp } from '../components/Logo';

import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    document.documentElement.classList.add('reveal-enabled');
    const revealElements = document.querySelectorAll('[data-reveal]');
    
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
      });

      revealElements.forEach((el) => {
        revealObserver.observe(el);
      });

      return () => {
        revealElements.forEach((el) => {
          revealObserver.unobserve(el);
        });
      };
    } else {
      revealElements.forEach((el) => {
        el.classList.add('is-visible');
      });
    }
  }, []);

  return (
    <>
    {/* Hero */}
    <section className="hero" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero__grid">
          <div className="hero__content">
            <p className="hero__eyebrow">INSTITUTIONAL DISPUTE INFRASTRUCTURE</p>
            <h1 className="hero__title" id="hero-title">
              The institutional safe harbor for talks that cannot risk discovery.
            </h1>
            <p className="hero__body">
              Avelis provides an ephemeral operating system for dispute resolution, ombuds shuttle diplomacy, and sensitive negotiations. Total evidentiary immunity for what was said. Complete process accountability for how it was conducted.
            </p>
            <div className="hero__actions">
              <Link to="/evaluation" className="btn btn--primary btn--lg">Request Institutional Evaluation</Link>
              <Link to="/threat-model" className="btn btn--secondary btn--lg">Review Threat &amp; Privilege Architecture</Link>
            </div>

            {/* IOA Assurance block */}
            <div className="hero__ioa-block">
              <span className="hero__ioa-header">IOA Standards Compliant // Privilege Preservation</span>
              <p className="hero__ioa-text">
                Engineered to satisfy International Ombuds Association standards of neutrality, informality, and absolute confidentiality. Memory zeroization prevents discovery spoliation claims.
              </p>
              <div className="hero__ioa-badges">
                <span className="hero__ioa-badge">L1 Speech is Ephemeral</span>
                <span className="hero__ioa-badge">L5 Destruction is Feature</span>
              </div>
            </div>
          </div>

          {/* Ledger mockup — centered in right column */}
          <div className="hero__visual-wrap">
            <div className="hero__visual" aria-label="Example facilitator process ledger showing closed vocabulary lines">
              <div className="process-ledger-card">
              <div className="process-ledger-card__header">
                <span className="process-ledger-card__title">Session · Process Ledger</span>
                <span className="process-ledger-card__status">
                  <span className="process-ledger-card__status-dot"></span>
                  Closed
                </span>
              </div>
              <div className="process-ledger-card__body">

                {/* SESSION OPENED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">09:14</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Session Opened</span>
                    <span className="ledger-detail">retention: 72h</span>
                  </div>
                </div>

                {/* PARTY INVITED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">09:15</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Party Invited</span>
                    <span className="ledger-detail">class: role-only</span>
                  </div>
                </div>

                {/* PARTY JOINED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">09:17</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Party Joined</span>
                  </div>
                </div>

                {/* ITEM TABLED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">09:22</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Item Tabled</span>
                  </div>
                </div>

                {/* CAUCUS CREATED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">09:28</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Caucus Created</span>
                  </div>
                </div>

                {/* MARKED AGREED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">09:45</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Marked Agreed</span>
                  </div>
                </div>

                {/* MINUTE DRAFTED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">10:02</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Minute Drafted</span>
                  </div>
                </div>

                {/* SESSION CLOSED */}
                <div className="ledger-row">
                  <div className="ledger-ts-col">10:14</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action">Session Closed</span>
                  </div>
                </div>

                {/* DESTRUCTION ATTESTED — dashed divider row */}
                <div className="ledger-row ledger-row--destroy">
                  <div className="ledger-ts-col">10:14</div>
                  <div className="ledger-content-col">
                    <span className="ledger-action ledger-action--stamped">Destruction Attested</span>
                    <span className="ledger-detail ledger-detail--attest">
                      SHA-256 Memory Zeroization Receipt generated<br/>Architectural Inability to Comply Certificate generated<br/>Speech Purge: Verified at Memory Level (0 Bytes Persisted)
                    </span>
                    <div className="destruction-seal" aria-hidden="true">
                      <VerificationStamp />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Primary Buyers Grid (replaces Audience section) */}
        <div className="hero-buyers" id="audience">
          <div className="hero-buyer-card">
            <h3 className="hero-buyer-title">University &amp; IO Ombuds Offices</h3>
            <p className="hero-buyer-desc">Statutory Privilege &amp; Discovery Protection. Built to defend IOA standards against subpoena exposure.</p>
          </div>
          <div className="hero-buyer-card">
            <h3 className="hero-buyer-title">Enterprise HR &amp; Employee Relations</h3>
            <p className="hero-buyer-desc">Early Intervention Triage. Eliminates unencrypted chat vulnerability during sensitive workplace dispute resolution.</p>
          </div>
          <div className="hero-buyer-card">
            <h3 className="hero-buyer-title">Sovereign &amp; Track 1.5/II Conclaves</h3>
            <p className="hero-buyer-desc">Pre-Treaty Bilateral Sanctuaries. Securing back-channel credibility through cryptographic destruction.</p>
          </div>
          <div className="hero-buyer-card">
            <h3 className="hero-buyer-title">Corporate Governance, ADR &amp; Boards</h3>
            <p className="hero-buyer-desc">High-Stakes Severance &amp; Caucus Bargaining. For C-suite disputes and executive sidebars where Slack discovery triggers liability.</p>
          </div>
        </div>
      </div>
    </section>

    {/* Who It's For */}


    {/* What it is / is not */}
    <section className="duality" aria-labelledby="duality-title" data-reveal>
      <div className="container">
        <h2 className="sr-only" id="duality-title">What Avelis is and is not</h2>
        <div className="duality__grid">
          <div className="duality__col duality__col--is">
            <p className="duality__label duality__label--is">Avelis is</p>
            <ul className="duality__list" role="list">
              <li className="duality__item">
                <span className="duality__item-mark duality__item-mark--is">+</span>
                An evidentiary firewall for multi-track negotiation
              </li>
              <li className="duality__item">
                <span className="duality__item-mark duality__item-mark--is">+</span>
                A session containing an ephemeral room, a process ledger, an optional joint minute, and an optional issue map
              </li>
              <li className="duality__item">
                <span className="duality__item-mark duality__item-mark--is">+</span>
                A cryptographic, party-verified process ledger (invitations, identity classes, tabled agenda items, mutual initialing)
              </li>
              <li className="duality__item">
                <span className="duality__item-mark duality__item-mark--is">+</span>
                An immutable proof of procedural fairness with absolute speech zeroization
              </li>
            </ul>
          </div>
          <div className="duality__col duality__col--is-not">
            <p className="duality__label duality__label--is-not">Avelis is not</p>
            <ul className="duality__list" role="list">
              <li className="duality__item duality__item--muted">
                <span className="duality__item-mark duality__item-mark--is-not">&minus;</span>
                Not a subpoena-compliant communication archive
              </li>
              <li className="duality__item duality__item--muted">
                <span className="duality__item-mark duality__item-mark--is-not">&minus;</span>
                Not a discovery liability
              </li>
              <li className="duality__item duality__item--muted">
                <span className="duality__item-mark duality__item-mark--is-not">&minus;</span>
                Not an AI surveillance, sentiment extraction, or transcription vendor
              </li>
              <li className="duality__item duality__item--muted">
                <span className="duality__item-mark duality__item-mark--is-not">&minus;</span>
                Not a case-management, investigation, or whistleblowing system
              </li>
              <li className="duality__item duality__item--muted">
                <span className="duality__item-mark duality__item-mark--is-not">&minus;</span>
                Not a social network, public membership space, or forum
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Core Principles (Product Laws) */}
    <section className="principles" id="principles" aria-labelledby="principles-title" data-reveal>
      <div className="container">
        <div className="principles__header">
          <p className="section-eyebrow">Product Laws</p>
          <h2 className="section-title" id="principles-title">Confidentiality applies to content. Accountability applies to process.</h2>
          <p className="section-desc">
            Avelis exists on that seam. These laws are non-negotiable. If a feature conflicts with them, the feature is wrong.
          </p>
        </div>

        <div className="principles__list">
          <article className="principle principle--flagship">
            <p className="principle__code"><span>L1 — Speech is ephemeral</span></p>
            <h3 className="principle__title">The room does not persist</h3>
            <p className="principle__desc">
              Room messages and live media are memory-only for the session. When the session closes,
              speech is gone. No scrollback after close. No recording. No transcript. No save.
            </p>
          </article>

          <article className="principle">
            <p className="principle__code">L2 — The ledger is process, not speech</p>
            <h3 className="principle__title">A closed vocabulary of process lines</h3>
            <p className="principle__desc">
              Session opened. Party invited. Item tabled. Marked agreed, parked, or refused.
              Minute drafted. Destruction attested. Never quotes, paraphrases, sentiment, or
              facilitator notes about a person.
            </p>
          </article>

          <article className="principle">
            <p className="principle__code">L3 — The facilitator authors the ledger</p>
            <h3 className="principle__title">No model writes a ledger line unattended</h3>
            <p className="principle__desc">
              If assistive text exists later, it may only propose a line the facilitator edits
              and accepts. Default is no generation. v1 has no AI.
            </p>
          </article>

          <article className="principle">
            <p className="principle__code">L4 — Identity is a class, not a profile</p>
            <h3 className="principle__title">Named, role-only, affiliation-only, or unnamed</h3>
            <p className="principle__desc">
              No standing social profile. No follower graph. No cross-session participant
              directory visible to other parties. The facilitator's address book is private.
            </p>
          </article>

          <article className="principle">
            <p className="principle__code">L5 — Destruction is a feature</p>
            <h3 className="principle__title">Every session has an explicit end</h3>
            <p className="principle__desc">
              End means: speech gone, optional minute exported, ledger retained only for the
              retention window the facilitator set at open. Default 72 hours after close,
              configurable 0 to 30 days. A destruction receipt is written. There is no undelete.
            </p>
          </article>

          <article className="principle">
            <p className="principle__code">L6 — The Facilitator Controls the Boundary</p>
            <h3 className="principle__title">No one joins uninvited</h3>
            <p className="principle__desc">
              The room is a secure boundary. The facilitator controls invitations, room locks, and party ejections. No one can lurk or join silently.
            </p>
          </article>

          <article className="principle">
            <p className="principle__code">L7 — Minimum data</p>
            <h3 className="principle__title">Collect only what the process requires</h3>
            <p className="principle__desc">
              No immigration status, no health data, no HRIS sync, no government ID in v1.
              Attachments are process artifacts — an agenda, a signed minute — not evidence lockers.
            </p>
          </article>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="how-it-works" id="how-it-works" aria-labelledby="hiw-title" data-reveal>
      <div className="container">
        <div className="how-it-works__header">
          <p className="section-eyebrow">Session Model</p>
          <h2 className="section-title" id="hiw-title">From session open to destruction attestation</h2>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step__number"><span className="step__line"></span></div>
            <h3 className="step__title">Create session</h3>
            <p className="step__desc">
              Set a process title. Set the retention window. Invite parties by link and
              one-time code.
            </p>
          </div>
          <div className="step">
            <div className="step__number"><span className="step__line"></span></div>
            <h3 className="step__title">Identity and room</h3>
            <p className="step__desc">
              Each party picks an identity class at join. The live room is ephemeral —
              text minimum, audio if stable.
            </p>
          </div>
          <div className="step">
            <div className="step__number"><span className="step__line"></span></div>
            <h3 className="step__title">Ledger and agenda</h3>
            <p className="step__desc">
              The facilitator writes process lines from a closed vocabulary. Agenda items
              are tabled, reordered, marked agreed, parked, or refused.
            </p>
          </div>
          <div className="step">
            <div className="step__number"><span className="step__line"></span></div>
            <h3 className="step__title">Bilateral Attestation &amp; Redline Lock</h3>
            <p className="step__desc">
              Mutual digital initialing via ephemeral session keys, generating a joint PDF that self-destructs from servers upon dual party download. Generates an exportable, counsel-ready Subpoena Affidavit Kit certifying statutory confidentiality.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Threat Model (social proof) */}
    <section className="threat-model" id="threat-model" aria-labelledby="tm-title" data-reveal>
      <div className="container">
        <div className="threat-model__grid">
          <div>
            <p className="section-eyebrow">Threat Model</p>
            <h2 className="section-title" id="tm-title">Engineered specifically to defeat discovery, breaches, and compelled testimony.</h2>
            <p className="section-desc">
              The technological zero-retention architecture transforms the legal question from <em>“Will you hand over the transcripts?”</em> to <em>“The records physically do not exist to produce.”</em>
            </p>
          </div>
          <ul className="threat-model__commitments" role="list">
            <li className="commitment">
              <svg className="commitment__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
              <p className="commitment__text"><strong>Speech never written to disk or object storage.</strong> Room messages exist in memory only for the duration of the session.</p>
            </li>
            <li className="commitment">
              <svg className="commitment__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
              <p className="commitment__text"><strong>Ledger and minutes are the only persisted bodies.</strong> Encrypted at rest.</p>
            </li>
            <li className="commitment">
              <svg className="commitment__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
              <p className="commitment__text"><strong>No training of models on any Avelis content, ever.</strong> No AI in v1. If assistance appears later, it cannot write what people said or what they meant.</p>
            </li>
            <li className="commitment">
              <svg className="commitment__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
              <p className="commitment__text"><strong>No subpoena-friendly recovery.</strong> The truthful answer to "can you recover the chat?" is: speech was not retained.</p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    {/* Privacy-First Contact Form */}
    <section className="section" id="contact" aria-labelledby="contact-title" data-reveal>
      <div className="container">
        <div className="cta-form">
          <div className="cta-form__grid">
            <div className="cta-form__intro">
              <h2 id="contact-title">Request facilitator access</h2>
              <p>
                This form collects only what is needed to respond. No name, no phone, no
                company size, no job title. The product follows its own law: minimum data,
                retained only for the purpose stated.
              </p>
              <ul className="cta-form__principles" role="list">
                <li className="cta-form__principle">
                  <svg className="cta-form__principle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                  </svg>
                  Email is used only to respond to this request
                </li>
                <li className="cta-form__principle">
                  <svg className="cta-form__principle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                  </svg>
                  No name, phone, company, or job title collected
                </li>
                <li className="cta-form__principle">
                  <svg className="cta-form__principle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
                  </svg>
                  Form follows product law L7: minimum data
                </li>
              </ul>
            </div>

            <div className="form-wrapper">
              {!isSuccess ? (
                <form className="form" id="access-form" aria-label="Request facilitator access form" onSubmit={handleAccessRequest}>
                  {formError && (
                    <div className="form__error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }} role="alert">
                      {formError}
                    </div>
                  )}
                  
                  {/* Honeypot field - hidden from real users */}
                  <input type="text" name="bot_field" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />
                  
                  <div className="form__field">
                    <label htmlFor="email" className="form__label">
                      Facilitator email <span className="form__label-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form__input"
                      placeholder="you@institution.org"
                      required
                      autoComplete="email"
                      aria-describedby="email-hint"
                    />
                    <p className="form__hint" id="email-hint">Used only to respond to this request.</p>
                    <p className="form__error-msg" id="email-error" role="alert">Enter a valid email address.</p>
                  </div>

                  <div className="form__field">
                    <label htmlFor="use-case" className="form__label">
                      What kind of facilitated talks do you run? <span className="form__hint" style={{ fontWeight: 400 }}>(optional)</span>
                    </label>
                    <textarea
                      id="use-case"
                      name="use-case"
                      className="form__textarea"
                      placeholder="e.g. university ombuds shuttle talks, Track 1.5 rounds, ADR panels..."
                      maxLength={500}
                      aria-describedby="use-case-hint"
                    ></textarea>
                    <p className="form__hint" id="use-case-hint">Max 500 characters. Do not include sensitive information.</p>
                  </div>

                  <div className="form__consent">
                    <input
                      type="checkbox"
                      id="consent"
                      name="consent"
                      className="form__checkbox"
                      required
                      aria-describedby="consent-error"
                    />
                    <label htmlFor="consent" className="form__consent-label">
                      I understand Avelis will use my email solely to respond to this request.
                      No name, phone, company, or job title is collected, per product law L7.
                    </label>
                  </div>
                  <p className="form__error-msg" id="consent-error" role="alert">Accept the minimum data terms to continue.</p>

                  <div className="form__privacy-note" role="note">
                    <svg className="form__privacy-note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h8M8 9h2" />
                    </svg>
                    <p className="form__privacy-note-text">
                      <strong>Minimum data in practice.</strong> This form collects only your email and an
                      optional description — following product law L7. We do not collect your name, phone,
                      company, or job title at this stage.
                    </p>
                  </div>

                  <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Verifying Institution...' : 'Request access'}
                  </button>
                </form>
              ) : (
                <div className="form__success" id="form-success" role="status" aria-live="polite" style={{ display: 'flex' }}>
                  <svg className="form__success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  <h3 className="form__success-title">Request received</h3>
                  <p className="form__success-desc">
                    We will respond within two business days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>

  {/* Footer */}
  <footer className="footer">
    <div className="container">
      <div className="footer__grid">
        <div className="footer__brand">
          <a href="#" className="logo" aria-label="Avelis home">
            <LogoLockup />
          </a>
          <p className="footer__desc">
            A facilitator operating system. It keeps a process ledger for talks that
            must not leave a transcript.
          </p>
        </div>
        <div className="footer__col">
          <h3 className="footer__col-title">Product</h3>
          <ul className="footer__col-list" role="list">
            <li><a href="#principles" className="footer__col-link">Principles</a></li>
            <li><a href="#how-it-works" className="footer__col-link">Session Model</a></li>
            <li><a href="#audience" className="footer__col-link">Who It's For</a></li>
          </ul>
        </div>
        <div className="footer__col">
          <h3 className="footer__col-title">Resources</h3>
          <ul className="footer__col-list" role="list">
            <li><Link to="/docs" className="footer__col-link">Documentation</Link></li>
            <li><Link to="/legal/dpa" className="footer__col-link">DPA Template</Link></li>
            <li><Link to="/threat-model" className="footer__col-link">Threat Model</Link></li>
          </ul>
        </div>
        <div className="footer__col">
          <h3 className="footer__col-title">Legal</h3>
          <ul className="footer__col-list" role="list">
            <li><Link to="/evaluation" className="footer__col-link">Contact</Link></li>
            <li><Link to="/legal/privacy" className="footer__col-link">Privacy Policy</Link></li>
            <li><Link to="/legal/data-processing" className="footer__col-link">Data Processing</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <p className="footer__copyright">&copy; 2026 Avelis. All rights reserved.</p>
      </div>
    </div>    
  </footer>
  </>
  );
}