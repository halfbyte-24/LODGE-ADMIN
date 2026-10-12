import React from 'react';
import { MapPin, Phone, Mail, Clock, Navigation, CheckCircle2 } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import './LocationPage.css';

export default function LocationPage() {
  return (
    <div className="bengali-page">
      {/* Editorial Hero */}
      <section className="bengali-page-hero editorial-hero">
        <div className="hero-texture-overlay"></div>
        <img src="/images/art7.jpg" className="editorial-hero-bg" alt="Alpana Motif" />
        
        <div className="section-wrapper text-center relative z-2">
          <span className="page-eyebrow">DIRECTIONS & ACCESS</span>
          <h1 className="page-title">Location & How to Reach</h1>
          <p className="page-description">
            Conveniently situated in Midnapore, West Bengal — easily accessible from the railway station, 
            bus terminus, and major highways.
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
                <h3 className="location-heading">AMONTRON HOTEL & RESTAURANT</h3>
                <p className="location-address">{HOTEL_INFO.address}</p>
                <div className="contact-row">
                  <div className="contact-item">
                    <Phone size={18} className="text-gold" />
                    <span>{HOTEL_INFO.phone}</span>
                  </div>
                  <div className="contact-item">
                    <Mail size={18} className="text-gold" />
                    <span>{HOTEL_INFO.email}</span>
                  </div>
                </div>

                <div className="location-action-buttons mt-4 flex flex-wrap gap-3">
                  <a 
                    href="https://maps.google.com/?q=Midnapore+West+Bengal" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-terracotta inline-flex items-center gap-2"
                  >
                    <Navigation size={16} /> Get Directions
                  </a>
                  <a 
                    href={`tel:${HOTEL_INFO.phone}`} 
                    className="btn-outline-gold inline-flex items-center gap-2"
                  >
                    <Phone size={16} /> Call Now
                  </a>
                  <a 
                    href={`https://wa.me/${(HOTEL_INFO.phone || '').replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-outline-gold inline-flex items-center gap-2"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </div>

              <div className="editorial-info-box">
                <h3 className="location-heading mb-6">Key Transit Landmarks</h3>
                <div className="transit-list">
                  <div className="transit-item">
                    <Navigation size={24} className="text-terracotta flex-shrink-0" />
                    <div>
                      <strong>Midnapore Railway Station</strong>
                      <p>Approx. 10 - 15 minutes by auto or taxi</p>
                    </div>
                  </div>
                  <div className="transit-item">
                    <Navigation size={24} className="text-terracotta flex-shrink-0" />
                    <div>
                      <strong>Central Bus Terminus</strong>
                      <p>Approx. 8 - 10 minutes drive</p>
                    </div>
                  </div>
                  <div className="transit-item">
                    <Navigation size={24} className="text-terracotta flex-shrink-0" />
                    <div>
                      <strong>Kolkata Airport (CCU)</strong>
                      <p>Approx. 2.5 - 3 hours via National Highway 16</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editorial-info-box highlight-box">
                <Clock size={32} className="text-gold flex-shrink-0" />
                <div>
                  <strong className="block mb-2">Check-in & Check-out Schedule</strong>
                  <p className="mb-2">Check-in: <strong className="text-terracotta">{HOTEL_INFO.checkInTime}</strong> | Check-out: <strong className="text-terracotta">{HOTEL_INFO.checkOutTime}</strong></p>
                  <span className="text-sm text-secondary">24-Hour reception desk available for late arrivals</span>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="location-map-wrapper">
              <div className="editorial-map-frame">
                <iframe
                  title="Amontron Hotel Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d118029.0886884025!2d87.24151741695286!3d22.422204918731308!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1d440263f350c9%3A0xb3f5ea5582f3ef65!2sMidnapore%2C%20West%20Bengal!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
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
