import React from 'react';
import { Phone, MessageCircle, Mail, Sun, Moon } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import { useTheme } from '../context/ThemeContext';
import './TopContactBar.css';

export default function TopContactBar() {
  const { theme, isDay, toggleTheme, isAuto } = useTheme();

  return (
    <div className="top-contact-bar">
      <div className="top-contact-container">
        
        {/* Hotel Identity Left */}
        <div className="top-hotel-title">
          <span className="brand-dot" />
          <span>{HOTEL_INFO.fullName}</span>
          <span className="top-location-badge">• {HOTEL_INFO.address.city}, {HOTEL_INFO.address.state}</span>
        </div>

        {/* Quick Contact Actions Right */}
        <div className="top-actions-right">
          
          <a href={`tel:${HOTEL_INFO.phone}`} className="top-contact-link">
            <Phone size={13} className="top-icon" />
            <span className="top-link-label">Call:</span>
            <span className="top-link-val">{HOTEL_INFO.phoneDisplay}</span>
          </a>

          <span className="top-divider">|</span>

          <a 
            href={`https://wa.me/${HOTEL_INFO.whatsapp}?text=Hello%20Amontron%20Hotel,%20I%20would%20like%20to%20enquire%20about%20a%20room.`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="top-contact-link top-whatsapp"
          >
            <MessageCircle size={13} className="top-icon" />
            <span className="top-link-label">WhatsApp</span>
          </a>

          <span className="top-divider">|</span>

          <a href={`mailto:${HOTEL_INFO.email}`} className="top-contact-link top-email-link">
            <Mail size={13} className="top-icon" />
            <span className="top-link-label">{HOTEL_INFO.email}</span>
          </a>

          <span className="top-divider">|</span>

          {/* Theme Mode Toggle */}
          <button 
            className="theme-mode-toggle"
            onClick={toggleTheme}
            title={`Current theme: ${theme.toUpperCase()} (${isAuto ? 'Auto by local time' : 'Manual override'}). Click to switch.`}
            aria-label="Toggle Day and Night Theme"
          >
            {isDay ? <Sun size={13} className="sun-icon" /> : <Moon size={13} className="moon-icon" />}
            <span className="theme-toggle-label">{isDay ? 'Day Mode' : 'Night Mode'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
