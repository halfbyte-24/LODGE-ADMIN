import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { BedDouble, RefreshCw } from 'lucide-react';

export default function RoomsManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const loadRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Failed to load rooms: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const updateStatus = async (roomId, newStatus) => {
    setUpdating(true);
    setActionMessage({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', roomId);

      if (error) throw error;
      setActionMessage({ type: 'success', text: `Room status updated to ${newStatus}.` });
      await loadRooms();
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Failed to update room: ' + err.message });
    } finally {
      setUpdating(false);
    }
  };

  const floors = useMemo(() => {
    const grouped = { '1st Floor': [], '2nd Floor': [], '3rd Floor': [] };
    rooms.forEach(r => {
      const flKey = r.floor?.includes('1') ? '1st Floor' : r.floor?.includes('2') ? '2nd Floor' : '3rd Floor';
      if (!grouped[flKey]) grouped[flKey] = [];
      grouped[flKey].push(r);
    });
    return grouped;
  }, [rooms]);

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Room Inventory &amp; Status</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Staff view for all 9 rooms (Floor 1, 2, 3) • 2 Double Beds per Room.</p>
        </div>
        <button className="btn btn-outline" onClick={loadRooms} disabled={loading} style={{ minHeight: '40px' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {actionMessage.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: actionMessage.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: actionMessage.type === 'error' ? '#991b1b' : '#065f46'
        }}>
          {actionMessage.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading rooms...</div>
      ) : (
        <div>
          {Object.entries(floors).map(([floorName, floorRooms]) => (
            <div key={floorName} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <BedDouble size={22} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{floorName}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({floorRooms.length} Rooms • 2 Double Beds per Room)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
                {floorRooms.map(room => (
                  <div key={room.id} className="card" style={{ padding: '1.5rem', borderTop: `4px solid ${room.status === 'available' ? '#10b981' : room.status === 'occupied' ? '#ef4444' : '#f59e0b'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.35rem', fontWeight: 'bold' }}>Room {room.room_number}</span>
                      <span style={{ 
                        padding: '0.25rem 0.65rem', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        background: room.status === 'available' ? '#d1fae5' : room.status === 'occupied' ? '#fee2e2' : '#fef3c7',
                        color: room.status === 'available' ? '#065f46' : room.status === 'occupied' ? '#991b1b' : '#92400e'
                      }}>
                        {room.status === 'occupied' ? 'BOOKED / OCCUPIED' : room.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {room.room_type} • 2 Double Beds • Max {room.max_guests || 4} Guests
                    </div>

                    {/* View Only Room Rate (Configured by Admin) */}
                    <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Rate / Night</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)' }}>₹{Number(room.price_per_night).toFixed(2)}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Rate set by Admin</span>
                    </div>
                    
                    {/* Status Toggle for staff operation */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {room.status !== 'available' && (
                        <button 
                          className="btn btn-outline" 
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                          onClick={() => updateStatus(room.id, 'available')}
                          disabled={updating}
                        >
                          Mark Available
                        </button>
                      )}
                      {room.status !== 'occupied' && (
                        <button 
                          className="btn btn-outline" 
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', borderColor: '#fca5a5', color: '#dc2626' }}
                          onClick={() => updateStatus(room.id, 'occupied')}
                          disabled={updating}
                        >
                          Mark Booked
                        </button>
                      )}
                      {room.status !== 'cleaning' && (
                        <button 
                          className="btn btn-outline" 
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                          onClick={() => updateStatus(room.id, 'cleaning')}
                          disabled={updating}
                        >
                          Cleaning
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
