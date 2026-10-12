import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bed, Maximize2, ArrowRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { ROOM_TYPES, ROOM_CATEGORIES } from '../data/hotelData'; // Fallbacks
import './RoomsPage.css'; // We'll create this to override BengaliPages.css

export default function RoomsPage({ onOpenBooking }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('status', 'available');

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Deduplicate by room_type_id to show only 1 card per room category, or show all.
          // Let's show unique types.
          const uniqueTypes = [];
          const seen = new Set();
          data.forEach(r => {
            if (!seen.has(r.room_type_id)) {
              seen.add(r.room_type_id);
              
              // find full info from ROOM_TYPES if possible
              const fallbackInfo = ROOM_TYPES.find(rt => rt.id === r.room_type_id) || {};
              uniqueTypes.push({
                ...fallbackInfo,
                ...r,
                id: r.id, // keep the supabase physical room ID or type ID? Let's use type ID for routing.
                actual_id: r.id,
                name: r.name || fallbackInfo.name || `Room ${r.room_number}`,
                image: r.image_url || fallbackInfo.image,
                price: r.price || fallbackInfo.price,
                description: fallbackInfo.description || 'Comfortable accommodation with traditional touches.'
              });
            }
          });
          setRooms(uniqueTypes);
        } else {
          setRooms(ROOM_TYPES); // Fallback to static
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setRooms(ROOM_TYPES); // Fallback
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
  }, []);

  const filteredRooms = activeCategory === 'all'
    ? rooms
    : rooms.filter(r => r.room_type_id === activeCategory || r.typeId === activeCategory || r.category === activeCategory);

  return (
    <div className="bengali-page">
      {/* Page Hero - Collage style */}
      <section className="bengali-page-hero editorial-hero">
        <div className="hero-texture-overlay"></div>
        <img src="/images/art7.jpg" className="editorial-hero-bg" alt="Alpana Motif" />
        
        <div className="section-wrapper text-center relative z-2">
          <span className="page-eyebrow">COMFORTABLE ACCOMMODATION</span>
          <h1 className="page-title">Rooms Designed for <br/>Rest & Relaxation</h1>
          <p className="page-description">
            Discover thoughtfully curated living spaces designed for ultimate relaxation. 
            Experience our traditional hospitality across our elegant rooms.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="page-filter-strip">
        <div className="section-wrapper">
          <div className="bengali-category-pills">
            {ROOM_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`bengali-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Rooms Listing - Editorial Art Direction */}
      <section className="rooms-editorial-section">
        <div className="section-wrapper">
          {loading ? (
            <div className="text-center py-10">Loading rooms...</div>
          ) : (
            <div className="editorial-rooms-list">
              {filteredRooms.map((room, idx) => (
                <div key={room.id || idx} className="editorial-room-row">
                  {/* Decorative element overlapping */}
                  <img src="/images/art3.jpg" className="room-row-decor" alt="Folk Decor" />
                  
                  <div className="room-row-image">
                    <img src={room.image} alt={room.name} />
                    <div className="room-price-badge">
                      <span>₹{(room.pricePerNight || room.price).toLocaleString()}</span>
                      <small>/ night</small>
                    </div>
                  </div>
                  
                  <div className="room-row-content">
                    <span className="room-floor">{room.floorInfo || 'AMONTRON LODGE'}</span>
                    <h2 className="room-name">{room.name}</h2>
                    <p className="room-desc">{room.description}</p>
                    
                    <div className="room-specs-row">
                      <span className="spec"><Users size={16} /> {room.capacity || '2 Guests'}</span>
                      <span className="spec"><Bed size={16} /> {room.bedType || '1 Double Bed'}</span>
                      <span className="spec"><Maximize2 size={16} /> {room.size || `${room.sqft || 240} sq.ft.`}</span>
                    </div>

                    <div className="room-features-grid">
                      {(room.features || ['Air Conditioning', 'Free Wi-Fi', 'Room Service', 'Attached Bath']).slice(0, 4).map((feat, i) => (
                        <div key={i} className="feature-tick">
                          <Check size={16} className="text-terracotta" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    <div className="room-row-actions">
                      <Link to={`/rooms`} className="btn-outline-gold text-center">
                        VIEW DETAILS
                      </Link>
                      <button className="btn-terracotta" onClick={() => onOpenBooking(room)}>
                        BOOK NOW <ArrowRight size={16} style={{marginLeft: '8px'}}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
