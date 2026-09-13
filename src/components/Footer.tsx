import React from 'react';
import { Link } from '@tanstack/react-router';
import { LogoLockup } from './Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__col footer__brand-col">
          <Link to="/" className="footer__logo-link" aria-label="Avelis home">
            <LogoLockup />
          </Link>
          <p className="footer__desc">
            A facilitator operating system. It keeps a process ledger for talks that
            must not leave a transcript.
          </p>
        </div>
        <div className="footer__col">
          <h3 className="footer__col-title">Product</h3>
          <ul className="footer__col-list" role="list">
            <li><a href="/#principles" className="footer__col-link">Principles</a></li>
            <li><a href="/#how-it-works" className="footer__col-link">Session Model</a></li>
            <li><a href="/#audience" className="footer__col-link">Who It&apos;s For</a></li>
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
    </footer>
  );
}
