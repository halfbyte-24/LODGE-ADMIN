import React from 'react';
import HeroSlider from '../components/HeroSlider';
import FloatingBookingBar from '../components/FloatingBookingBar';
import WelcomeIntro from '../components/WelcomeIntro';
import ExperienceSection from '../components/ExperienceSection';
import FacilitiesSection from '../components/FacilitiesSection';
import ContactSection from '../components/ContactSection';

export default function HomePage({ onOpenBooking, onSelectRoom, onQuickView }) {
  const handleCheckAvailability = (searchParams) => {
    onOpenBooking(searchParams);
  };

  return (
    <div className="homepage-content">
      <HeroSlider onOpenBooking={onOpenBooking} />
      <FloatingBookingBar onCheckAvailability={handleCheckAvailability} />
      <WelcomeIntro />
      <ExperienceSection 
        onSelectRoom={onSelectRoom}
        onQuickView={onQuickView}
      />
      <FacilitiesSection />
      <ContactSection />
    </div>
  );
}
