import React, { useState } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GALLERY_ITEMS } from '../data/hotelData';
import './GalleryPage.css';

const BENGALI_GALLERY_ITEMS = [
  { id: 'gal-1', title: 'Traditional Bengali Welcome Artwork', category: 'Culture', image: '/images/art1.jpg' },
  { id: 'gal-2', title: 'Deluxe King Bedroom Interior', category: 'Rooms', image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85' },
  { id: 'gal-3', title: 'Authentic Bengali Special Breakfast Thali', category: 'Food', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=85' },
  { id: 'gal-4', title: 'Bengali Folk Instruments & Baul Music', category: 'Culture', image: '/images/art2.jpg' },
  { id: 'gal-5', title: 'Family Suite Accommodation', category: 'Rooms', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=85' },
  { id: 'gal-6', title: 'Fine Dining Restaurant Ambiance', category: 'Food', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85' },
  { id: 'gal-7', title: 'Traditional Bengali Classical Folk Dance', category: 'Culture', image: '/images/art5.jpg' },
  { id: 'gal-8', title: 'Hotel Reception & Welcoming Lobby', category: 'Hotel', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=85' },
  { id: 'gal-9', title: 'Grand Festive Folk Art Illustration', category: 'Culture', image: '/images/art7.jpg' },
  { id: 'gal-10', title: 'Intricate Bengali Alpana & Border Motifs', category: 'Culture', image: '/images/art6.jpg' }
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const categories = ['All', 'Rooms', 'Food', 'Culture', 'Hotel'];

  const filtered = activeCategory === 'All'
    ? BENGALI_GALLERY_ITEMS
    : BENGALI_GALLERY_ITEMS.filter(img => img.category.toLowerCase() === activeCategory.toLowerCase());

  // Determine span class based on index to create an asymmetric layout
  const getSpanClass = (index) => {
    // 0: large square, 1: tall, 2: wide, 3: normal, 4: normal, etc.
    const pattern = index % 5;
    if (pattern === 0) return 'span-large';
    if (pattern === 1) return 'span-tall';
    if (pattern === 2) return 'span-wide';
    return 'span-normal';
  };

  return (
    <div className="bengali-page">
      {/* Editorial Page Hero */}
      <section className="bengali-page-hero editorial-hero">
        <div className="hero-texture-overlay"></div>
        <img src="/images/art7.jpg" className="editorial-hero-bg" alt="Alpana Motif" />
        
        <div className="section-wrapper text-center relative z-2">
          <span className="page-eyebrow">VISUAL SHOWCASE</span>
          <h1 className="page-title">Photo Gallery</h1>
          <p className="page-description">
            Explore glimpses of AMONTRON HOTEL & RESTAURANT — our elegant rooms, dining halls, banquets, and modern facilities.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="page-filter-strip">
        <div className="section-wrapper">
          <div className="bengali-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`bengali-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Asymmetric Gallery Grid */}
      <section className="editorial-gallery-section">
        <img src="/images/art3.jpg" className="gallery-decor-left" alt="" />
        <img src="/images/art6.jpg" className="gallery-decor-right" alt="" />
        
        <div className="section-wrapper relative z-2">
          <div className="editorial-gallery-grid">
            {filtered.map((item, idx) => (
              <div 
                key={item.id || idx} 
                className={`editorial-gallery-item ${getSpanClass(idx)}`}
                onClick={() => setLightboxIndex(idx)}
              >
                <img src={item.image} alt={item.title} loading="lazy" />
                <div className="gallery-hover-overlay">
                  <Maximize2 size={24} className="text-terracotta mb-2" />
                  <h4>{item.title}</h4>
                  <span>{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div className="gallery-lightbox-modal" onClick={() => setLightboxIndex(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxIndex(null)}>
              <X size={32} />
            </button>
            <img src={filtered[lightboxIndex].image} alt={filtered[lightboxIndex].title} />
            <div className="lightbox-caption">
              <h3>{filtered[lightboxIndex].title}</h3>
              <p>{filtered[lightboxIndex].category}</p>
            </div>
            
            <button 
              className="lightbox-nav nav-prev"
              onClick={() => setLightboxIndex((prev) => (prev - 1 + filtered.length) % filtered.length)}
            >
              <ChevronLeft size={48} />
            </button>
            <button 
              className="lightbox-nav nav-next"
              onClick={() => setLightboxIndex((prev) => (prev + 1) % filtered.length)}
            >
              <ChevronRight size={48} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
