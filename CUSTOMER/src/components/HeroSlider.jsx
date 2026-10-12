import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HeroSlider.css';

const HEADLINES = [
  {
    lang: 'en',
    fullText: 'Experience Comfort & Taste in the Heart of Bengal',
    render: (typedText) => {
      // "Experience Comfort & Taste in the Heart of Bengal"
      // Part 1: "Experience " (dark text #252019)
      // Part 2: "Comfort & Taste" (maroon accent #9B1C1C)
      // Part 3: " in the Heart of Bengal" (forest green #1F4D2E)
      const part1Target = 'Experience ';
      const part2Target = 'Comfort & Taste';

      let p1 = '';
      let p2 = '';
      let p3 = '';

      if (typedText.length <= part1Target.length) {
        p1 = typedText;
      } else if (typedText.length <= part1Target.length + part2Target.length) {
        p1 = part1Target;
        p2 = typedText.slice(part1Target.length);
      } else {
        p1 = part1Target;
        p2 = part2Target;
        p3 = typedText.slice(part1Target.length + part2Target.length);
      }

      return (
        <span className="typed-headline-text en-font">
          {p1 && <span>{p1}</span>}
          {p2 && <span className="hero-headline-accent">{p2}</span>}
          {p3 && <span className="hero-headline-dark">{p3}</span>}
        </span>
      );
    }
  },
  {
    lang: 'bn',
    fullText: 'বাংলার ঐতিহ্য ও আধুনিক স্বাচ্ছন্দ্যের আতিথেয়তা',
    render: (typedText) => {
      // Bengali headline: "বাংলার ঐতিহ্য ও আধুনিক স্বাচ্ছন্দ্যের আতিথেয়তা"
      // Highlight "বাংলার ঐতিহ্য" in maroon and the rest in deep green
      const splitPoint = 13; // "বাংলার ঐতিহ্য" is 13 graphemes
      const graphemes = Array.from(typedText);
      const part1 = graphemes.slice(0, splitPoint).join('');
      const part2 = graphemes.slice(splitPoint).join('');

      return (
        <span className="typed-headline-text bn-font">
          {part1 && <span className="hero-headline-accent">{part1}</span>}
          {part2 && <span className="hero-headline-dark">{part2}</span>}
        </span>
      );
    }
  }
];

export default function HeroSlider({ onOpenBooking }) {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentHeadline = HEADLINES[headlineIndex];
  // Break into graphemes to safely support Bengali Unicode combinations
  const graphemes = Array.from(currentHeadline.fullText);

  useEffect(() => {
    let timer;

    if (!isDeleting) {
      if (displayedCount < graphemes.length) {
        // Typing: 90ms per character
        timer = setTimeout(() => {
          setDisplayedCount((prev) => prev + 1);
        }, 90);
      } else {
        // Full headline typed: Pause for 3000ms (3 seconds)
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 3000);
      }
    } else {
      if (displayedCount > 0) {
        // Deleting: 40ms per character
        timer = setTimeout(() => {
          setDisplayedCount((prev) => prev - 1);
        }, 40);
      } else {
        // Completely deleted: switch to next headline
        setIsDeleting(false);
        setHeadlineIndex((prev) => (prev + 1) % HEADLINES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedCount, isDeleting, headlineIndex, graphemes.length]);

  const currentTypedText = graphemes.slice(0, displayedCount).join('');

  const handleBookingClick = () => {
    if (onOpenBooking) {
      onOpenBooking();
    }
  };

  return (
    <section className="bengali-hero full-width-hero" aria-label="Hero Section">
      {/* FULL-WIDTH YELLOW BENGALI FOLK-ART BACKGROUND */}
      <div className="hero-full-bg" aria-hidden="true">
        <img
          src="/images/art6.jpg"
          alt=""
          className="hero-bg-image"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* Subtle cream translucent gradient overlay over left text area only */}
      <div className="hero-overlay-scrim" aria-hidden="true"></div>

      {/* Subtle alpona decorative watermark */}
      <div className="hero-alpona-watermark" aria-hidden="true"></div>

      <div className="hero-container">
        {/* ====== LEFT SIDE: Hero Content Overlay ====== */}
        <div className="hero-content">
          <span className="hero-eyebrow">YOUR HOME AWAY FROM HOME</span>

          {/* Reserved height container to prevent layout jumping */}
          <div className="hero-headline-container">
            <h1 className="hero-headline-animated">
              {currentHeadline.render(currentTypedText)}
              <span className="hero-cursor" aria-hidden="true">|</span>
            </h1>
          </div>

          <p className="hero-description">
            Comfortable rooms, delicious traditional food, and warm Bengali hospitality—all in one place.
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
            <span>✦ 9 Rooms</span>
            <span>✦ Multi-Cuisine Restaurant</span>
            <span>✦ 24/7 Service</span>
          </div>
        </div>
      </div>

      {/* ====== BOTTOM DECORATIVE STRIP — Warli folk art border ====== */}
      <div className="hero-bottom-art-strip" aria-hidden="true">
        <img
          src="/images/art3.jpg"
          alt="Bengali Folk Art Border"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    </section>
  );
}
