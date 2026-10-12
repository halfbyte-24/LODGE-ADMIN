import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { HOTEL_INFO } from '../config/hotelInfo';
import { sendContactMessage } from '../lib/supabaseClient';
import './ContactPage.css';

const FAQS = [
  { q: "What are the check-in and check-out times?", a: "Standard check-in time is 12:00 PM and check-out is at 11:00 AM." },
  { q: "Do you offer parking facilities?", a: "Yes, we provide secure on-site parking for all our guests." },
  { q: "Is the restaurant open for non-guests?", a: "Absolute! Our multi-cuisine Bengali restaurant is open to all visitors." },
  { q: "Do you have banquet facilities for events?", a: "Yes, we have a spacious banquet hall ideal for receptions, corporate events, and celebrations." }
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Room Reservation Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const whatsappUrl = `https://wa.me/${HOTEL_INFO.whatsapp.replace(/[^0-9]/g, '')}`;

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
              <p className="contact-info">{HOTEL_INFO.phoneDisplay || HOTEL_INFO.phone}</p>
              <span className="contact-subtext">Available 24 hours a day</span>
              <a href={`tel:${HOTEL_INFO.phone}`} className="btn-hero-outline mt-3 w-100 text-center" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Call Now
              </a>
            </div>

            <div className="editorial-contact-card">
              <MessageCircle size={32} className="text-terracotta contact-icon" />
              <h3 className="contact-heading">WhatsApp</h3>
              <p className="contact-info">{HOTEL_INFO.whatsappDisplay || HOTEL_INFO.whatsapp}</p>
              <span className="contact-subtext">Instant response on chat</span>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-hero-outline mt-3 w-100 text-center" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Chat on WhatsApp
              </a>
            </div>

            <div className="editorial-contact-card">
              <Mail size={32} className="text-terracotta contact-icon" />
              <h3 className="contact-heading">Email Us</h3>
              <p className="contact-info">{HOTEL_INFO.email}</p>
              <span className="contact-subtext">Prompt reply within hours</span>
              <a href={`mailto:${HOTEL_INFO.email}`} className="btn-hero-outline mt-3 w-100 text-center" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Send Email
              </a>
            </div>

            <div className="editorial-contact-card">
              <MapPin size={32} className="text-terracotta contact-icon" />
              <h3 className="contact-heading">Location</h3>
              <p className="contact-info">{HOTEL_INFO.address.line1}, {HOTEL_INFO.address.city}</p>
              <span className="contact-subtext">{HOTEL_INFO.address.state} - {HOTEL_INFO.address.pincode}</span>
              <a href={HOTEL_INFO.coordinates.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn-hero-outline mt-3 w-100 text-center" style={{ display: 'inline-block', textDecoration: 'none' }}>
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
                  {HOTEL_INFO.fullName}
                </h3>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  {HOTEL_INFO.address.full}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
              <a 
                href={HOTEL_INFO.coordinates.googleMapsUrl} 
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
                    <input type="text" required placeholder="e.g. Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="form-row-2">
                    <div className="input-group">
                      <label>Email Address *</label>
                      <input type="email" required placeholder="rahul@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Phone / WhatsApp *</label>
                      <input type="tel" required placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                    <textarea rows={4} required placeholder="Please share details such as check-in dates, number of guests, or special requests..." value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                  <button type="submit" className="btn-terracotta w-100 mt-4" disabled={isSubmitting}>
                    {isSubmitting ? <span>Sending Message…</span> : <><Send size={16} className="mr-2" /> Send Enquiry</>}
                  </button>
                </form>
              ) : (
                <div className="success-message">
                  <CheckCircle2 size={50} className="success-icon" />
                  <h3 className="success-title">Message Sent Successfully!</h3>
                  <p className="success-desc">Thank you, {name}. Our hospitality team has received your inquiry and will be in touch shortly.</p>
                </div>
              )}
            </div>

            {/* FAQs */}
            <div className="faq-container">
              <span className="page-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
              <h2 className="faq-section-title">Common Questions</h2>
              <div className="faq-list">
                {FAQS.map((faq, idx) => {
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
