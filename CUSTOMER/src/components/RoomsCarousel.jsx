import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Bed, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ArrowRight,
  Calendar
} from 'lucide-react';
import { ROOMS } from '../data/hotelData';
import './RoomsCarousel.css';

export default function RoomsCarousel({ onBookRoom }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Maximum scroll index depending on desktop (3 visible), tablet (2 visible), mobile (1 visible)
  const maxIndex = Math.max(0, ROOMS.length - 1);

  const handleNext = () => {
    setCurrentIndex(prev => (prev < maxIndex ? prev + 1 : 0));
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
  };

  // Touch Swipe for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      handleNext(); // swipe left
    } else if (distance < -minSwipeDistance) {
      handlePrev(); // swipe right
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="rooms-section" id="rooms">
      <div className="section-wrapper">
        
        {/* Section Header */}
        <div className="rooms-header-flex">
          <div>
            <span className="section-eyebrow">ACCOMMODATION</span>
            <h2 className="section-title">Rooms & Suites</h2>
            <div className="section-title-line rooms-title-line" />
            <p className="section-subtitle">
              Designed with contemporary elegance, generous space, and relaxing ambiance for a restorative stay.
            </p>
          </div>

          <div className="rooms-header-actions">
            {/* Carousel Arrows */}
            <div className="rooms-carousel-nav">
              <button 
                className="rooms-nav-btn" 
                onClick={handlePrev}
                aria-label="Previous Room"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="rooms-nav-btn" 
                onClick={handleNext}
                aria-label="Next Room"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <Link to="/rooms" className="btn-outline-gold view-all-rooms-btn">
              <span>VIEW ALL ROOMS</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Carousel Viewport */}
        <div 
          className="rooms-carousel-viewport"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="rooms-track"
            style={{
              transform: `translateX(-${currentIndex * 33.333}%)`,
              transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {ROOMS.map((room) => (
              <div key={room.id} className="room-card-slide">
                <div className="hotel-room-card">
                  
                  {/* Room Media */}
                  <div className="room-media-box">
                    <img 
                      src={room.image} 
                      alt={room.name} 
                      className="room-card-image"
                      loading="lazy"
                    />
                    <div className="room-type-tag">{room.type}</div>
                    <div className="room-price-badge">
                      <span className="price-curr">₹</span>
                      <span className="price-amount">{room.price.toLocaleString()}</span>
                      <span className="price-unit">/ night</span>
                    </div>
                  </div>

                  {/* Room Body */}
                  <div className="room-card-content">
                    <h3 className="room-card-title">{room.name}</h3>

                    <div className="room-specs-strip">
                      <span className="spec-badge">
                        <Users size={13} />
                        {room.capacity}
                      </span>
                      <span className="spec-badge">
                        <Bed size={13} />
                        {room.bedType}
                      </span>
                    </div>

                    <p className="room-card-desc">
                      {room.description.slice(0, 115)}...
                    </p>

                    {/* Amenities Checklist */}
                    <div className="room-card-amenities">
                      {room.amenities.slice(0, 3).map((amenity, idx) => (
                        <div key={idx} className="room-amenity-row">
                          <Check size={13} className="amenity-check" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Card Actions */}
                    <div className="room-card-actions">
                      <Link to={`/rooms/${room.id}`} className="btn-outline-gold btn-room-view">
                        VIEW DETAILS
                      </Link>
                      <button 
                        className="btn-gold btn-room-book"
                        onClick={() => onBookRoom(room)}
                      >
                        <Calendar size={14} />
                        <span>BOOK NOW</span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View All Link */}
        <div className="rooms-mobile-footer-link">
          <Link to="/rooms" className="btn-outline-gold w-100">
            <span>VIEW ALL ACCOMMODATIONS</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
}
