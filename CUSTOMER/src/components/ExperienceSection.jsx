import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bed, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './Experiences.css';

const DEFAULT_ROOM_TYPES = [
  {
    id: 'deluxe-room',
    name: 'Deluxe Room',
    type: 'Deluxe Room',
    price: 2499,
    capacity: '2 Guests',
    bedType: '1 King Bed',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'family-room',
    name: 'Family Room',
    type: 'Family Room',
    price: 3499,
    capacity: '4 Guests',
    bedType: '2 Double Beds',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'premium-room',
    name: 'Premium Room',
    type: 'Premium Room',
    price: 4299,
    capacity: '2 Guests',
    bedType: '1 Royal King Bed',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=85'
  }
];

export default function ExperienceSection({ onSelectRoom, onQuickView }) {
  const [rooms, setRooms] = useState(DEFAULT_ROOM_TYPES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .limit(3);

        if (error) throw error;
        
        if (data && data.length >= 3) {
          const mapped = [
            {
              id: 'deluxe-room',
              name: 'Deluxe Room',
              price: data[0].price || 2499,
              capacity: '2 Guests',
              bedType: '1 King Bed',
              image: data[0].image_url || DEFAULT_ROOM_TYPES[0].image
            },
            {
              id: 'family-room',
              name: 'Family Room',
              price: data[1].price || 3499,
              capacity: '4 Guests',
              bedType: '2 Double Beds',
              image: data[1].image_url || DEFAULT_ROOM_TYPES[1].image
            },
            {
              id: 'premium-room',
              name: 'Premium Room',
              price: data[2].price || 4299,
              capacity: '2 Guests',
              bedType: '1 Royal King Bed',
              image: data[2].image_url || DEFAULT_ROOM_TYPES[2].image
            }
          ];
          setRooms(mapped);
        }
      } catch (err) {
        setRooms(DEFAULT_ROOM_TYPES);
      }
    }

    fetchRooms();
  }, []);

  return (
    <div className="bengali-experience-wrapper">
      {/* 7. ROOMS SECTION */}
      <section className="bengali-rooms-section" id="rooms">
        <div className="section-wrapper">
          <div className="section-header-compact">
            <span className="section-eyebrow">OUR ROOMS</span>
            <h2 className="section-title">Stay in Comfort</h2>
            <p className="experience-desc">
              Well-furnished rooms with modern amenities and a touch of traditional Bengali aesthetics.
            </p>
            <Link to="/rooms" className="about-cta-link mb-8">
              Explore Rooms <span className="cta-arrow">&rarr;</span>
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
                  <div className="room-price-tag">₹{(room.price || 0).toLocaleString()} / night</div>
                </div>
                <div className="room-card-info">
                  <h3>{room.name}</h3>
                  <div className="room-specs">
                    <span><Users size={14}/> {room.capacity}</span>
                    <span><Bed size={14}/> {room.bedType}</span>
                  </div>
                  <button 
                    className="btn-terracotta btn-full"
                    onClick={() => onSelectRoom ? onSelectRoom(room) : null}
                  >
                    <Calendar size={14} className="mr-2"/> BOOK NOW
                  </button>
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
                Relish authentic Bengali cuisine prepared with love and tradition.
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
