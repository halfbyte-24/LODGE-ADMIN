import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bed, Calendar, MessageCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { contactRoutingService } from '../services/contactRoutingService';
import './Experiences.css';

const DEFAULT_ROOM_TYPES = [
  {
    id: 'standard-room',
    name: 'Standard Room',
    type: 'Standard Room',
    price: 500,
    capacity: '2 Guests',
    bedType: '1 Double Bed',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'deluxe-room',
    name: 'Deluxe Room',
    type: 'Deluxe Room',
    price: 1500,
    capacity: '2 Adults + 1 Child',
    bedType: '1 King Bed',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'super-deluxe-room',
    name: 'Super Deluxe Room',
    type: 'Super Deluxe Room',
    price: 2000,
    capacity: '3 Adults or Family',
    bedType: '1 Super King Bed',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=85'
  }
];

export default function ExperienceSection({ onSelectRoom, onQuickView }) {
  const [rooms, setRooms] = useState(DEFAULT_ROOM_TYPES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRooms() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('room_number', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Categorize and find lowest starting price for each tier
          const standardRooms = data.filter(r => (r.category || r.room_type || '').toLowerCase().includes('standard'));
          const deluxeRooms = data.filter(r => {
            const cat = (r.category || r.room_type || '').toLowerCase();
            return cat.includes('deluxe') && !cat.includes('super');
          });
          const superDeluxeRooms = data.filter(r => (r.category || r.room_type || '').toLowerCase().includes('super'));

          const getMinPrice = (arr, fallback) => {
            if (!arr || arr.length === 0) return fallback;
            const prices = arr.map(r => Number(r.price_per_night || r.price)).filter(p => !isNaN(p) && p > 0);
            return prices.length > 0 ? Math.min(...prices) : fallback;
          };

          const stdPrice = getMinPrice(standardRooms, 500);
          const dlxPrice = getMinPrice(deluxeRooms, 1500);
          const supPrice = getMinPrice(superDeluxeRooms, 2000);

          const mapped = [
            {
              id: 'standard-room',
              name: 'Standard Room',
              type: 'Standard Room',
              price: stdPrice,
              capacity: '2 Guests',
              bedType: '1 Double Bed',
              image: standardRooms[0]?.image_url || DEFAULT_ROOM_TYPES[0].image
            },
            {
              id: 'deluxe-room',
              name: 'Deluxe Room',
              type: 'Deluxe Room',
              price: dlxPrice,
              capacity: '2 Adults + 1 Child',
              bedType: '1 King Bed',
              image: deluxeRooms[0]?.image_url || DEFAULT_ROOM_TYPES[1].image
            },
            {
              id: 'super-deluxe-room',
              name: 'Super Deluxe Room',
              type: 'Super Deluxe Room',
              price: supPrice,
              capacity: '3 Adults or Family',
              bedType: '1 Super King Bed',
              image: superDeluxeRooms[0]?.image_url || DEFAULT_ROOM_TYPES[2].image
            }
          ];
          setRooms(mapped);
        }
      } catch (err) {
        console.warn('ExperienceSection: Error loading rooms from Supabase, using defaults:', err);
        setRooms(DEFAULT_ROOM_TYPES);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  const handleWhatsAppEnquiry = async (room) => {
    const res = await contactRoutingService.getBookingWhatsAppAction({
      roomName: room.name,
      totalAmount: room.price
    });

    if (res.configured && res.url) {
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } else {
      alert(res.errorMessage || 'Room Booking WhatsApp recipient is not configured in Admin Settings. Please call the hotel at +91 94334 24718.');
    }
  };

  return (
    <div className="bengali-experience-wrapper">
      {/* 7. ROOMS SECTION */}
      <section className="bengali-rooms-section" id="rooms">
        <div className="section-wrapper">
          <div className="section-header-compact">
            <span className="section-eyebrow">OUR ROOMS</span>
            <h2 className="section-title">Stay in Comfort</h2>
            <p className="experience-desc">
              Well-furnished rooms with modern amenities, crisp AC, and a touch of traditional Bengali aesthetics.
            </p>
            <Link to="/rooms" className="about-cta-link mb-8">
              Explore All 9 Rooms Across 3 Floors <span className="cta-arrow">&rarr;</span>
            </Link>
          </div>

          <div className="experience-rooms-3col">
            {rooms.map((room) => (
              <div key={room.id} className="editorial-room-card">
                <div className="room-image-wrapper">
                  <img 
                    src={room.image} 
                    alt={room.name} 
                    onError={(e) => { e.currentTarget.src = DEFAULT_ROOM_TYPES[0].image; }}
                  />
                  <div className="room-price-tag">₹{(room.price || 0).toLocaleString('en-IN')} / night</div>
                </div>
                <div className="room-card-info">
                  <h3>{room.name}</h3>
                  <div className="room-specs">
                    <span><Users size={14}/> {room.capacity}</span>
                    <span><Bed size={14}/> {room.bedType}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="btn-terracotta"
                      style={{ flex: 1, padding: '0.65rem 0.5rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => onSelectRoom ? onSelectRoom(room) : null}
                    >
                      <Calendar size={14} className="mr-1"/> BOOK NOW
                    </button>
                    <button
                      type="button"
                      className="btn-outline-gold"
                      style={{ padding: '0.65rem 0.75rem', cursor: 'pointer', background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Enquire on WhatsApp"
                      onClick={() => handleWhatsAppEnquiry(room)}
                    >
                      <MessageCircle size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative separator border */}
      <div className="bengali-folk-divider">
        <img 
          src="/images/art6.jpg" 
          alt="Bengali Folk Art Pattern" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* 8. RESTAURANT SECTION */}
      <section className="bengali-restaurant-section" id="restaurant">
        <div className="section-wrapper">
          <div className="restaurant-showcase-grid">
            <div className="restaurant-text-col">
              <span className="section-eyebrow">OUR RESTAURANT</span>
              <h2 className="section-title">Taste the <br/>Tradition</h2>
              <p className="experience-desc">
                Relish authentic Bengali cuisine prepared with love and tradition near Kamarpukur.
              </p>
              <Link to="/restaurant" className="btn-terracotta inline-flex items-center gap-2 mt-4">
                View Menu <span>&rarr;</span>
              </Link>
            </div>

            <div className="restaurant-visual-col">
              <div className="restaurant-image-container">
                <img 
                  src="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=85" 
                  className="restaurant-food-art" 
                  alt="Authentic Bengali & Indian Cuisine" 
                  onError={(e) => { e.currentTarget.src = '/images/art4.jpg'; }}
                />
                <div className="restaurant-accent-badge">
                  <span>Authentic Bengali Recipes</span>
                  <strong>Taste the Tradition</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
