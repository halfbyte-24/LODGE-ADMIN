import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Bed, Maximize2, Check, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ROOMS, ROOM_CATEGORIES } from '../data/hotelData';
import './RoomShowcase.css';

export default function RoomCarousel({ onSelectRoom, onQuickView }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredRooms = activeCategory === 'all'
    ? ROOMS
    : ROOMS.filter(r => r.id === activeCategory || r.category === activeCategory);

  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  const handleNext = () => {
    if (currentIndex < filteredRooms.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(filteredRooms.length - 1);
    }
  };

  return (
    <section className="bengali-rooms-preview">
      <div className="rooms-top-border"></div>
      
      <div className="section-wrapper">
        <div className="rooms-header">
          <span className="section-eyebrow">STAY IN COMFORT</span>
          <h2 className="section-title">Rooms Designed for Rest</h2>
          <div className="section-title-line"></div>
          <p className="rooms-description">
            Experience restful stays in our thoughtfully furnished rooms. 
            Enjoy plush bedding, elegant decor, and traditional warmth.
          </p>
        </div>

        <div className="rooms-filter-container">
          <div className="category-pills">
            {ROOM_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`filter-pill ${activeCategory === cat.id ? 'pill-active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rooms-editorial-layout">
          {/* Decorative artwork behind carousel */}
          <div className="rooms-decoration-bg">
            <img src="/images/art3.jpg" alt="Bengali motif" />
          </div>

          <div className="rooms-carousel-container">
            <button className="carousel-arrow prev" onClick={handlePrev}>
              <ChevronLeft size={24} />
            </button>

            <div className="carousel-track-wrapper">
              <div 
                className="carousel-track"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {filteredRooms.map((room) => (
                  <div key={room.id} className="carousel-slide">
                    <div className="bengali-room-card">
                      <div className="room-card-image">
                        <img src={room.image} alt={room.name} loading="lazy" />
                        <div className="room-price-badge">
                          <span>₹{(room.pricePerNight || room.price).toLocaleString()}</span>
                          <small>/ night</small>
                        </div>
                      </div>
                      
                      <div className="room-card-content">
                        <h3 className="room-title">{room.name}</h3>
                        <div className="room-specs">
                          <span><Users size={14} /> {room.capacity}</span>
                          <span><Bed size={14} /> {room.bedType}</span>
                          <span><Maximize2 size={14} /> {room.size || `${room.sqft} sq.ft.`}</span>
                        </div>
                        
                        <p className="room-desc">{room.description}</p>
                        
                        <div className="room-features">
                          {(room.features || []).slice(0, 3).map((feat, i) => (
                            <div key={i} className="feature-item">
                              <Check size={14} className="text-terracotta" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        <div className="room-actions">
                          <Link to={`/room/${room.id}`} className="btn-outline-gold room-details-btn">
                            VIEW DETAILS
                          </Link>
                          <button className="btn-terracotta room-book-btn" onClick={() => onSelectRoom(room)}>
                            BOOK NOW <ArrowRight size={16} style={{marginLeft: '8px'}} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="carousel-arrow next" onClick={handleNext}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
