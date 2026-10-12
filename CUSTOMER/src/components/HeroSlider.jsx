import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroSlider.css';

const HEADLINES = [
  {
    lang: 'en',
    fullText: 'Your Home Away From Home',
    fontClass: 'en-font'
  },
  {
    lang: 'bn',
    fullText: 'আপন ঘরের আপন ঠিকানা',
    fontClass: 'bn-font'
  }
];

export default function HeroSlider({ onOpenBooking }) {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentHeadline = HEADLINES[headlineIndex];
  // Break into Unicode graphemes to safely handle Bengali conjuncts and diacritics
  const graphemes = Array.from(currentHeadline.fullText);

  useEffect(() => {
    let timer;

    if (!isDeleting) {
      if (displayedCount < graphemes.length) {
        // Typing: 85ms per character
        timer = setTimeout(() => {
          setDisplayedCount((prev) => prev + 1);
        }, 85);
      } else {
        // Finished typing headline: Pause for 2800ms
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2800);
      }
    } else {
      if (displayedCount > 0) {
        // Erasing: 45ms per character
        timer = setTimeout(() => {
          setDisplayedCount((prev) => prev - 1);
        }, 45);
      } else {
        // Fully erased: switch language
        setIsDeleting(false);
        setHeadlineIndex((prev) => (prev + 1) % HEADLINES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedCount, isDeleting, headlineIndex, graphemes.length]);

  const currentTypedText = graphemes.slice(0, displayedCount).join('');

  const handleBookingClick = () => {
    // Navigates directly to /booking dedicated route
  };

  return (
    <section className="bengali-hero full-width-hero" aria-label="Hero Section">
      {/* FULL-WIDTH ORIGINAL YELLOW BENGALI ARTWORK BACKGROUND */}
      <div className="hero-full-bg" aria-hidden="true">
        <img
          src="/images/art6.jpg"
          alt=""
          className="hero-bg-image"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* Warm cream-to-amber translucent scrim overlay to ensure 100% text readability */}
      <div className="hero-overlay-scrim" aria-hidden="true" />

      {/* Bottom decorative folk art strip */}
      <div className="hero-bottom-art-strip" aria-hidden="true">
        <img
          src="/images/art3.jpg"
          alt=""
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      <div className="hero-container">
        {/* ====== LEFT SIDE: Hero Content ====== */}
        <div className="hero-content">
          <span className="hero-eyebrow">AMONTRON LODGE &amp; RESTAURANT</span>

          {/* Reserved height container with fixed font-size & line-height to prevent jumping */}
          <div className="hero-headline-container">
            <h1 className="hero-headline-animated">
              <span className={`typed-headline-text ${currentHeadline.fontClass}`}>
                <span className="hero-headline-accent">{currentTypedText}</span>
              </span>
              <span className="hero-cursor" aria-hidden="true">|</span>
            </h1>
          </div>

          <p className="hero-description">
            Experience warm Bengali hospitality, comfortable air-conditioned rooms across 3 floors, and authentic multi-cuisine dining.
          </p>

          <div className="hero-actions">
            <Link
              to="/booking"
              id="hero-book-room-btn"
              className="btn-hero-primary"
              onClick={handleBookingClick}
            >
              BOOK A ROOM &rarr;
            </Link>
            <Link
              to="/restaurant"
              id="hero-view-menu-btn"
              className="btn-hero-outline"
            >
              VIEW MENU &rarr;
            </Link>
          </div>

          <div className="hero-trust-strip">
            <span>✦ 9 AC Rooms Across 3 Floors</span>
            <span>✦ Multi-Cuisine Restaurant</span>
            <span>✦ 24/7 Front Desk</span>
          </div>
        </div>
      </div>
    </section>
  );
}

