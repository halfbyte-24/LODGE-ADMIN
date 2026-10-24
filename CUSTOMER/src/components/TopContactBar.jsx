import React from 'react';
import { Phone, MessageCircle, Mail, Sun, Moon } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import { useTheme } from '../context/ThemeContext';
import { useHotelSettings } from '../context/HotelSettingsContext';
import { contactRoutingService } from '../services/contactRoutingService';
import './TopContactBar.css';

export default function TopContactBar() {
  const { theme, isDay, toggleTheme, isAuto } = useTheme();
  const { hotelSettings } = useHotelSettings();
  const info = hotelSettings || HOTEL_INFO;

  return (
    <div className="top-contact-bar">
      <div className="top-contact-container">
        
        {/* Hotel Identity Left */}
        <div className="top-hotel-title">
          <span className="brand-dot" />
          <span>{info.fullName || info.hotel_name || 'Amontron Hotel and Restaurant'}</span>
          <span className="top-location-badge">• {info.display_locality || 'Near Kamarpukur, West Bengal'}</span>
        </div>

        {/* Quick Contact Actions Right */}
        <div className="top-actions-right">
          
          <a href={`tel:${info.phone}`} className="top-contact-link">
            <Phone size={13} className="top-icon" />
            <span className="top-link-label">Call:</span>
            <span className="top-link-val">{info.phoneDisplay || info.phone}</span>
          </a>

          <span className="top-divider">|</span>

          <button 
            type="button"
            onClick={async () => {
              const res = await contactRoutingService.getGeneralWhatsAppAction({
                name: 'Website Visitor',
                message: 'Hello Amontron Hotel and Restaurant, I would like to enquire about your services.'
              });
              if (res.configured && res.url) {
                window.open(res.url, '_blank', 'noopener,noreferrer');
              } else {
                alert(res.errorMessage || 'No WhatsApp recipient configured in Admin Settings. Please call +91 94334 24718.');
              }
            }}
            className="top-contact-link top-whatsapp"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
          >
            <MessageCircle size={13} className="top-icon" />
            <span className="top-link-label">WhatsApp</span>
          </button>

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
