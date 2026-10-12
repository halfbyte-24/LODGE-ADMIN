import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2, ArrowRight } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/hotelData';
import LightboxModal from './LightboxModal';
import './GallerySection.css';

export default function GallerySection() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const categories = ['All', 'Hotel', 'Rooms', 'Restaurant', 'Facilities'];

  const filteredItems = selectedCategory === 'All'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === selectedCategory);

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    }
  };

  const prevPhoto = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <section className="gallery-home-section" id="gallery">
      <div className="section-wrapper">
        
        {/* Section Header */}
        <div className="section-header">
          <span className="section-eyebrow">VISUAL TOUR</span>
          <h2 className="section-title">Experience Amontron</h2>
          <div className="section-title-line" />
          <p className="section-subtitle">
            A glimpse into the comfortable rooms, inviting dining ambiance, and welcoming spaces of our property.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="gallery-filter-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`gallery-pill ${selectedCategory === cat ? 'gallery-pill-active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-masonry-grid">
          {filteredItems.slice(0, 6).map((item, idx) => (
            <div 
              key={item.id} 
              className="gallery-grid-item"
              onClick={() => openLightbox(idx)}
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="gallery-item-img"
                loading="lazy" 
              />
              <div className="gallery-item-hover">
                <div className="gallery-hover-icon">
                  <Maximize2 size={20} />
                </div>
                <h4 className="gallery-hover-title">{item.title}</h4>
                <span className="gallery-hover-cat">{item.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Link to /gallery */}
        <div className="gallery-footer-cta">
          <Link to="/gallery" className="btn-outline-gold">
            <span>VIEW COMPLETE PHOTO GALLERY</span>
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>

      {/* Reusable Lightbox Modal */}
      <LightboxModal
        images={filteredItems}
        activeIndex={lightboxIndex}
        onClose={closeLightbox}
        onPrev={prevPhoto}
        onNext={nextPhoto}
      />
    </section>
  );
}
