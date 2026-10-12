import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import './LightboxModal.css';

export default function LightboxModal({ images, activeIndex, onClose, onPrev, onNext }) {
  if (activeIndex === null || !images || images.length === 0) return null;

  const currentImage = images[activeIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="lightbox-close-btn" onClick={onClose} aria-label="Close Lightbox">
          <X size={24} />
        </button>

        {/* Previous Button */}
        {images.length > 1 && (
          <button className="lightbox-nav-btn prev-btn" onClick={onPrev} aria-label="Previous Photo">
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Image Display */}
        <div className="lightbox-image-box">
          <img 
            src={typeof currentImage === 'string' ? currentImage : currentImage.image} 
            alt={currentImage.title || 'Amontron Hotel Gallery'} 
            className="lightbox-main-img" 
          />
          {currentImage.title && (
            <div className="lightbox-caption">
              <span>{currentImage.title}</span>
              {currentImage.category && <small>• {currentImage.category}</small>}
            </div>
          )}
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button className="lightbox-nav-btn next-btn" onClick={onNext} aria-label="Next Photo">
            <ChevronRight size={28} />
          </button>
        )}

        {/* Counter */}
        <div className="lightbox-counter">
          {activeIndex + 1} / {images.length}
        </div>

      </div>
    </div>
  );
}
