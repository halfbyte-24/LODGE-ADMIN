import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock,
} from 'lucide-react';
import { RESORT_INFO, FAQS } from '../data/lodgeData';
import { sendContactMessage } from '../lib/supabaseClient';
import { contactRoutingService } from '../services/contactRoutingService';
import { useHotelSettings } from '../context/HotelSettingsContext';
import './Contact.css';

export default function ContactSection() {
  const { hotelSettings } = useHotelSettings();
  const [openFaq, setOpenFaq] = useState(0);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Room Reservation Enquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendContactMessage({
        name,
        email,
        phone,
        subject,
        message
      });
      setIsSubmitting(false);
      setIsSent(true);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bengali-contact-section">
      <div className="section-wrapper">
        
        <div className="contact-header">
          <span className="section-eyebrow">GET IN TOUCH</span>
          <h2 className="section-title">Contact Us</h2>
          <div className="section-title-line" />
          <p className="contact-description">
            We're here to help — whether you have a question about availability, want to make a reservation, 
            or need assistance planning your visit to our lodge.
          </p>
        </div>

        {/* Location & Contact Cards */}
        <div className="bengali-loc-cards">
          <div className="loc-card">
            <MapPin size={24} className="text-terracotta" />
            <h4>Our Address</h4>
            <p className="loc-primary">{hotelSettings.display_locality || "Near Kamarpukur, West Bengal"}</p>
            <p className="loc-secondary">{hotelSettings.travel_time_description || (hotelSettings.landmark_1 ? `Near ${hotelSettings.landmark_1}` : "Conveniently located near Kamarpukur’s key landmarks")}</p>
          </div>
          <div className="loc-card">
            <Phone size={24} className="text-terracotta" />
            <h4>Phone & WhatsApp</h4>
            <p className="loc-primary">{hotelSettings.phone || RESORT_INFO.phone}</p>
            <p className="loc-secondary">Available 24 hours</p>
          </div>
          <div className="loc-card">
            <Mail size={24} className="text-terracotta" />
            <h4>Email Us</h4>
            <p className="loc-primary">{hotelSettings.email || RESORT_INFO.reservationsEmail}</p>
            <p className="loc-secondary">Front Desk & Reservations</p>
          </div>
        </div>

        <div className="checkin-strip">
          <div className="checkin-item">
            <Clock size={18} className="text-gold" />
            <span><strong>Check-In:</strong> {hotelSettings.timings?.checkIn || hotelSettings.check_in_time || RESORT_INFO.checkInTime}</span>
          </div>
          <div className="checkin-item">
            <Clock size={18} className="text-gold" />
            <span><strong>Check-Out:</strong> {hotelSettings.timings?.checkOut || hotelSettings.check_out_time || RESORT_INFO.checkOutTime}</span>
          </div>
        </div>

        <div className="contact-split-grid">
          
          <div className="bengali-contact-form">
            <h3 className="form-title">Send a Message</h3>
            
            {!isSent ? (
              <form onSubmit={handleMessageSubmit} className="bengali-form">
                <div className="form-row-2">
                  <div className="input-group">
                    <label>Your Name *</label>
                    <input type="text" required placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Email Address *</label>
                    <input type="email" required placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="input-group">
                    <label>Phone / WhatsApp</label>
                    <input type="tel" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Subject</label>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                      <option>Room Reservation Enquiry</option>
                      <option>Group Booking Request</option>
                      <option>Event & Banquet Enquiry</option>
                      <option>Restaurant / Dining Enquiry</option>
                      <option>General Feedback</option>
                    </select>
                  </div>
                </div>

                <div className="input-group mb-4">
                  <label>Your Message *</label>
                  <textarea rows={4} required placeholder="Describe your enquiry" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                <div className="contact-form-actions flex flex-col gap-3">
                  <button type="submit" className="btn-terracotta w-100" disabled={isSubmitting}>
                    {isSubmitting ? <span>Sending...</span> : <><Send size={16} style={{marginRight: '8px'}} /> Send Enquiry</>}
                  </button>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={async () => {
                        const res = await contactRoutingService.getGeneralWhatsAppAction({
                          name: name || 'Website Visitor',
                          phone,
                          email,
                          subject,
                          message: message || 'Hello Amontron Hotel and Restaurant, I would like to enquire about your services.'
                        });
                        if (res.configured && res.url) {
                          window.open(res.url, '_blank', 'noopener,noreferrer');
                        } else {
                          alert(res.errorMessage || 'No WhatsApp recipient configured in Admin Settings. Please call +91 94334 24718.');
                        }
                      }}
                      className="btn-outline-gold flex-1 text-center py-2"
                      style={{ cursor: 'pointer', background: 'transparent' }}
                    >
                      WhatsApp Us
                    </button>
                    <a 
                      href={`tel:${RESORT_INFO.phone}`} 
                      className="btn-outline-gold flex-1 text-center py-2"
                    >
                      Call Now
                    </a>
                  </div>
                </div>
              </form>
            ) : (
              <div className="sent-success-box">
                <CheckCircle2 size={46} className="text-success mb-2" />
                <h4>Message Received!</h4>
                <p>Thank you, <strong>{name}</strong>. Our team will get back to you at <strong>{email}</strong> within a few hours.</p>
                <button className="btn-outline-gold mt-3" onClick={() => setIsSent(false)}>Send Another Message</button>
              </div>
            )}
            
            {/* Form decorative artwork */}
            <div className="form-decoration">
              <img src="/images/art3.jpg" alt="Alpana Motif" />
            </div>
          </div>

          <div className="bengali-faqs">
            <h3 className="faq-heading">Frequently Asked Questions</h3>
            <div className="faqs-accordion">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                const question = faq.question || faq.q;
                let answer = faq.answer || faq.a;
                if (question && question.toLowerCase().includes('check-in')) {
                  const checkIn = hotelSettings.timings?.checkIn || hotelSettings.check_in_time || '12:00 PM';
                  const checkOut = hotelSettings.timings?.checkOut || hotelSettings.check_out_time || '11:00 AM';
                  answer = `Check-in is at ${checkIn} and check-out is at ${checkOut}. Early check-in and late check-out can be arranged subject to availability.`;
                }
                return (
                  <div key={index} className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}>
                    <button className="faq-question-btn" onClick={() => toggleFaq(index)}>
                      <span className="faq-q-text">{question}</span>
                      <span className="faq-toggle-icon">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-panel">
                        <p>{answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
