import React, { useState } from 'react';
import { Calendar, Users, Check, ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { EVENTS_AND_OFFERS } from '../data/hotelData';
import './Pages.css';

export default function EventsPage({ onOpenBooking }) {
  const [enquirySent, setEnquirySent] = useState(false);
  const [eventType, setEventType] = useState('Wedding / Reception');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnquirySent(true);
  };

  return (
    <div className="inner-page events-page">
      {/* Page Hero */}
      <section className="page-hero-banner events-hero-bg">
        <div className="section-wrapper text-center">
          <span className="page-eyebrow">CELEBRATE &amp; CONVENE</span>
          <h1 className="page-main-title">Banquets &amp; Events</h1>
          <div className="gold-divider center-divider" />
          <p className="page-hero-desc">
            Host unforgettable wedding receptions, birthdays, corporate conferences, and social galas at AMONTRON.
          </p>
        </div>
      </section>

      {/* Events Listing */}
      <section className="events-catalog-section">
        <div className="section-wrapper">
          <div className="events-grid-large">
            {EVENTS_AND_OFFERS.map((ev) => (
              <div key={ev.id} className="event-item-card glass-card">
                <div className="event-media-box">
                  <img src={ev.image} alt={ev.title} />
                  <div className="event-tag-pill">{ev.tag || 'Banquets'}</div>
                </div>
                <div className="event-info-box">
                  <h2>{ev.title}</h2>
                  <p className="event-sub">{ev.subtitle}</p>
                  
                  <div className="event-features-checklist">
                    {ev.features.map((f, i) => (
                      <div key={i} className="ev-feature-row">
                        <Check size={14} className="text-gold" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <a href="#event-enquiry-form" className="btn-outline-gold mt-auto" onClick={() => setEventType(ev.title)}>
                    <span>Enquire for {ev.title}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section className="event-enquiry-section" id="event-enquiry-form">
        <div className="section-wrapper">
          <div className="enquiry-card glass-card">
            <div className="enquiry-text-col">
              <span className="section-eyebrow">PLAN YOUR GATHERING</span>
              <h2>Book Our Banquet Hall</h2>
              <p>
                Our experienced banquet managers will coordinate catering menus, seating arrangements, 
                lighting, audio-visual systems, and guest room allocations.
              </p>
              <div className="direct-event-call">
                <Phone size={18} className="text-gold" />
                <span>Call Banquet Manager: <strong>+91 00000 00000</strong></span>
              </div>
            </div>

            <div className="enquiry-form-col">
              {!enquirySent ? (
                <form onSubmit={handleSubmit} className="event-form">
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Subrata Mukherjee" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Phone / WhatsApp *</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="+91 98765 43210" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Event Date *</label>
                      <input 
                        type="date" 
                        required 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Event Type</label>
                    <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                      <option value="Wedding / Reception">Wedding / Reception</option>
                      <option value="Corporate Meeting & Seminar">Corporate Meeting &amp; Seminar</option>
                      <option value="Birthday & Social Celebration">Birthday &amp; Social Celebration</option>
                      <option value="Anniversary & Family Gathering">Anniversary &amp; Family Gathering</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary w-100">
                    <Calendar size={15} />
                    <span>Submit Banquet Enquiry</span>
                  </button>
                </form>
              ) : (
                <div className="enquiry-success text-center">
                  <CheckCircle2 size={40} className="text-success" />
                  <h3>Enquiry Submitted Successfully!</h3>
                  <p>Thank you, {name}. Our banquet manager will get in touch with you shortly to discuss availability and catering options.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
