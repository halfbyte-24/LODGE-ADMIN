import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/hotelData';
import './TestimonialsSection.css';

export default function TestimonialsSection() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[currentIdx];

  return (
    <section className="testimonials-section">
      <div className="section-wrapper">
        
        {/* Section Header */}
        <div className="section-header">
          <span className="section-eyebrow">GUEST EXPERIENCES</span>
          <h2 className="section-title">What Our Guests Say</h2>
          <div className="section-title-line" />
          <p className="section-subtitle">
            Genuine experiences shared by travelers who made Amontron Hotel & Restaurant their choice in Midnapore.
          </p>
        </div>

        {/* Testimonial Feature Card */}
        <div className="testimonial-card-wrapper">
          <button className="test-nav-btn prev" onClick={handlePrev} aria-label="Previous Testimonial">
            <ChevronLeft size={22} />
          </button>

          <div className="testimonial-main-card">
            <div className="test-quote-icon">
              <Quote size={38} />
            </div>

            {/* Stars */}
            <div className="test-stars-row">
              {[...Array(current.rating)].map((_, i) => (
                <Star key={i} size={16} fill="var(--accent-gold)" color="var(--accent-gold)" />
              ))}
            </div>

            <p className="test-quote-text">
              "{current.quote}"
            </p>

            <div className="test-guest-meta">
              <strong className="guest-name">{current.guestName}</strong>
              <span className="guest-details">{current.location} • Stayed in {current.roomStayed}</span>
              <span className="guest-date">{current.date}</span>
            </div>
          </div>

          <button className="test-nav-btn next" onClick={handleNext} aria-label="Next Testimonial">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Carousel Dots */}
        <div className="test-dots-row">
          {TESTIMONIALS.map((_, idx) => (
            <button
              key={idx}
              className={`test-dot ${idx === currentIdx ? 'test-dot-active' : ''}`}
              onClick={() => setCurrentIdx(idx)}
              aria-label={`Go to review ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
