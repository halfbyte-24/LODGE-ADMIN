import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import RestaurantPage from './pages/RestaurantPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FacilitiesPage from './pages/FacilitiesPage';
import GalleryPage from './pages/GalleryPage';
import LocationPage from './pages/LocationPage';
import RoomDetailPage from './pages/RoomDetailPage';
import BookingPage from './pages/BookingPage';
import BookingModal from './components/BookingModal';
import ManageBookingsModal from './components/ManageBookingsModal';
import RoomModal from './components/RoomModal';
import SupabaseInfoModal from './components/SupabaseInfoModal';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState({});
  const [quickViewRoom, setQuickViewRoom] = useState(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isSupabaseInfoOpen, setIsSupabaseInfoOpen] = useState(false);

  const handleOpenBooking = (initialData = {}) => {
    // Navigate directly to dedicated /booking route
    navigate('/booking', { state: initialData });
  };

  const handleSelectRoom = (room) => {
    // Navigate directly to dedicated /booking route with selected room
    navigate('/booking', { state: { room } });
  };

  const handleQuickView = (room) => {
    setQuickViewRoom(room);
  };

  return (
    <div className="amontron-app">
      <ScrollToTop />
      <Navbar 
        onOpenBooking={() => handleOpenBooking()}
        onOpenLookup={() => setIsLookupOpen(true)}
        onOpenSupabaseInfo={() => setIsSupabaseInfoOpen(true)}
      />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage onOpenBooking={handleOpenBooking} onSelectRoom={handleSelectRoom} onQuickView={handleQuickView} />} />
          <Route path="/rooms" element={<RoomsPage onOpenBooking={handleOpenBooking} onSelectRoom={handleSelectRoom} onQuickView={handleQuickView} />} />
          <Route path="/room/:id" element={<RoomDetailPage onOpenBooking={handleOpenBooking} />} />
          <Route path="/restaurant" element={<RestaurantPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/booking" element={<BookingPage />} />
        </Routes>
      </main>

      <Footer 
        onOpenBooking={() => handleOpenBooking()}
        onOpenLookup={() => setIsLookupOpen(true)}
      />

      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialData={bookingInitialData}
      />

      <RoomModal 
        room={quickViewRoom}
        onClose={() => setQuickViewRoom(null)}
        onSelectRoom={handleSelectRoom}
      />

      <ManageBookingsModal 
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />

      <SupabaseInfoModal 
        isOpen={isSupabaseInfoOpen}
        onClose={() => setIsSupabaseInfoOpen(false)}
      />
    </div>
  );
}
