import React, { useState } from 'react';
import { 
  X, 
  Maximize2, 
  Users, 
  Bed, 
  Eye, 
  Check, 
  Sparkles, 
  Calendar, 
  Coffee, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './RoomModal.css';

export default function RoomModal({ room, onClose, onSelectRoom }) {
  if (!room) return null;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const gallery = room.gallery && room.gallery.length > 0 ? room.gallery : [room.image];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content room-modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Gallery Section */}
        <div className="modal-gallery-area">
          <div className="main-photo-wrapper">
            <img 
              src={gallery[activePhotoIndex]} 
              alt={room.name} 
              className="main-photo-img" 
            />
            
            {gallery.length > 1 && (
              <>
                <button 
                  className="gallery-nav-btn prev"
                  onClick={() => setActivePhotoIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  className="gallery-nav-btn next"
                  onClick={() => setActivePhotoIndex((prev) => (prev + 1) % gallery.length)}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="gallery-counter">
              {activePhotoIndex + 1} / {gallery.length}
            </div>
          </div>

          {/* Thumbnails */}
          {gallery.length > 1 && (
            <div className="thumbnails-strip">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumb-btn ${idx === activePhotoIndex ? 'thumb-active' : ''}`}
                  onClick={() => setActivePhotoIndex(idx)}
                >
                  <img src={img} alt={`View ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details & Specs Area */}
        <div className="modal-body-area">
          <div className="modal-top-header">
            <div>
              <span className="badge-gold">{room.floorInfo || room.type || 'AMONTRON ROOM'}</span>
              <h2 className="modal-room-title">{room.name}</h2>
              <p className="modal-room-tagline">{room.tagline}</p>
            </div>
            <div className="modal-pricing-box">
              <span className="modal-price">₹{(room.pricePerNight || room.price).toLocaleString()}</span>
              <span className="modal-unit">/ night</span>
            </div>
          </div>

          {/* Quick Specs Pills */}
          <div className="modal-specs-bar">
            <div className="spec-pill">
              <Maximize2 size={16} className="spec-icon" />
              <div>
                <strong>{room.size || `${room.sqft} SQ FT`}</strong>
                <span>Spacious Area</span>
              </div>
            </div>
            <div className="spec-pill">
              <Users size={16} className="spec-icon" />
              <div>
                <strong>{room.capacity}</strong>
                <span>Comfortable</span>
              </div>
            </div>
            <div className="spec-pill">
              <Bed size={16} className="spec-icon" />
              <div>
                <strong>{room.bedType}</strong>
                <span>Plush Bedding</span>
              </div>
            </div>
            <div className="spec-pill">
              <Eye size={16} className="spec-icon" />
              <div>
                <strong>View</strong>
                <span>{room.view || 'City View'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="modal-description-box">
            <h4>Room Overview</h4>
            <p>{room.description}</p>
          </div>

          {/* Signature Features */}
          <div className="modal-features-section">
            <h4>Room Features &amp; Amenities</h4>
            <div className="features-columns">
              {(room.features || room.amenities || []).map((feat, i) => (
                <div key={i} className="modal-feature-item">
                  <Check size={16} className="check-gold" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Complimentary Inclusions */}
          <div className="modal-inclusions-card">
            <h4>
              <Sparkles size={16} className="text-gold" />
              <span>Complimentary Amontron Privileges</span>
            </h4>
            <div className="inclusions-grid">
              <div className="inclusion-item">
                <Coffee size={15} />
                <span>Daily Breakfast Option &amp; Morning Tea</span>
              </div>
              <div className="inclusion-item">
                <Sparkles size={15} />
                <span>Complimentary Bottled Water &amp; Tea Kit</span>
              </div>
              <div className="inclusion-item">
                <ShieldCheck size={15} />
                <span>Daily Housekeeping &amp; Fresh Linens</span>
              </div>
              <div className="inclusion-item">
                <Users size={15} />
                <span>Dedicated 24-Hour Front Desk Support</span>
              </div>
            </div>
          </div>

          {/* Modal Footer CTA */}
          <div className="modal-action-footer">
            <button className="btn-secondary" onClick={onClose}>
              Close Details
            </button>
            <button 
              className="btn-primary" 
              onClick={() => {
                onClose();
                onSelectRoom(room);
              }}
            >
              <Calendar size={16} />
              <span>Proceed to Reserve ({room.name})</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
