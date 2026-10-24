import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, ChevronRight, Phone } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import './Navbar.css';

export default function Navbar({ onOpenBookingModal, onOpenBooking }) {
  const handleBooking = onOpenBooking || onOpenBookingModal;
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'HOME', path: '/' },
    { label: 'ROOMS', path: '/rooms' },
    { label: 'RESTAURANT', path: '/restaurant' },
    { label: 'ABOUT', path: '/about' },
    { label: 'CONTACT', path: '/contact' }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const clickCountRef = React.useRef(0);
  const clickTimerRef = React.useRef(null);

  const handleBrandClick = (e) => {
    // Increment consecutive clicks
    clickCountRef.current += 1;

    // Reset timer on every click (within 2 seconds between clicks)
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 7) {
      // Triggered hidden access!
      clickCountRef.current = 0;
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;

      // Navigate to admin entry (port 5174 in dev, /admin in prod, or configurable via env)
      const adminUrl = import.meta.env.VITE_ADMIN_URL || (
        window.location.port === '5173'
          ? `${window.location.protocol}//${window.location.hostname}:5174/login`
          : `${window.location.origin}/admin`
      );
      window.location.href = adminUrl;
      return;
    }

    // Set timeout to reset count if user pauses for more than 2 seconds
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);

    // Normal click behavior: If already on home, scroll to top smoothly
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className={`bengali-navbar ${isScrolled ? 'navbar-sticky' : ''}`}>
        <div className="navbar-container">
          
          <Link to="/" className="navbar-brand" onClick={handleBrandClick}>
            <span className="brand-primary-name">{HOTEL_INFO.name}</span>
            <span className="brand-sub-title">HOTEL & RESTAURANT</span>
          </Link>

          <nav className="desktop-nav-menu" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`desktop-nav-link ${isActive(link.path) ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="navbar-action-right">
            <Link 
              to="/booking"
              className="btn-terracotta nav-book-btn"
            >
              Book a Room &rarr;
            </Link>

            <button 
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
        <div className="navbar-bottom-border"></div>
      </header>

      <div className={`mobile-nav-backdrop ${mobileMenuOpen ? 'backdrop-visible' : ''}`} onClick={() => setMobileMenuOpen(false)}>
        <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'drawer-open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-header">
            <div>
              <div className="drawer-hotel-name">{HOTEL_INFO.name}</div>
              <div className="drawer-hotel-sub">HOTEL & RESTAURANT</div>
            </div>
            <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="mobile-drawer-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-drawer-item ${isActive(link.path) ? 'item-active' : ''}`}
              >
                <span>{link.label}</span>
                <ChevronRight size={18} className="drawer-arrow" />
              </Link>
            ))}
          </nav>

          <div className="mobile-drawer-footer">
            <Link 
              to="/booking" 
              className="btn-terracotta w-100 mb-3 text-center" 
              onClick={() => setMobileMenuOpen(false)}
            >
              ONLINE RESERVATION
            </Link>
            <a href={`tel:${HOTEL_INFO.phone}`} className="drawer-phone-btn">
              <Phone size={16} /> {HOTEL_INFO.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
