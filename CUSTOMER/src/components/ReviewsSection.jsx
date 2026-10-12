import React from 'react';
import { Star, Quote } from 'lucide-react';
import { REVIEWS } from '../data/lodgeData';
import './Reviews.css';

export default function ReviewsSection() {
  return (
    <section className="reviews-section">
      <div className="section-wrapper">
        
        <div className="section-header">
          <span className="section-tag">GUEST REVIEWS</span>
          <h2 className="section-title">What Our Guests Say</h2>
          <div className="gold-divider" />
          <p className="section-description">
            Real experiences from guests who have stayed with us. Your comfort and satisfaction are our greatest achievement.
          </p>
        </div>

        <div className="reviews-grid">
          {Array.isArray(REVIEWS) && REVIEWS.map((rev) => (
            <div key={rev.id} className="review-card glass-card">
              <div className="review-card-top">
                <Quote size={32} className="quote-icon text-gold" />
                <div className="stars-row">
                  {[...Array(rev.rating || 5)].map((_, i) => (
                    <Star key={i} size={15} fill="#cba358" color="#cba358" />
                  ))}
                </div>
              </div>

              <p className="review-quote-text">"{rev.text || rev.quote || ''}"</p>

              <div className="review-author-meta">
                <strong className="author-name">{rev.name || rev.author || 'Valued Guest'}</strong>
                <span className="author-title">{rev.location || rev.title || ''}</span>
                <span className="author-pub">{rev.date || ''}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Accreditations Bar */}
        <div className="accreditations-banner glass-panel">
          <div className="accred-item">
            <span className="accred-star">★ ★ ★ ★ ★</span>
            <strong>TRIPADVISOR</strong>
            <small>Certificate of Excellence</small>
          </div>
          <div className="accred-divider" />
          <div className="accred-item">
            <span className="accred-star">★ ★ ★ ★</span>
            <strong>MAKEMYTRIP</strong>
            <small>4-Star Certified Property</small>
          </div>
          <div className="accred-divider" />
          <div className="accred-item">
            <span className="accred-star">★ ★ ★ ★ ★</span>
            <strong>GUESTS' CHOICE</strong>
            <small>Top Rated Hotel in Midnapore</small>
          </div>
        </div>

      </div>
    </section>
  );
}
