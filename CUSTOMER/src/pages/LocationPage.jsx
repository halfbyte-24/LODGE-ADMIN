import React from 'react';
import { MapPin, Phone, Mail, Clock, Navigation, CheckCircle2 } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import { useHotelSettings } from '../context/HotelSettingsContext';
import { contactRoutingService } from '../services/contactRoutingService';
import './LocationPage.css';

export default function LocationPage() {
  const { hotelSettings } = useHotelSettings();
  const info = hotelSettings || HOTEL_INFO;

  const handleWhatsApp = async () => {
    const res = await contactRoutingService.getGeneralWhatsAppAction({
      name: 'Visitor',
      message: `Hello ${info.fullName || info.hotel_name || 'Amontron Hotel and Restaurant'}, I would like directions / enquiry regarding your location in ${info.display_locality || 'Near Kamarpukur, West Bengal'}.`
    });
    if (res.configured && res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } else {
      alert(res.errorMessage || `No WhatsApp recipient configured in Admin Settings. Please call ${info.phone || '+91 94334 24718'}.`);
    }
  };

  return (
    <div className="bengali-page">
      {/* Clean Compact Page Header */}
      <section className="bengali-page-hero">
        <div className="section-wrapper text-center">
          <span className="page-eyebrow">DIRECTIONS & ACCESS</span>
          <h1 className="page-title">Location & How to Reach</h1>
          <div className="page-title-line" />
          <p className="page-description">
            Conveniently situated in {info.display_locality || 'Near Kamarpukur, West Bengal'} — {info.travel_time_description || 'easily accessible from railway stations, key regional landmarks, and historic Bengali heritage destinations.'}
          </p>
        </div>
      </section>

      <section className="editorial-location-section">
        <img src="/images/art6.jpg" className="location-decor left-decor" alt="" />
        
        <div className="section-wrapper relative z-2">
          <div className="editorial-location-grid">
            
            {/* Contact & Landmarks */}
            <div className="location-editorial-content">
              <div className="editorial-info-box">
                <MapPin size={32} className="text-terracotta mb-4" />
                <h3 className="location-heading">{info.fullName || info.hotel_name || 'Amontron Hotel and Restaurant'}</h3>
                <p className="location-address">{info.display_locality || "Near Kamarpukur, West Bengal"}</p>
                {info.travel_time_description && (
                  <p className="text-sm text-secondary mb-3">{info.travel_time_description}</p>
                )}
                <div className="contact-row">
                  <div className="contact-item">
                    <Phone size={18} className="text-gold" />
                    <span>{info.phoneDisplay || info.phone}</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={18} className="text-gold" />
                    <span>{info.email}</span>
                  </div>
                </div>

                <div className="location-action-buttons mt-4 flex flex-wrap gap-3">
                  <a 
                    href={info.google_maps_url || info.coordinates?.googleMapsUrl || "https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161"} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-terracotta inline-flex items-center gap-2"
                  >
                    <Navigation size={16} /> Get Directions
                  </a>
                  <a 
                    href={`tel:${info.phone}`} 
                    className="btn-outline-gold inline-flex items-center gap-2"
                  >
                    <Phone size={16} /> Call Now
                  </a>
                  <button 
                    type="button"
                    onClick={handleWhatsApp}
                    className="btn-outline-gold inline-flex items-center gap-2"
                    style={{ cursor: 'pointer' }}
                  >
                    WhatsApp Us
                  </button>
                </div>
              </div>

              <div className="editorial-info-box">
                <h3 className="location-heading mb-6">Nearby Landmarks & Transit</h3>
                <div className="transit-list">
                  {info.landmark_1 && (
                    <div className="transit-item">
                      <Navigation size={24} className="text-terracotta shrink-0" />
                      <div>
                        <strong>{info.landmark_1}</strong>
                        <p>{info.travel_time_description || 'Conveniently located near key spiritual and cultural landmarks'}</p>
                      </div>
                    </div>
                  )}
                  {info.landmark_2 && (
                    <div className="transit-item">
                      <Navigation size={24} className="text-terracotta shrink-0" />
                      <div>
                        <strong>{info.landmark_2}</strong>
                        <p>Comfortable rail and regional transit connectivity</p>
                      </div>
                    </div>
                  )}
                  <div className="transit-item">
                    <Navigation size={24} className="text-terracotta shrink-0" />
                    <div>
                      <strong>Tarakeswar & Regional Connectivity</strong>
                      <p>Well connected via direct highway routes, buses, and local transport</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editorial-info-box highlight-box">
                <Clock size={32} className="text-gold shrink-0" />
                <div>
                  <strong className="block mb-2">Check-in & Check-out Schedule</strong>
                  <p className="mb-2">Check-in: <strong className="text-terracotta">{info.timings?.checkIn || HOTEL_INFO.timings.checkIn}</strong> | Check-out: <strong className="text-terracotta">{info.timings?.checkOut || HOTEL_INFO.timings.checkOut}</strong></p>
                  <span className="text-sm text-secondary">24-Hour reception desk available for arrivals</span>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="location-map-wrapper">
              <div className="editorial-map-frame">
                <iframe
                  title="Amontron Hotel and Restaurant Location Map"
                  src={info.google_maps_embed_url || info.coordinates?.googleMapsEmbedUrl || "https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed"}
                  width="100%"
                  className="google-map-iframe"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="map-footer">
                  <CheckCircle2 size={20} className="text-terracotta" />
                  <span>Ample on-site secure vehicle parking available for guests</span>
                </div>
              </div>
              <img src="/images/art3.jpg" className="map-decor-overlay" alt="" />
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
