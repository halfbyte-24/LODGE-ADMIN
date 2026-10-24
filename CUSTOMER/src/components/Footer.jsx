import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Navigation } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import { useHotelSettings } from '../context/HotelSettingsContext';
import './Footer.css';

export default function Footer({ onOpenBooking }) {
  const { hotelSettings } = useHotelSettings();
  const info = hotelSettings || HOTEL_INFO;
  const phoneDigits = (info.phone || HOTEL_INFO.phone).replace(/[^0-9]/g, '');

  return (
    <footer className="bengali-footer">
      {/* Thin horizontal Bengali decorative border strip at footer top */}
      <div className="footer-top-strip" aria-hidden="true"></div>
      
      <div className="footer-container section-wrapper">
        <div className="footer-grid">
          
          {/* COLUMN 1: AMONTRON Branding */}
          <div className="footer-col footer-brand-section">
            <h2 className="footer-brand-name">{info.shortName || HOTEL_INFO.name}</h2>
            <div className="footer-brand-subtitle">HOTEL &amp; RESTAURANT</div>
            <Link
              to="/booking"
              className="btn-terracotta footer-book-btn inline-block text-center"
            >
              Book a Room &rarr;
            </Link>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div className="footer-col footer-links-section">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/rooms">Rooms</Link></li>
              <li><Link to="/restaurant">Restaurant</Link></li>
              <li><Link to="/facilities">Facilities</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/location">Location</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* COLUMN 3: Reach Us */}
          <div className="footer-col footer-contact-section">
            <h3 className="footer-heading">Reach Us</h3>
            <ul className="footer-contact-list">
              <li className="contact-item">
                <span className="contact-icon-col">
                  <MapPin size={17} className="contact-icon" />
                </span>
                <span className="contact-text">{info.display_locality || "Near Kamarpukur, West Bengal"}</span>
              </li>
              <li className="contact-item">
                <span className="contact-icon-col">
                  <Phone size={17} className="contact-icon" />
                </span>
                <span className="contact-text">
                  <a href={`tel:+${phoneDigits}`}>{info.phoneDisplay || info.phone}</a>
                </span>
              </li>
              <li className="contact-item">
                <span className="contact-icon-col">
                  <Mail size={17} className="contact-icon" />
                </span>
                <span className="contact-text">
                  <a href={`mailto:${info.email}`}>{info.email}</a>
                </span>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: Google Maps & Directions */}
          <div className="footer-col footer-map-section">
            <h3 className="footer-heading">Location Map</h3>
            <div className="footer-map-frame">
              <iframe
                title="Amontron Hotel and Restaurant Location Map"
                src={info.google_maps_embed_url || info.coordinates?.googleMapsEmbedUrl || "https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed"}
                width="100%"
                height="160"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href={info.google_maps_url || info.coordinates?.googleMapsUrl || "https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161"}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-directions-link"
            >
              <Navigation size={13} />
              <span>Get Directions &rarr;</span>
            </a>
          </div>

        </div>
      </div>
      
      {/* Compact footer bottom row */}
      <div className="footer-bottom">
        <p>&copy; 2026 AMONTRON HOTEL &amp; RESTAURANT. All rights reserved.</p>
      </div>
    </footer>
  );
}
