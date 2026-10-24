import React, { useState, useEffect, useMemo } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import { sendContactMessage } from '../lib/supabaseClient';
import { contactRoutingService } from '../services/contactRoutingService';
import { useHotelSettings } from '../context/HotelSettingsContext';
import './ContactPage.css';

export default function ContactPage() {
  const { hotelSettings } = useHotelSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Room Reservation Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [generalContact, setGeneralContact] = useState(null);

  const faqs = useMemo(() => [
    { 
      q: "What are the check-in and check-out times?", 
      a: `Standard hotel check-in time is from ${hotelSettings.timings?.checkIn || hotelSettings.check_in_time || '12:00 PM'} and check-out is by ${hotelSettings.timings?.checkOut || hotelSettings.check_out_time || '11:00 AM'}. Early check-in or late departure can be arranged subject to room availability.` 
    },
    { q: "Do you offer parking facilities?", a: "Yes, we provide secure on-site parking for all our guests." },
    { q: "Is the restaurant open for non-guests?", a: "Absolutely! Our multi-cuisine Bengali restaurant is open to all visitors." },
    { q: "Do you have banquet facilities for events?", a: "Yes, we have a spacious banquet hall ideal for receptions, corporate events, and celebrations." }
  ], [hotelSettings]);

  useEffect(() => {
    async function loadRouting() {
      try {
        const routing = await contactRoutingService.getRouting();
        if (routing?.generalContact) {
          setGeneralContact(routing.generalContact);
        }
      } catch (e) {
        console.warn('Could not load routing in ContactPage:', e);
      }
    }
    loadRouting();
  }, []);

  const handleWhatsAppAction = async (customMessage) => {
    const res = await contactRoutingService.getGeneralWhatsAppAction({
      name: name || 'Website Visitor',
      phone: phone || '',
      email: email || '',
      subject: subject || 'General Enquiry',
      message: customMessage || message || 'Hello Amontron Hotel and Restaurant, I would like to enquire about your services.'
    });

    if (res.configured && res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } else {
      alert(res.errorMessage || 'No WhatsApp recipient configured in Admin Settings. Please call our front desk at +91 94334 24718.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendContactMessage({ name, email, phone, subject, message });
      setIsSent(true);
    } catch {
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bengali-page">
      {/* Clean Compact Page Header */}
      <section className="bengali-page-hero">
        <div className="section-wrapper text-center">
          <span className="page-eyebrow">GET IN TOUCH</span>
          <h1 className="page-title">CONTACT US</h1>
          <div className="page-title-line" />
          <p className="page-description">
            Have questions about room bookings, dining reservations, or banquets? 
            Our front desk and reservation teams are available 24/7 to assist you.
          </p>
        </div>
      </section>

      {/* Quick Contact Grid */}
      <section className="editorial-contact-cards-section">
        <div className="section-wrapper">
          <div className="editorial-contact-grid">
            <div className="editorial-contact-card">
              <Phone size={32} className="text-terracotta contact-icon" />
              <h3 className="contact-heading">Call Us</h3>
              <p className="contact-info">{hotelSettings.phone || HOTEL_INFO.phoneDisplay || HOTEL_INFO.phone}</p>
              <span className="contact-subtext">Official business phone</span>
              <a href={`tel:${hotelSettings.phone || HOTEL_INFO.phone}`} className="btn-hero-outline mt-3 w-100 text-center" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Call Now
              </a>
            </div>

            <div className="editorial-contact-card">
              <MessageCircle size={32} className="text-terracotta contact-icon" />
              <h3 className="contact-heading">WhatsApp</h3>
              <p className="contact-info">
                {generalContact?.name ? `${generalContact.name} (${generalContact.phone})` : (hotelSettings.phone || 'Live Chat Support')}
              </p>
              <span className="contact-subtext">Admin-assigned general contact</span>
              <button 
                type="button"
                onClick={() => handleWhatsAppAction()}
                className="btn-hero-outline mt-3 w-100 text-center" 
                style={{ cursor: 'pointer', background: 'transparent' }}
              >
                Chat on WhatsApp
              </button>
            </div>

            <div className="editorial-contact-card">
              <Mail size={32} className="text-terracotta contact-icon" />
              <h3 className="contact-heading">Email Us</h3>
              <p className="contact-info">{hotelSettings.email || HOTEL_INFO.email}</p>
              <span className="contact-subtext">Official business email</span>
              <a href={`mailto:${hotelSettings.email || HOTEL_INFO.email}`} className="btn-hero-outline mt-3 w-100 text-center" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Send Email
              </a>
            </div>

            <div className="editorial-contact-card">
              <MapPin size={32} className="text-terracotta contact-icon" />
              <h3 className="contact-heading">Location</h3>
              <p className="contact-info">{hotelSettings.display_locality || "Near Kamarpukur, West Bengal"}</p>
              <span className="contact-subtext">{hotelSettings.travel_time_description || (hotelSettings.landmark_1 ? `Near ${hotelSettings.landmark_1}` : "Conveniently located near Kamarpukur’s key landmarks")}</span>
              <a 
                href={hotelSettings.google_maps_url || HOTEL_INFO.coordinates.googleMapsUrl || "https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-hero-outline mt-3 w-100 text-center" 
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Location Detail & Map Section */}
      <section className="editorial-location-detail-section" style={{ padding: '40px 0', background: 'var(--bg-surface)' }}>
        <div className="section-wrapper">
          <div style={{ background: 'white', border: '1px solid var(--border-subtle)', padding: '30px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={24} style={{ color: 'var(--accent-terracotta)' }} />
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
                  {hotelSettings.hotel_name || HOTEL_INFO.fullName}
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {hotelSettings.display_locality || "Near Kamarpukur, West Bengal"}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '2px 0 0' }}>
                  {hotelSettings.travel_time_description || "Conveniently located near Kamarpukur’s key landmarks"}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              <a 
                href={hotelSettings.google_maps_url || HOTEL_INFO.coordinates.googleMapsUrl || "https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161"} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-terracotta"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              >
                <Navigation size={16} /> Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Form & FAQs */}
      <section className="editorial-form-faq-section">
        <img src="/images/art6.jpg" className="contact-decor-corner bottom-left" alt="" />
        <img src="/images/art3.jpg" className="contact-decor-corner top-right" alt="" />
        
        <div className="section-wrapper relative z-2">
          <div className="form-faq-split">
            
            {/* Form */}
            <div className="editorial-contact-form-box">
              <span className="page-eyebrow">SEND US A MESSAGE</span>
              <h2 className="form-title">Send Enquiry</h2>
              <p className="form-desc">Fill out the form below and our front desk team will contact you shortly.</p>

              {!isSent ? (
                <form onSubmit={handleSubmit} className="editorial-form">
                  <div className="input-group">
                    <label>Full Name *</label>
                    <input type="text" required placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="form-row-2">
                    <div className="input-group">
                      <label>Email Address *</label>
                      <input type="email" required placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Phone / WhatsApp *</label>
                      <input type="tel" required placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Subject</label>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                      <option>Room Reservation Enquiry</option>
                      <option>Restaurant Table Booking</option>
                      <option>Banquet Hall / Event Enquiry</option>
                      <option>Corporate Booking & Conference</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Your Message *</label>
                    <textarea rows={4} required placeholder="Describe your enquiry" value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button type="submit" className="btn-terracotta" style={{ flex: 1 }} disabled={isSubmitting}>
                      {isSubmitting ? <span>Sending Message…</span> : <><Send size={16} className="mr-2" /> Send Enquiry</>}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleWhatsAppAction()}
                      className="btn-outline-gold"
                      style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <MessageCircle size={16} /> Enquire on WhatsApp
                    </button>
                  </div>
                </form>
              ) : (
                <div className="success-message">
                  <CheckCircle2 size={50} className="success-icon" />
                  <h3 className="success-title">Message Sent Successfully!</h3>
                  <p className="success-desc">Thank you, {name}. Our hospitality team has received your inquiry and will be in touch shortly.</p>
                  <button 
                    type="button" 
                    className="btn-outline-gold mt-4" 
                    onClick={() => handleWhatsAppAction()}
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <MessageCircle size={16} /> Also Send on WhatsApp
                  </button>
                </div>
              )}
            </div>

            {/* FAQs */}
            <div className="faq-container">
              <span className="page-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
              <h2 className="faq-section-title">Common Questions</h2>
              <div className="faq-list">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  const question = faq.question || faq.q;
                  const answer = faq.answer || faq.a;
                  return (
                    <div key={idx} className={`faq-item ${isOpen ? 'active' : ''}`}>
                      <button 
                        className="faq-trigger"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                      >
                        <span className="faq-q">{question}</span>
                        <span>{isOpen ? <ChevronUp size={20} className="text-gold" /> : <ChevronDown size={20} className="text-gold" />}</span>
                      </button>
                      {isOpen && (
                        <div className="faq-answer">
                          <p>{answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
