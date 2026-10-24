import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BedDouble, 
  Check, 
  X, 
  RefreshCw, 
  Edit3, 
  DollarSign, 
  Save, 
  Sliders, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Wind,
  Image as ImageIcon,
  Wrench,
  Sparkles,
  Upload,
  Trash2,
  Camera
} from 'lucide-react';

export default function RoomsManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Quick Price Edit State
  const [editingPriceRoomId, setEditingPriceRoomId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  
  // Full Room Modal Edit State
  const [activeModalRoom, setActiveModalRoom] = useState(null);
  const [formData, setFormData] = useState({
    room_number: '',
    floor: '1st',
    room_type: 'Standard',
    price_per_night: '',
    ac: true,
    bed_type: 'Double Bed',
    max_guests: 2,
    image_url: '',
    description: '',
    status: 'available',
    is_active: true
  });

  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef(null);

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
      console.error('[RoomsManagement] Error loading rooms:', err);
      setActionMessage({ type: 'error', text: 'Failed to load rooms: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Quick Operational Status Update
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

  // Quick Price Save
  const handleSavePrice = async (roomId) => {
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid positive room rate.');
      return;
    }
    setUpdating(true);
    setActionMessage({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ price_per_night: priceNum, updated_at: new Date().toISOString() })
        .eq('id', roomId);

      if (error) throw error;
      setActionMessage({ type: 'success', text: 'Room rate updated successfully.' });
      setEditingPriceRoomId(null);
      await loadRooms();
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Failed to update room price: ' + err.message });
    } finally {
      setUpdating(false);
    }
  };

  // Open Full Room Modal
  const handleOpenEditModal = (room) => {
    setActiveModalRoom(room);
    setFormData({
      room_number: room.room_number || '',
      floor: room.floor || '1st',
      room_type: room.room_type || 'Standard',
      price_per_night: room.price_per_night || '',
      ac: room.ac !== false,
      bed_type: room.bed_type || 'Double Bed',
      max_guests: room.max_guests || 2,
      image_url: room.image_url || '',
      description: room.description || '',
      status: room.status || 'available',
      is_active: room.is_active !== false
    });
    setImagePreview(room.image_url || '');
    setUploadMessage({ type: '', text: '' });
    setUploadingImage(false);
    setShowManualUrl(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Image Upload Handlers
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadMessage({ 
        type: 'error', 
        text: 'Unsupported format. Please select a JPG, JPEG, PNG, or WebP photo.' 
      });
      return;
    }

    // Validate file size (max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setUploadMessage({ 
        type: 'error', 
        text: 'Image file is too large. Please choose a photo under 5 MB.' 
      });
      return;
    }

    // Immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);
    setUploadingImage(true);
    setUploadMessage({ type: 'info', text: 'Uploading photo to cloud storage...' });

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || (file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg');
      const safeRoomNo = String(formData.room_number || activeModalRoom?.room_number || 'room').replace(/\s+/g, '_');
      const storagePath = `rooms/room_${safeRoomNo}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('room-images')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('room-images')
        .getPublicUrl(uploadData.path);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error('Could not generate public storage URL.');

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      setUploadMessage({ 
        type: 'success', 
        text: 'Photo uploaded successfully! Click "Save Room Details" below to apply.' 
      });
    } catch (err) {
      console.error('[RoomsManagement] Image upload error:', err);
      setUploadMessage({ 
        type: 'error', 
        text: 'Upload failed: ' + (err.message || 'Please check your connection and try again.') 
      });
      setImagePreview(formData.image_url || '');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadMessage({ 
      type: 'info', 
      text: 'Photo removed. The room will use the default category photo once saved.' 
    });
  };

  const handleTriggerUpload = () => {
    if (uploadingImage) return;
    fileInputRef.current?.click();
  };

  // Save Full Room Details
  const handleSaveFullRoom = async (e) => {
    e.preventDefault();
    if (!activeModalRoom) return;

    const priceNum = parseFloat(formData.price_per_night);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price per night.');
      return;
    }

    setUpdating(true);
    setActionMessage({ type: '', text: '' });

    try {
      const updatePayload = {
        room_number: formData.room_number.trim(),
        floor: formData.floor.trim(),
        room_type: formData.room_type.trim(),
        price_per_night: priceNum,
        ac: Boolean(formData.ac),
        bed_type: formData.bed_type.trim(),
        max_guests: parseInt(formData.max_guests, 10) || 2,
        image_url: formData.image_url.trim() || null,
        status: formData.status,
        is_active: Boolean(formData.is_active),
        updated_at: new Date().toISOString()
      };

      // Try updating with description column
      try {
        const { error: fullErr } = await supabase
          .from('rooms')
          .update({
            ...updatePayload,
            description: formData.description.trim() || null
          })
          .eq('id', activeModalRoom.id);

        if (fullErr) {
          // If description column doesn't exist yet, retry without description
          await supabase
            .from('rooms')
            .update(updatePayload)
            .eq('id', activeModalRoom.id);
        }
      } catch {
        await supabase
          .from('rooms')
          .update(updatePayload)
          .eq('id', activeModalRoom.id);
      }

      setActionMessage({ type: 'success', text: `Room ${formData.room_number} details saved successfully.` });
      setActiveModalRoom(null);
      await loadRooms();
    } catch (err) {
      console.error('[RoomsManagement] Full room save error:', err);
      setActionMessage({ type: 'error', text: 'Failed to save room details: ' + err.message });
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
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Room Management &amp; Pricing</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Admin-only controls for all 9 hotel rooms, nightly rates, bed types, AC &amp; availability.
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadRooms} disabled={loading} style={{ minHeight: '40px' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {actionMessage.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: actionMessage.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: actionMessage.type === 'error' ? '#991b1b' : '#065f46',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}>
          {actionMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          Loading room inventory from database...
        </div>
      ) : (
        <div>
          {Object.entries(floors).map(([floorName, floorRooms]) => (
            <div key={floorName} style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <BedDouble size={22} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{floorName}</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ({floorRooms.length} Rooms • Admin Configured Rates &amp; Inventory)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
                {floorRooms.map(room => (
                  <div 
                    key={room.id} 
                    className="card" 
                    style={{ 
                      padding: '1.25rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      borderTop: `4px solid ${
                        room.status === 'available' ? '#10b981' : 
                        room.status === 'occupied' ? '#ef4444' : 
                        room.status === 'maintenance' ? '#ea580c' : 
                        room.status === 'cleaning' ? '#f59e0b' : '#3b82f6'
                      }`,
                      opacity: room.is_active === false ? 0.6 : 1
                    }}
                  >
                    <div>
                      {/* Top Row: Room number & status badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>Room {room.room_number}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                            ({room.floor} Floor)
                          </span>
                        </div>
                        <span style={{ 
                          padding: '0.25rem 0.65rem', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          background: 
                            room.status === 'available' ? '#d1fae5' : 
                            room.status === 'occupied' ? '#fee2e2' : 
                            room.status === 'maintenance' ? '#ffedd5' : 
                            room.status === 'cleaning' ? '#fef3c7' : '#e0e7ff',
                          color: 
                            room.status === 'available' ? '#065f46' : 
                            room.status === 'occupied' ? '#991b1b' : 
                            room.status === 'maintenance' ? '#c2410c' : 
                            room.status === 'cleaning' ? '#92400e' : '#3730a3'
                        }}>
                          {room.status === 'occupied' ? 'BOOKED' : room.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Room Photo Thumbnail on Card */}
                      {room.image_url ? (
                        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.85rem', background: '#0f172a' }}>
                          <img 
                            src={room.image_url} 
                            alt={`Room ${room.room_number}`} 
                            style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            📷 Custom Photo
                          </span>
                        </div>
                      ) : null}

                      {/* Specs Row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {room.room_type}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: room.ac ? '#e0f2fe' : '#f3f4f6', color: room.ac ? '#0369a1' : '#4b5563', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          {room.ac ? 'AC Room' : 'Non-AC'}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          🛏️ {room.bed_type || 'Double Bed'}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          👥 Max {room.max_guests || 2}
                        </span>
                      </div>

                      {room.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {room.description}
                        </p>
                      )}

                      {/* Price Configuration Box */}
                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                        {editingPriceRoomId === room.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>₹</span>
                            <input 
                              type="number"
                              className="input"
                              style={{ width: '110px', padding: '0.35rem 0.5rem', fontSize: '0.9rem' }}
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              placeholder="Price"
                              min="1"
                            />
                            <button 
                              className="btn btn-success" 
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                              onClick={() => handleSavePrice(room.id)}
                              disabled={updating}
                            >
                              <Save size={14} style={{ marginRight: 2 }} /> Save
                            </button>
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                              onClick={() => setEditingPriceRoomId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Rate / Night</span>
                              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                                ₹{Number(room.price_per_night).toFixed(2)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                onClick={() => {
                                  setEditingPriceRoomId(room.id);
                                  setEditPrice(room.price_per_night);
                                }}
                                title="Quick Edit Price"
                              >
                                <Edit3 size={13} /> Rate
                              </button>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                onClick={() => handleOpenEditModal(room)}
                                title="Edit Full Room Specs"
                              >
                                <Sliders size={13} /> Manage
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Operational Status Actions */}
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                        Operational Status
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem' }}>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.35rem 0.25rem', 
                            fontSize: '0.7rem', 
                            background: room.status === 'available' ? '#10b981' : '#f1f5f9',
                            color: room.status === 'available' ? '#ffffff' : '#334155'
                          }}
                          onClick={() => updateStatus(room.id, 'available')}
                          disabled={updating || room.status === 'available'}
                        >
                          Avail
                        </button>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.35rem 0.25rem', 
                            fontSize: '0.7rem', 
                            background: room.status === 'occupied' ? '#ef4444' : '#f1f5f9',
                            color: room.status === 'occupied' ? '#ffffff' : '#334155'
                          }}
                          onClick={() => updateStatus(room.id, 'occupied')}
                          disabled={updating || room.status === 'occupied'}
                        >
                          Booked
                        </button>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.35rem 0.25rem', 
                            fontSize: '0.7rem', 
                            background: room.status === 'cleaning' ? '#f59e0b' : '#f1f5f9',
                            color: room.status === 'cleaning' ? '#ffffff' : '#334155'
                          }}
                          onClick={() => updateStatus(room.id, 'cleaning')}
                          disabled={updating || room.status === 'cleaning'}
                        >
                          Clean
                        </button>
                        <button 
                          className="btn" 
                          style={{ 
                            padding: '0.35rem 0.25rem', 
                            fontSize: '0.7rem', 
                            background: room.status === 'maintenance' ? '#ea580c' : '#f1f5f9',
                            color: room.status === 'maintenance' ? '#ffffff' : '#334155'
                          }}
                          onClick={() => updateStatus(room.id, 'maintenance')}
                          disabled={updating || room.status === 'maintenance'}
                        >
                          Maint
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULL ROOM EDIT MODAL (ADMIN CONTROL) */}
      {activeModalRoom && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BedDouble size={22} style={{ color: 'var(--primary-color)' }} />
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                  Edit Room {activeModalRoom.room_number} Details
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModalRoom(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFullRoom}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                
                {/* Room Number */}
                <div className="input-group">
                  <label className="input-label">Room Number *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.room_number} 
                    onChange={e => setFormData({ ...formData, room_number: e.target.value })} 
                    required 
                  />
                </div>

                {/* Floor */}
                <div className="input-group">
                  <label className="input-label">Floor *</label>
                  <select 
                    className="input" 
                    value={formData.floor} 
                    onChange={e => setFormData({ ...formData, floor: e.target.value })}
                  >
                    <option value="1st">1st Floor</option>
                    <option value="2nd">2nd Floor</option>
                    <option value="3rd">3rd Floor</option>
                  </select>
                </div>

                {/* Room Category */}
                <div className="input-group">
                  <label className="input-label">Room Category / Type *</label>
                  <select 
                    className="input" 
                    value={formData.room_type} 
                    onChange={e => setFormData({ ...formData, room_type: e.target.value })}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Super Deluxe">Super Deluxe</option>
                    <option value="Family">Family</option>
                  </select>
                </div>

                {/* Price Per Night */}
                <div className="input-group">
                  <label className="input-label">Price Per Night (₹) *</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={formData.price_per_night} 
                    onChange={e => setFormData({ ...formData, price_per_night: e.target.value })} 
                    min="1"
                    required 
                  />
                </div>

                {/* Bed Type */}
                <div className="input-group">
                  <label className="input-label">Bed Configuration</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.bed_type} 
                    onChange={e => setFormData({ ...formData, bed_type: e.target.value })} 
                    placeholder="e.g. Double Bed / 2 Double Beds / 1 King Bed"
                  />
                </div>

                {/* Maximum Guests */}
                <div className="input-group">
                  <label className="input-label">Max Guest Capacity</label>
                  <input 
                    type="number" 
                    className="input" 
                    value={formData.max_guests} 
                    onChange={e => setFormData({ ...formData, max_guests: e.target.value })} 
                    min="1"
                    max="10"
                  />
                </div>

                {/* Operational Status */}
                <div className="input-group">
                  <label className="input-label">Operational Status</label>
                  <select 
                    className="input" 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied / Booked</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>

                {/* AC Toggle */}
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="input-label">Air Conditioning (AC)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '6px' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.ac} 
                      onChange={e => setFormData({ ...formData, ac: e.target.checked })} 
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {formData.ac ? 'AC Equipped Room' : 'Non-AC Room'}
                    </span>
                  </label>
                </div>

                {/* Room Photograph & Upload Section */}
                <div className="input-group" style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <label className="input-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                      <Camera size={18} style={{ color: 'var(--primary-color)' }} />
                      <span>Room Photograph</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Max 5 MB • JPG, PNG, WebP
                    </span>
                  </div>

                  {/* Hidden Native File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    style={{ display: 'none' }}
                  />

                  {/* Current or Preview Image Display */}
                  {(imagePreview || formData.image_url) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#0f172a', maxHeight: '220px', textAlign: 'center' }}>
                        <img 
                          src={imagePreview || formData.image_url} 
                          alt="Room Preview" 
                          style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=85";
                          }}
                        />
                        {uploadingImage && (
                          <div style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            background: 'rgba(0, 0, 0, 0.65)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white',
                            gap: '0.5rem'
                          }}>
                            <RefreshCw size={28} className="animate-spin" />
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Uploading Photo to Cloud...</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Replace & Remove */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleTriggerUpload}
                          disabled={uploadingImage}
                          style={{ 
                            flex: 1, 
                            minHeight: '40px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.4rem', 
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          <Upload size={16} />
                          {uploadingImage ? 'Uploading...' : 'Replace Photo'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleRemoveImage}
                          disabled={uploadingImage}
                          style={{ 
                            minHeight: '40px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.4rem', 
                            color: '#dc2626',
                            borderColor: '#fca5a5',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}
                        >
                          <Trash2 size={16} />
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload Dropzone / Button when no image */
                    <div 
                      onClick={handleTriggerUpload}
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '8px',
                        padding: '1.75rem 1rem',
                        textAlign: 'center',
                        background: '#ffffff',
                        cursor: uploadingImage ? 'wait' : 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', marginBottom: '0.75rem' }}>
                        {uploadingImage ? <RefreshCw size={24} className="animate-spin" /> : <Upload size={24} />}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        {uploadingImage ? 'Uploading photo...' : 'Upload Room Image'}
                      </div>
                      <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Select a photo from your computer or phone gallery (JPG, PNG, WebP)
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: '0.85rem', padding: '0.45rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        disabled={uploadingImage}
                      >
                        <Upload size={16} /> Choose Photo File
                      </button>
                    </div>
                  )}

                  {/* Status / Feedback message */}
                  {uploadMessage.text && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: uploadMessage.type === 'error' ? '#fee2e2' : uploadMessage.type === 'success' ? '#d1fae5' : '#e0f2fe',
                      color: uploadMessage.type === 'error' ? '#991b1b' : uploadMessage.type === 'success' ? '#065f46' : '#0369a1'
                    }}>
                      {uploadMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      <span>{uploadMessage.text}</span>
                    </div>
                  )}

                  {/* Advanced / Fallback URL Input (Collapsible) */}
                  <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setShowManualUrl(!showManualUrl)}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      {showManualUrl ? 'Hide web URL field' : 'Advanced: Or paste image web URL'}
                    </button>
                  </div>

                  {showManualUrl && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <input 
                        type="url" 
                        className="input" 
                        value={formData.image_url} 
                        onChange={e => {
                          setFormData({ ...formData, image_url: e.target.value });
                          setImagePreview(e.target.value);
                        }} 
                        placeholder="https://... or /images/..."
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  )}
                </div>

                {/* Room Description */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Room Description</label>
                  <textarea 
                    className="input" 
                    rows={3} 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Comfortable air-conditioned room offering complete privacy, comfortable bedding, clean linen..."
                  />
                </div>

                {/* Active in Inventory */}
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_active} 
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked })} 
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.85rem' }}>
                      Active in Room Inventory (Uncheck to hide room from customer listings)
                    </span>
                  </label>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setActiveModalRoom(null)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={updating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
                >
                  <Save size={16} />
                  {updating ? 'Saving Changes...' : 'Save Room Details'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
