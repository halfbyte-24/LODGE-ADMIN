import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Calendar } from 'lucide-react';
import { HERO_SLIDES } from '../data/hotelData';
import { HOTEL_INFO } from '../config/hotelInfo';
import { useTheme } from '../context/ThemeContext';
import './HeroSection.css';

export default function HeroSection({ onOpenBookingModal }) {
  const { isNight } = useTheme();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const SLIDE_DURATION = 5500; // 5.5 seconds per slide

  // Autoplay slideshow
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
      }, SLIDE_DURATION);
    }
    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const currentSlide = HERO_SLIDES[currentSlideIndex];

  return (
    <section 
      className="hero-slideshow-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Amontron Hotel Showcase"
    >
      {/* Background Slides Stack with Crossfade & Subtle Ken Burns Zoom */}
      <div className="hero-images-container">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          const bgUrl = isNight ? slide.nightImage : slide.dayImage;

          return (
            <div
              key={slide.id}
              className={`hero-slide-layer ${isActive ? 'slide-layer-active' : ''}`}
              style={{ backgroundImage: `url(${bgUrl})` }}
              role="img"
              aria-label={slide.alt}
            >
              <div className="hero-dark-overlay" />
            </div>
          );
        })}
      </div>

      {/* Hero Content Center */}
      <div className="hero-content-wrapper">
        <div className="hero-text-container" key={currentSlide.id}>
          
          <span className="hero-welcome-eyebrow">
            {currentSlide.tagline || 'WELCOME TO'}
          </span>

          <h1 className="hero-hotel-title">
            <span className="title-bold">AMONTRON</span>
            <span className="title-light">HOTEL & RESTAURANT</span>
          </h1>

          <p className="hero-tagline-quote">
            "{HOTEL_INFO.tagline} in Midnapore."
          </p>

          <p className="hero-slide-description">
            {currentSlide.subtitle}
          </p>

          {/* Call-To-Action Buttons */}
          <div className="hero-buttons-row">
            <button 
              className="btn-gold hero-cta-book"
              onClick={onOpenBookingModal}
            >
              <Calendar size={16} />
              <span>BOOK YOUR STAY</span>
            </button>

            <a 
              href="#rooms" 
              className="btn-white hero-cta-explore"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('rooms');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>EXPLORE ROOMS</span>
              <ArrowRight size={15} />
            </a>
          </div>

        </div>
      </div>

      {/* Subtle Bottom Controls */}
      <div className="hero-bottom-controls">
        
        {/* Navigation Arrows */}
        <div className="hero-nav-chevrons">
          <button 
            className="hero-chevron-btn" 
            onClick={handlePrev}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            className="hero-chevron-btn" 
            onClick={handleNext}
            aria-label="Next Slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Slide Counter (e.g. 01 / 06) */}
        <div className="hero-counter-display">
          <span className="counter-current">0{currentSlideIndex + 1}</span>
          <span className="counter-sep">/</span>
          <span className="counter-total">0{HERO_SLIDES.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="hero-progress-track">
          <div 
            key={currentSlideIndex}
            className={`hero-progress-fill ${!isPaused ? 'progress-animating' : ''}`}
            style={{ animationDuration: `${SLIDE_DURATION}ms` }}
          />
        </div>

      </div>

    </section>
  );
}
