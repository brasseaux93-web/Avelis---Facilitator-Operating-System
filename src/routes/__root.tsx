import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { LogoLockup } from '../components/Logo';
import { Footer } from '../components/Footer';
import '../../base.css';
import '../../style.css';
import '../styles/tokens.css';
import '../styles/premium-overrides.css';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [theme, setTheme] = useState('dark');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/auth') || location.pathname.startsWith('/session');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNavOpen) {
        setIsNavOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isNavOpen]);

  const closeNav = () => setIsNavOpen(false);

  return (
    <>
      <div className="ambient-bg" aria-hidden="true"></div>
      <a href="#main" className="skip-link">Skip to main content</a>

      <header className={`header ${isScrolled ? 'header--scrolled' : ''}`} id="header">
        <div className="container header__inner">
          <Link to="/" className="logo" aria-label="Avelis home" onClick={closeNav}>
            <LogoLockup />
          </Link>

          <nav className="nav" aria-label="Primary navigation">
            <button
              className="nav-toggle"
              aria-expanded={isNavOpen}
              aria-controls="nav-list"
              aria-label="Toggle navigation menu"
              onClick={() => setIsNavOpen(!isNavOpen)}
            >
              <span className="nav-toggle__bar"></span>
              <span className="nav-toggle__bar"></span>
              <span className="nav-toggle__bar"></span>
            </button>
            <ul className={`nav__list ${isNavOpen ? 'nav__list--open' : ''}`} id="nav-list">
              <li><a href="/#principles" className="nav__link" onClick={closeNav}>Principles</a></li>
              <li><a href="/#how-it-works" className="nav__link" onClick={closeNav}>Session Model</a></li>
              <li><a href="/#audience" className="nav__link" onClick={closeNav}>Who It's For</a></li>
              <li><Link to="/auth" className="nav__link" onClick={closeNav}>Sign in</Link></li>
            </ul>
          </nav>

          <div className="header__actions">
            <button className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} type="button" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>
            <Link to="/auth" className="btn btn--nav" onClick={closeNav}>Sign in</Link>
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </>
  );
}
