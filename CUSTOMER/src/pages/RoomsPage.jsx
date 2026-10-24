import React, { useState, useEffect } from 'react';
import { Wind, MessageCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { PHYSICAL_ROOMS, ROOM_TYPES } from '../data/hotelData';
import { contactRoutingService } from '../services/contactRoutingService';
import { useHotelSettings } from '../context/HotelSettingsContext';
import './RoomsPage.css';

// Build authoritative list of all 9 rooms combining physical inventory and room type details
function buildAll9Rooms() {
  return PHYSICAL_ROOMS.map((phys) => {
    const typeInfo = ROOM_TYPES.find((rt) => rt.id === phys.room_type_id) || ROOM_TYPES[0];
    const isAC = phys.room_type_id !== 'non-ac-room'; // all standard/deluxe/super deluxe are AC
    return {
      ...typeInfo,
      ...phys,
      id: phys.id,
      room_number: phys.room_number,
      floor: phys.floor,
      room_type_id: phys.room_type_id,
      name: `Room ${phys.room_number} - ${typeInfo.name}`,
      shortName: `Room ${phys.room_number}`,
      typeName: typeInfo.name,
      price: phys.price,
      pricePerNight: phys.price,
      ac: isAC,
      acStatus: isAC ? 'AC Room' : 'Non-AC Room',
      status: phys.status || 'available',
      image: typeInfo.image,
      floorLabel: `Floor ${phys.floor}`,
      facilities: typeInfo.amenities?.slice(0, 4) || ['Air Conditioning', 'Free Wi-Fi', 'Geyser', 'Room Service']
    };
  });
}

const FLOOR_FILTERS = [
  { id: 'all', label: 'All 9 Rooms' },
  { id: '1', label: 'Floor 1 (Rooms 101–103)' },
  { id: '2', label: 'Floor 2 (Rooms 201–203)' },
  { id: '3', label: 'Floor 3 (Rooms 301–303)' }
];

export default function RoomsPage({ onOpenBooking, onSelectRoom, onQuickView }) {
  const { hotelSettings } = useHotelSettings();
  const checkIn = hotelSettings.timings?.checkIn || hotelSettings.check_in_time || '12:00 PM';
  const checkOut = hotelSettings.timings?.checkOut || hotelSettings.check_out_time || '11:00 AM';
  const [activeFloor, setActiveFloor] = useState('all');
  const [rooms, setRooms] = useState(() => buildAll9Rooms());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchFromSupabase() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .order('room_number', { ascending: true });

        if (!error && data && data.length > 0) {
          // Merge with type information
          const merged = data.map((r) => {
            const floorNum = parseInt(String(r.floor || r.room_number?.charAt(0) || 1).replace(/\D/g, ''), 10) || 1;
            const typeKey = (r.room_type || r.room_type_id || '').toLowerCase();
            const typeInfo = ROOM_TYPES.find(rt => 
              rt.id === r.room_type_id || 
              rt.name.toLowerCase().includes(typeKey)
            ) || ROOM_TYPES[0];

            return {
              ...typeInfo,
              ...r,
              id: r.id,
              room_number: r.room_number,
              floor: floorNum,
              floorLabel: `Floor ${floorNum}`,
              name: `Room ${r.room_number} - ${r.room_type || typeInfo.name}`,
              shortName: `Room ${r.room_number}`,
              typeName: r.room_type || typeInfo.name,
              price: Number(r.price_per_night || r.price || typeInfo.price),
              pricePerNight: Number(r.price_per_night || r.price || typeInfo.price),
              ac: r.ac !== undefined ? r.ac : true,
              acStatus: (r.ac !== undefined ? r.ac : true) ? 'AC Room' : 'Non-AC Room',
              status: r.status || 'available',
              image: r.image_url || typeInfo.image,
              facilities: typeInfo.amenities?.slice(0, 4) || ['Air Conditioning', 'Free Wi-Fi', 'Geyser', 'Room Service']
            };
          });
          setRooms(merged);
        }
      } catch (err) {
        // Fallback to authoritative 9 physical rooms
        setRooms(buildAll9Rooms());
      }
    }

    fetchFromSupabase();
  }, []);

  const filteredRooms = activeFloor === 'all'
    ? rooms
    : rooms.filter(r => String(r.floor) === String(activeFloor));

  const handleBook = (room) => {
    if (onSelectRoom) {
      onSelectRoom(room);
    } else if (onOpenBooking) {
      onOpenBooking({ room });
    }
  };

  const handleDetails = (room) => {
    if (onQuickView) {
      onQuickView(room);
    }
  };

  return (
    <div className="bengali-page rooms-page-container">
      {/* Compact Page Hero */}
      <section className="rooms-page-hero">
        <div className="section-wrapper text-center">
          <span className="page-eyebrow">AMONTRON ACCOMMODATIONS</span>
          <h1 className="page-title">All 9 Lodge Rooms Across 3 Floors</h1>
          <div className="page-title-line" />
          <p className="page-description">
            Each floor offers three thoughtfully appointed, clean, and air-conditioned rooms. 
            Enjoy modern comforts, high-speed Wi-Fi, and 24/7 attentive Bengali hospitality.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(197, 160, 89, 0.12)', border: '1px solid rgba(197, 160, 89, 0.3)', borderRadius: '30px', padding: '6px 18px', marginTop: '14px', fontSize: '0.88rem', color: 'var(--terracotta-dark, #8b3a2b)' }}>
            <Clock size={16} style={{ color: '#c5a059' }} />
            <span>Check-in: <strong>{checkIn}</strong> • Check-out: <strong>{checkOut}</strong></span>
          </div>
        </div>
      </section>

      {/* Floor Filter Strip */}
      <section className="rooms-filter-strip">
        <div className="section-wrapper">
          <div className="floor-filter-pills">
            {FLOOR_FILTERS.map(fl => (
              <button
                key={fl.id}
                className={`floor-pill ${activeFloor === fl.id ? 'active' : ''}`}
                onClick={() => setActiveFloor(fl.id)}
              >
                {fl.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 9 Rooms Grid */}
      <section className="rooms-grid-section">
        <div className="section-wrapper">
          {loading ? (
            <div className="text-center py-10">Loading inventory...</div>
          ) : (
            <div className="nine-rooms-grid">
              {filteredRooms.map((room) => (
                <article key={room.id} className="room-inventory-card">
                  {/* Card Media: Room Photograph */}
                  <div className="card-media-wrapper">
                    <img 
                      src={room.image} 
                      alt={`Room ${room.room_number}`} 
                      className="card-room-image"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=85";
                      }}
                    />
                    <div className="card-ac-tag">
                      <Wind size={12} />
                      <span>{room.ac ? 'AC' : 'Non-AC'}</span>
                    </div>
                  </div>

                  {/* Card Info: Essential details only */}
                  <div className="card-info-box">
                    <div className="card-heading-group">
                      <h3 className="card-room-number">Room {room.room_number}</h3>
                      <div className="card-room-type">{room.typeName}</div>
                    </div>

                    <div className="card-price-display">
                      <span className="price-val">₹{(room.price || 0).toLocaleString('en-IN')}</span>
                      <span className="price-unit">/ night</span>
                    </div>

                    {/* Actions: Book Room + optional View Details + WhatsApp */}
                    <div className="card-actions-row">
                      <button 
                        type="button"
                        className="btn-card-book" 
                        onClick={() => handleBook(room)}
                      >
                        Book Room
                      </button>
                      <button 
                        type="button"
                        className="btn-card-details" 
                        onClick={() => handleDetails(room)}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        className="btn-card-details"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', minWidth: '38px', color: '#16a34a' }}
                        title="Enquire on WhatsApp"
                        onClick={async () => {
                          const res = await contactRoutingService.getBookingWhatsAppAction({
                            roomName: room.name,
                            roomNumber: room.room_number,
                            totalAmount: room.price
                          });
                          if (res.configured && res.url) {
                            window.open(res.url, '_blank', 'noopener,noreferrer');
                          } else {
                            alert(res.errorMessage || 'Room Booking WhatsApp recipient is not configured in Admin Settings. Please call +91 94334 24718.');
                          }
                        }}
                      >
                        <MessageCircle size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

