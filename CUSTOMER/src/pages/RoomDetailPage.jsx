import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Bed, 
  Maximize2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Calendar,
  ShieldCheck,
  Coffee,
  Check
} from 'lucide-react';
import { getRoomById, getAllRoomTypes } from '../lib/roomService';
import './Pages.css';

export default function RoomDetailPage({ onOpenBooking }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    getRoomById(id).then(res => {
      if (res.data) {
        setRoom(res.data);
      } else {
        getAllRoomTypes().then(r => setRoom(r.data[0]));
      }
    });
    getAllRoomTypes().then(res => setAllRooms(res.data || []));
    setActiveImageIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (!room) {
    return (
      <div className="page-loading-wrap">
        <div className="loading-spinner" />
        <p>Loading room details...</p>
      </div>
    );
  }

  const gallery = room.gallery && room.gallery.length > 0 ? room.gallery : [room.image];
  const relatedRooms = allRooms.filter(r => r.id !== room.id);

  return (
    <div className="bengali-page room-detail-page">
      <div className="detail-breadcrumb-strip" style={{borderBottom: '1px solid var(--border-subtle)', padding: '16px 0'}}>
        <div className="section-wrapper breadcrumb-inner" style={{display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem'}}>
          <Link to="/rooms" className="back-link" style={{display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-terracotta)', textDecoration: 'none', fontWeight: 600}}>
            <ArrowLeft size={16} />
            <span>All Accommodations</span>
          </Link>
          <span style={{color: 'var(--text-secondary)'}}>/</span>
          <span style={{color: 'var(--text-secondary)'}}>{room.name}</span>
        </div>
      </div>

      <div className="section-wrapper detail-main-layout" style={{display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '50px', padding: '50px 0'}}>
        
        <div className="detail-gallery-column">
          <div style={{position: 'relative', borderRadius: '2px', overflow: 'hidden', height: '480px', border: '1px solid var(--border-subtle)'}}>
            <img 
              src={gallery[activeImageIndex]} 
              alt={room.name} 
              style={{width: '100%', height: '100%', objectFit: 'cover'}} 
            />
            {gallery.length > 1 && (
              <>
                <button 
                  className="gallery-nav-btn prev"
                  onClick={() => setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                  style={{position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', background: 'white', color: 'var(--accent-terracotta)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  className="gallery-nav-btn next"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % gallery.length)}
                  style={{position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', background: 'white', color: 'var(--accent-terracotta)', border: '1px solid var(--border-subtle)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'}}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {gallery.length > 1 && (
            <div style={{display: 'flex', gap: '12px', marginTop: '16px'}}>
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{width: '90px', height: '65px', borderRadius: '2px', overflow: 'hidden', border: `2px solid ${idx === activeImageIndex ? 'var(--accent-terracotta)' : 'transparent'}`, padding: 0, background: 'none', cursor: 'pointer'}}
                >
                  <img src={imgUrl} alt={`${room.name} thumbnail ${idx + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </button>
              ))}
            </div>
          )}

          <div style={{marginTop: '40px', padding: '30px', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '2px', boxShadow: 'var(--shadow-sm)'}}>
            <h3 style={{fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '16px'}}>About This Room</h3>
            <p style={{fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '16px'}}>{room.description}</p>
            <p style={{fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)'}}>
              Every detail has been curated to provide unmatched relaxation, impeccable hygiene, and 
              contemporary conveniences. Our housekeeping team ensures the highest standard of sanitization.
            </p>
          </div>

          <div style={{marginTop: '30px', padding: '30px', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '2px', boxShadow: 'var(--shadow-sm)'}}>
            <h3 style={{fontFamily: 'Cormorant Garamond', fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '20px'}}>Room Features & Amenities</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              {(room.features || room.amenities || []).map((feat, i) => (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', color: 'var(--text-secondary)'}}>
                  <Check size={16} className="text-terracotta" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside>
          <div style={{position: 'sticky', top: '100px', padding: '40px', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '2px', boxShadow: 'var(--shadow-md)'}}>
            <div style={{fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '8px'}}>{room.floorInfo || 'AMONTRON ACCOMMODATION'}</div>
            <h1 style={{fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--text-primary)', marginBottom: '16px'}}>{room.name}</h1>
            
            <div style={{display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--badge-veg)', background: 'rgba(74, 222, 128, 0.1)', padding: '6px 12px', borderRadius: '4px', marginBottom: '24px'}}>
              <CheckCircle2 size={16} />
              <span style={{fontWeight: 600}}>Available for Booking</span>
            </div>

            <div style={{marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)'}}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: '4px'}}>
                <span style={{fontSize: '1.4rem', color: 'var(--accent-terracotta)'}}>₹</span>
                <span style={{fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)'}}>{(room.pricePerNight || room.price).toLocaleString()}</span>
                <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>/ night</span>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem'}}>
                <span style={{color: 'var(--text-secondary)'}}>Capacity</span>
                <span style={{color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500}}><Users size={16} className="text-gold" /> {room.capacity}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem'}}>
                <span style={{color: 'var(--text-secondary)'}}>Bed Type</span>
                <span style={{color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500}}><Bed size={16} className="text-gold" /> {room.bedType}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem'}}>
                <span style={{color: 'var(--text-secondary)'}}>Area</span>
                <span style={{color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500}}><Maximize2 size={16} className="text-gold" /> {room.size || `${room.sqft} sq. ft.`}</span>
              </div>
            </div>

            <button
              className="btn-terracotta w-100"
              style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontSize: '1.1rem'}}
              onClick={() => onOpenBooking({ room })}
            >
              <Calendar size={18} style={{marginRight: '8px'}} />
              <span>BOOK THIS ROOM</span>
            </button>

            <div style={{marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                <CheckCircle2 size={16} className="text-terracotta" />
                <span>Best Rate Guaranteed Online</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                <CheckCircle2 size={16} className="text-terracotta" />
                <span>Zero Hidden Reservation Fees</span>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {relatedRooms.length > 0 && (
        <section style={{padding: '80px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)'}}>
          <div className="section-wrapper">
            <div className="text-center" style={{marginBottom: '40px'}}>
              <span className="page-eyebrow">EXPLORE ALTERNATIVES</span>
              <h2 style={{fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', color: 'var(--text-primary)'}}>Other Room Types</h2>
              <div className="page-title-line" style={{margin: '16px auto'}} />
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px'}}>
              {relatedRooms.map((relRoom) => (
                <div key={relRoom.id} style={{background: 'white', border: '1px solid var(--border-subtle)', borderRadius: '2px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)'}}>
                  <div style={{position: 'relative', height: '220px'}}>
                    <img src={relRoom.image} alt={relRoom.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                    <span style={{position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.95)', padding: '6px 12px', color: 'var(--accent-terracotta)', fontWeight: 600, borderRadius: '4px'}}>₹{(relRoom.pricePerNight || relRoom.price).toLocaleString()} / night</span>
                  </div>
                  <div style={{padding: '24px'}}>
                    <h4 style={{fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: '8px'}}>{relRoom.name}</h4>
                    <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px'}}>{relRoom.capacity} • {relRoom.bedType}</p>
                    <div style={{display: 'flex', gap: '12px'}}>
                      <Link to={`/room/${relRoom.id}`} className="btn-outline-gold" style={{flex: 1, textAlign: 'center', fontSize: '0.85rem', padding: '10px'}}>VIEW</Link>
                      <button className="btn-terracotta" style={{flex: 1, padding: '10px', fontSize: '0.85rem'}} onClick={() => onOpenBooking({ room: relRoom })}>BOOK NOW</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
