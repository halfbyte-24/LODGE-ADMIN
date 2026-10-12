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

  return (
    <>
      <header className={`bengali-navbar ${isScrolled ? 'navbar-sticky' : ''}`}>
        <div className="navbar-container">
          
          <Link to="/" className="navbar-brand">
            <span className="brand-primary-name">{HOTEL_INFO.name}</span>
            <span className="brand-sub-title">LODGE & RESTAURANT</span>
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
            <button 
              className="btn-terracotta nav-book-btn"
              onClick={handleBooking}
            >
              Book a Room &rarr;
            </button>

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
              <div className="drawer-hotel-sub">LODGE & RESTAURANT</div>
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
            <button className="btn-terracotta w-100 mb-3" onClick={() => { setMobileMenuOpen(false); if(handleBooking) handleBooking(); }}>
              ONLINE RESERVATION
            </button>
            <a href={`tel:${HOTEL_INFO.phone}`} className="drawer-phone-btn">
              <Phone size={16} /> {HOTEL_INFO.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
