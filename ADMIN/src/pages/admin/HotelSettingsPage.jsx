import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { contactRoutingService, formatDisplayPhone, normalizePhone } from '../../services/contactRoutingService';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Save, 
  RefreshCw, 
  MessageSquare, 
  UserPlus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  Clock
} from 'lucide-react';

// Helper to convert 12-hour time string ("12:00 PM", "01:30 PM") to 24-hour ("12:00", "13:30") for <input type="time" />
function to24HourTime(str) {
  if (!str) return '12:00';
  const clean = String(str).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if (!match) return '12:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3] ? match[3].toUpperCase() : null;

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// Helper to convert 24-hour time ("14:00", "09:30") to friendly 12-hour format ("02:00 PM", "09:30 AM")
function to12HourTime(time24) {
  if (!time24) return '12:00 PM';
  const parts = String(time24).trim().split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  if (isNaN(hours)) return time24;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
}

const OFFICIAL_SETTINGS_DEFAULT = {
  hotel_name: 'Amontron Hotel and Restaurant',
  phone: '+91 94334 24718',
  email: 'amontronhotelandrestaurant@gmail.com',
  address: 'WM55+6MH, Dasghara',
  city: 'Dasghara',
  state: 'West Bengal',
  pin_code: '722161',
  display_locality: 'Near Kamarpukur, West Bengal',
  landmark_1: 'Near Kamarpukur Ramakrishna Math and Mission',
  landmark_2: 'Near Kamarpukur Railway Station',
  travel_time_description: 'Conveniently located near Kamarpukur’s key landmarks',
  google_maps_url: 'https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161',
  google_maps_embed_url: 'https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed',
  description: 'Amontron Hotel and Restaurant offers comfortable lodging, authentic dining, and warm hospitality near Kamarpukur, West Bengal.',
  check_in_time: '12:00 PM',
  check_out_time: '11:00 AM'
};

export default function HotelSettingsPage() {
  const [settings, setSettings] = useState(OFFICIAL_SETTINGS_DEFAULT);
  const [contacts, setContacts] = useState([]);
  const [bookingRecipientId, setBookingRecipientId] = useState('');
  const [restaurantRecipientId, setRestaurantRecipientId] = useState('');
  const [generalRecipientId, setGeneralRecipientId] = useState('');

  // Add / Edit contact state
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactError, setContactError] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTimes, setSavingTimes] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadAll = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // 1. Load hotel settings (most recent)
      const { data: sList, error: sErr } = await supabase
        .from('hotel_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!sErr && sList && sList.length > 0) {
        const row = sList[0];
        const loc = row.whatsapp_routing?.location || {};
        const timings = row.whatsapp_routing?.timings || {};
        setSettings({
          ...OFFICIAL_SETTINGS_DEFAULT,
          ...row,
          check_in_time: row.check_in_time || timings.check_in_time || OFFICIAL_SETTINGS_DEFAULT.check_in_time,
          check_out_time: row.check_out_time || timings.check_out_time || OFFICIAL_SETTINGS_DEFAULT.check_out_time,
          display_locality: row.display_locality || loc.display_locality || OFFICIAL_SETTINGS_DEFAULT.display_locality,
          landmark_1: row.landmark_1 || loc.landmark_1 || OFFICIAL_SETTINGS_DEFAULT.landmark_1,
          landmark_2: row.landmark_2 || loc.landmark_2 || OFFICIAL_SETTINGS_DEFAULT.landmark_2,
          travel_time_description: row.travel_time_description || loc.travel_time_description || OFFICIAL_SETTINGS_DEFAULT.travel_time_description,
          google_maps_embed_url: row.google_maps_embed_url || loc.google_maps_embed_url || OFFICIAL_SETTINGS_DEFAULT.google_maps_embed_url
        });
      }

      // 2. Load WhatsApp routing
      const routing = await contactRoutingService.getRouting(supabase);
      setContacts(routing.contacts || []);
      setBookingRecipientId(routing.booking_recipient_id || '');
      setRestaurantRecipientId(routing.restaurant_recipient_id || '');
      setGeneralRecipientId(routing.general_recipient_id || '');
    } catch (err) {
      console.error('[HotelSettingsPage] Error loading data:', err);
      setMessage({ type: 'error', text: 'Error loading settings: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Independent handler: Save Check-in and Check-out Times independently without overwriting other settings
  const handleSaveTimesOnly = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingTimes(true);
      setMessage({ type: '', text: '' });

      const checkInVal = (settings.check_in_time || '').trim();
      const checkOutVal = (settings.check_out_time || '').trim();

      if (!checkInVal || !checkOutVal) {
        throw new Error('Both Check-in Time and Check-out Time must be specified.');
      }

      // Fetch latest row from hotel_settings to ensure non-destructive atomic update
      const { data: sList, error: sErr } = await supabase
        .from('hotel_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sErr || !sList || sList.length === 0) {
        throw new Error('No hotel_settings record found to update.');
      }

      const row = sList[0];
      const updatedRouting = {
        ...(row.whatsapp_routing || {}),
        timings: {
          ...(row.whatsapp_routing?.timings || {}),
          check_in_time: checkInVal,
          check_out_time: checkOutVal
        }
      };

      // Dual-sync update to both column fields and JSONB whatsapp_routing
      let updated = false;
      try {
        const { error: colErr } = await supabase
          .from('hotel_settings')
          .update({
            check_in_time: checkInVal,
            check_out_time: checkOutVal,
            whatsapp_routing: updatedRouting,
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id);
        if (!colErr) updated = true;
      } catch {}

      if (!updated) {
        const { error: wrErr } = await supabase
          .from('hotel_settings')
          .update({
            whatsapp_routing: updatedRouting,
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id);
        if (wrErr) throw wrErr;
      }

      setMessage({ 
        type: 'success', 
        text: `Hotel policy times updated successfully: Check-in is ${checkInVal} and Check-out is ${checkOutVal}. Changes are live across Customer and Staff applications.` 
      });
      await loadAll();
    } catch (err) {
      console.error('[HotelSettingsPage] Save policy times failed:', err);
      setMessage({ type: 'error', text: 'Failed to update policy times: ' + err.message });
    } finally {
      setSavingTimes(false);
    }
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    setContactError('');

    const cleanName = contactName.trim();
    const normalized = normalizePhone(contactPhone);

    if (!cleanName) {
      setContactError('Please enter a staff or contact name.');
      return;
    }
    if (!normalized || normalized.length < 10) {
      setContactError('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    if (editingContactId) {
      // Update existing
      setContacts(prev => prev.map(c => 
        String(c.id) === String(editingContactId)
          ? { ...c, name: cleanName, phone: contactPhone.trim(), role_description: contactRole.trim() }
          : c
      ));
      setEditingContactId(null);
    } else {
      // Add new
      const newContact = {
        id: 'cnt_' + Math.random().toString(36).substring(2, 9),
        name: cleanName,
        phone: contactPhone.trim(),
        role_description: contactRole.trim(),
        is_active: true
      };
      setContacts(prev => [...prev, newContact]);
      
      // Auto-select if first contact
      if (contacts.length === 0) {
        setBookingRecipientId(newContact.id);
        setRestaurantRecipientId(newContact.id);
        setGeneralRecipientId(newContact.id);
      }
    }

    // Reset inputs
    setContactName('');
    setContactPhone('');
    setContactRole('');
  };

  const handleEditClick = (c) => {
    setEditingContactId(c.id);
    setContactName(c.name);
    setContactPhone(c.phone);
    setContactRole(c.role_description || '');
    setContactError('');
  };

  const handleToggleActive = (contactId) => {
    setContacts(prev => prev.map(c => 
      String(c.id) === String(contactId) ? { ...c, is_active: !c.is_active } : c
    ));
  };

  const handleDeleteContact = (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    setContacts(prev => prev.filter(c => String(c.id) !== String(contactId)));
    if (String(bookingRecipientId) === String(contactId)) setBookingRecipientId('');
    if (String(restaurantRecipientId) === String(contactId)) setRestaurantRecipientId('');
    if (String(generalRecipientId) === String(contactId)) setGeneralRecipientId('');
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const locationPayload = {
        display_locality: (settings.display_locality || '').trim(),
        landmark_1: (settings.landmark_1 || '').trim(),
        landmark_2: (settings.landmark_2 || '').trim(),
        travel_time_description: (settings.travel_time_description || '').trim(),
        google_maps_embed_url: (settings.google_maps_embed_url || '').trim(),
        google_maps_url: (settings.google_maps_url || '').trim()
      };

      // 1. Persist Hotel Settings
      let currentSettingsId = settings.id;
      if (settings.id) {
        let updated = false;
        try {
          const { error: fullErr } = await supabase
            .from('hotel_settings')
            .update({
              hotel_name: settings.hotel_name,
              phone: settings.phone,
              email: settings.email,
              address: settings.address,
              city: settings.city,
              state: settings.state,
              pin_code: settings.pin_code,
              check_in_time: settings.check_in_time || '12:00 PM',
              check_out_time: settings.check_out_time || '11:00 AM',
              display_locality: settings.display_locality,
              landmark_1: settings.landmark_1,
              landmark_2: settings.landmark_2,
              travel_time_description: settings.travel_time_description,
              google_maps_url: settings.google_maps_url,
              google_maps_embed_url: settings.google_maps_embed_url,
              description: settings.description,
              updated_at: new Date().toISOString()
            })
            .eq('id', settings.id);
          if (!fullErr) updated = true;
        } catch {
          // Column might not exist in postgres schema yet
        }

        if (!updated) {
          const { error: updErr } = await supabase
            .from('hotel_settings')
            .update({
              hotel_name: settings.hotel_name,
              phone: settings.phone,
              email: settings.email,
              address: settings.address,
              city: settings.city,
              state: settings.state,
              pin_code: settings.pin_code,
              google_maps_url: settings.google_maps_url,
              description: settings.description,
              updated_at: new Date().toISOString()
            })
            .eq('id', settings.id);
          if (updErr) throw updErr;
        }
      } else {
        const { data: insData, error: insErr } = await supabase
          .from('hotel_settings')
          .insert([settings])
          .select()
          .single();
        if (insErr) throw insErr;
        currentSettingsId = insData.id;
      }

      // 2. Persist WhatsApp Routing, Location AND Timings in dual-sync
      await contactRoutingService.saveRouting(supabase, {
        settingsId: currentSettingsId,
        contacts,
        booking_recipient_id: bookingRecipientId,
        restaurant_recipient_id: restaurantRecipientId,
        general_recipient_id: generalRecipientId,
        location: locationPayload,
        timings: {
          check_in_time: settings.check_in_time || '12:00 PM',
          check_out_time: settings.check_out_time || '11:00 AM'
        }
      });

      setMessage({ type: 'success', text: 'Hotel settings, location information & WhatsApp routing saved successfully!' });
      await loadAll();
    } catch (err) {
      console.error('[HotelSettingsPage] Save failed:', err);
      setMessage({ type: 'error', text: 'Failed to save configuration: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const activeContacts = contacts.filter(c => c.is_active !== false);

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Hotel &amp; WhatsApp Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Official business contact details and admin-controlled WhatsApp enquiry routing.
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadAll} disabled={loading} style={{ minHeight: '38px' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {message.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          background: message.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: message.type === 'error' ? '#991b1b' : '#065f46',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          Loading configuration...
        </div>
      ) : (
        <form onSubmit={handleSaveAll}>
          
          {/* SECTION 1: OFFICIAL BUSINESS DETAILS */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <Building2 size={20} style={{ color: 'var(--primary-color)' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Official Hotel Information</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Official Business Name *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.hotel_name || ''} 
                  onChange={e => setSettings({ ...settings, hotel_name: e.target.value })} 
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Official Owner / Front Desk Phone *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.phone || ''} 
                  onChange={e => setSettings({ ...settings, phone: e.target.value })} 
                  placeholder="+91 94334 24718"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Used as official telephone on website headers, contact page &amp; receipts.
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Official Business Email *</label>
                <input 
                  type="email" 
                  className="input" 
                  value={settings.email || ''} 
                  onChange={e => setSettings({ ...settings, email: e.target.value })} 
                  placeholder="amontronhotelandrestaurant@gmail.com"
                  required
                />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Hotel Address / Street Location *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.address || ''} 
                  onChange={e => setSettings({ ...settings, address: e.target.value })} 
                  placeholder="WM55+6MH, Dasghara"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">City / Area *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.city || ''} 
                  onChange={e => setSettings({ ...settings, city: e.target.value })} 
                  placeholder="Dasghara"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">State *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.state || ''} 
                  onChange={e => setSettings({ ...settings, state: e.target.value })} 
                  placeholder="West Bengal"
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">PIN Code *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.pin_code || ''} 
                  onChange={e => setSettings({ ...settings, pin_code: e.target.value })} 
                  placeholder="722161"
                  required
                />
              </div>

              {/* Customer-Facing Location & Landmarks */}
              <div style={{ gridColumn: '1 / -1', marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <MapPin size={18} style={{ color: 'var(--primary-color)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Customer-Facing Location &amp; Landmarks (Live Sync)</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
                  These settings control what customers see on the website headers, footers, location badges, and contact cards in real time.
                </p>
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Display Locality / Customer-Facing Location Text *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.display_locality || ''} 
                  onChange={e => setSettings({ ...settings, display_locality: e.target.value })} 
                  placeholder="Near Kamarpukur, West Bengal"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Shown to website visitors on headers, footers, and location badges (e.g., Near Kamarpukur, West Bengal).
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Nearby Landmark 1</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.landmark_1 || ''} 
                  onChange={e => setSettings({ ...settings, landmark_1: e.target.value })} 
                  placeholder="Near Kamarpukur Ramakrishna Math and Mission"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nearby Landmark 2</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.landmark_2 || ''} 
                  onChange={e => setSettings({ ...settings, landmark_2: e.target.value })} 
                  placeholder="Near Kamarpukur Railway Station"
                />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Optional Verified Travel-Time / Proximity Description</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.travel_time_description || ''} 
                  onChange={e => setSettings({ ...settings, travel_time_description: e.target.value })} 
                  placeholder="Conveniently located near Kamarpukur’s key landmarks"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Shown on contact cards and location page subheadings.
                </span>
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Google Maps Search / Directions Link *</label>
                <input 
                  type="url" 
                  className="input" 
                  value={settings.google_maps_url || ''} 
                  onChange={e => setSettings({ ...settings, google_maps_url: e.target.value })} 
                  placeholder="https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161"
                  required
                />
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: WM55+6MH, Dasghara, West Bengal 722161</span>
                  {settings.google_maps_url && (
                    <a href={settings.google_maps_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--primary-color)' }}>
                      Test Map Link <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Google Maps Embed Iframe URL</label>
                <input 
                  type="url" 
                  className="input" 
                  value={settings.google_maps_embed_url || ''} 
                  onChange={e => setSettings({ ...settings, google_maps_embed_url: e.target.value })} 
                  placeholder="https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed"
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Used for interactive embed map on Customer Location page.
                </span>
                {settings.google_maps_embed_url && (
                  <div style={{ marginTop: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: '160px', maxWidth: '100%' }}>
                    <iframe 
                      title="Google Maps Preview" 
                      src={settings.google_maps_embed_url} 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      loading="lazy" 
                    />
                  </div>
                )}
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Hotel Description</label>
                <textarea 
                  className="input" 
                  rows={2}
                  value={settings.description || ''} 
                  onChange={e => setSettings({ ...settings, description: e.target.value })} 
                  placeholder="Amontron Hotel and Restaurant offers comfortable lodging, authentic dining, and warm hospitality near Kamarpukur, West Bengal."
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: CHECK-IN & CHECK-OUT POLICY TIMINGS */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: 'var(--primary-color)' }} />
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Check-in &amp; Check-out Policy Times</h2>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Standard guest arrival and departure times displayed to visitors and staff across all systems.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleSaveTimesOnly}
                disabled={savingTimes || loading}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.82rem',
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontWeight: 600
                }}
              >
                <Save size={14} className={savingTimes ? 'animate-spin' : ''} />
                {savingTimes ? 'Saving Times...' : 'Save Times Only'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', marginBottom: '1.25rem' }}>
              
              {/* Check-in Time Field */}
              <div className="input-group" style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="input-label" style={{ fontWeight: 700, margin: 0 }}>Standard Check-in Time *</label>
                  <span style={{ fontSize: '0.78rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {settings.check_in_time || '12:00 PM'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '10px' }}>
                  <input 
                    type="time" 
                    className="input" 
                    value={to24HourTime(settings.check_in_time)} 
                    onChange={e => {
                      const new12 = to12HourTime(e.target.value);
                      setSettings(prev => ({ ...prev, check_in_time: new12 }));
                    }}
                    style={{ flex: 1, minHeight: '40px', fontWeight: 600 }}
                    required
                  />
                  <input 
                    type="text" 
                    className="input" 
                    value={settings.check_in_time || ''} 
                    onChange={e => setSettings(prev => ({ ...prev, check_in_time: e.target.value }))}
                    placeholder="12:00 PM"
                    style={{ width: '120px', minHeight: '40px', textAlign: 'center', fontWeight: 600 }}
                    title="You can also customize the label, e.g. 12:00 PM (Noon)"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                  {['11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, check_in_time: t }))}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.74rem',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: (settings.check_in_time || '').startsWith(t) ? 'var(--primary-color)' : '#fff',
                        color: (settings.check_in_time || '').startsWith(t) ? '#fff' : '#334155',
                        cursor: 'pointer',
                        fontWeight: (settings.check_in_time || '').startsWith(t) ? 600 : 400
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check-out Time Field */}
              <div className="input-group" style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="input-label" style={{ fontWeight: 700, margin: 0 }}>Standard Check-out Time *</label>
                  <span style={{ fontSize: '0.78rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {settings.check_out_time || '11:00 AM'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '10px' }}>
                  <input 
                    type="time" 
                    className="input" 
                    value={to24HourTime(settings.check_out_time)} 
                    onChange={e => {
                      const new12 = to12HourTime(e.target.value);
                      setSettings(prev => ({ ...prev, check_out_time: new12 }));
                    }}
                    style={{ flex: 1, minHeight: '40px', fontWeight: 600 }}
                    required
                  />
                  <input 
                    type="text" 
                    className="input" 
                    value={settings.check_out_time || ''} 
                    onChange={e => setSettings(prev => ({ ...prev, check_out_time: e.target.value }))}
                    placeholder="11:00 AM"
                    style={{ width: '120px', minHeight: '40px', textAlign: 'center', fontWeight: 600 }}
                    title="You can also customize the label, e.g. 11:00 AM"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                  {['10:00 AM', '11:00 AM', '12:00 PM'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, check_out_time: t }))}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.74rem',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        background: (settings.check_out_time || '').startsWith(t) ? 'var(--primary-color)' : '#fff',
                        color: (settings.check_out_time || '').startsWith(t) ? '#fff' : '#334155',
                        cursor: 'pointer',
                        fontWeight: (settings.check_out_time || '').startsWith(t) ? 600 : 400
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Live Customer & Staff Preview Banner */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.85rem',
              color: '#166534'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Live Display Propagation:</strong> Guests will see standard check-in from <strong>{settings.check_in_time || '12:00 PM'}</strong> and check-out by <strong>{settings.check_out_time || '11:00 AM'}</strong> across Rooms, Booking confirmation, and Location pages. Staff operations preserve actual guest arrival and departure timestamps separately.
              </div>
            </div>
          </div>

          {/* SECTION 3: WHATSAPP & CONTACT ROUTING */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <MessageSquare size={20} style={{ color: '#16a34a' }} />
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>WhatsApp &amp; Contact Routing</h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Control which staff member receives Room Bookings, Restaurant Orders, and General Enquiries.
                </p>
              </div>
            </div>

            {/* Owner Official Separation Notice */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem'
            }}>
              <ShieldCheck size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Official Owner Separation:</strong> The owner official phone ({settings.phone || '+91 94334 24718'}) remains available as the permanent business contact. WhatsApp enquiries from customer buttons will route specifically to the staff numbers selected below without overwriting the official hotel number.
              </div>
            </div>

            {/* A. Active Routing Selections */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
                Active WhatsApp Routing Selections
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                
                {/* 1. Room Booking Recipient */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'block' }}>
                    🛏️ Room Booking Enquiries
                  </label>
                  <select 
                    className="input" 
                    value={bookingRecipientId}
                    onChange={e => setBookingRecipientId(e.target.value)}
                    style={{ minHeight: '40px', fontWeight: 500 }}
                  >
                    <option value="">-- No Recipient Selected --</option>
                    {activeContacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatDisplayPhone(c.phone)}) {c.role_description ? `• ${c.role_description}` : ''}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    Customer clicks "Book on WhatsApp" &rarr; opens chat with this number.
                  </span>
                </div>

                {/* 2. Restaurant Orders Recipient */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'block' }}>
                    🍽️ Restaurant Orders
                  </label>
                  <select 
                    className="input" 
                    value={restaurantRecipientId}
                    onChange={e => setRestaurantRecipientId(e.target.value)}
                    style={{ minHeight: '40px', fontWeight: 500 }}
                  >
                    <option value="">-- No Recipient Selected --</option>
                    {activeContacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatDisplayPhone(c.phone)}) {c.role_description ? `• ${c.role_description}` : ''}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    Customer clicks "Order on WhatsApp" &rarr; opens chat with this number.
                  </span>
                </div>

                {/* 3. General Enquiries Recipient */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label className="input-label" style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'block' }}>
                    💬 General Enquiries
                  </label>
                  <select 
                    className="input" 
                    value={generalRecipientId}
                    onChange={e => setGeneralRecipientId(e.target.value)}
                    style={{ minHeight: '40px', fontWeight: 500 }}
                  >
                    <option value="">-- No Recipient Selected --</option>
                    {activeContacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatDisplayPhone(c.phone)}) {c.role_description ? `• ${c.role_description}` : ''}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                    Top contact bar, Contact page &amp; footer WhatsApp action.
                  </span>
                </div>

              </div>
            </div>

            {/* B. Saved Staff Contacts Directory */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Staff WhatsApp Directory ({contacts.length} Contacts)
                </h3>
              </div>

              {/* Form to Add / Edit Contact */}
              <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                  {editingContactId ? '✏️ Edit Contact' : '➕ Add Staff WhatsApp Contact'}
                </div>

                {contactError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                    {contactError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>Staff / Contact Name *</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={contactName} 
                      onChange={e => setContactName(e.target.value)} 
                      placeholder="e.g. Subhash Ghosh" 
                      style={{ minHeight: '36px', fontSize: '0.85rem' }}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>WhatsApp Phone Number *</label>
                    <input 
                      type="tel" 
                      className="input" 
                      value={contactPhone} 
                      onChange={e => setContactPhone(e.target.value)} 
                      placeholder="e.g. +91 98765 43210" 
                      style={{ minHeight: '36px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>Role / Shift (Optional)</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={contactRole} 
                      onChange={e => setContactRole(e.target.value)} 
                      placeholder="e.g. Reception Desk / Night" 
                      style={{ minHeight: '36px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleSaveContact}
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', minHeight: '36px' }}
                    >
                      {editingContactId ? <><Check size={14} /> Update</> : <><UserPlus size={14} /> Add Contact</>}
                    </button>
                    {editingContactId && (
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => {
                          setEditingContactId(null);
                          setContactName('');
                          setContactPhone('');
                          setContactRole('');
                        }}
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', minHeight: '36px' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table of Contacts */}
              {contacts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: '#fafafa', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No staff WhatsApp contacts added yet. Enter a staff contact name and number above.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Name</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>WhatsApp Number</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Role / Description</th>
                        <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                        <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c) => {
                        const isAssigned = 
                          String(c.id) === String(bookingRecipientId) ||
                          String(c.id) === String(restaurantRecipientId) ||
                          String(c.id) === String(generalRecipientId);

                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: c.is_active === false ? 0.6 : 1 }}>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                              {c.name}
                              {isAssigned && (
                                <span style={{ marginLeft: '6px', fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px' }}>
                                  Active In Routing
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <a 
                                href={`https://wa.me/${normalizePhone(c.phone)}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                {formatDisplayPhone(c.phone)} <ExternalLink size={11} />
                              </a>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>
                              {c.role_description || '—'}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleActive(c.id)}
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: c.is_active !== false ? '#dcfce7' : '#fee2e2',
                                  color: c.is_active !== false ? '#15803d' : '#b91c1c'
                                }}
                              >
                                {c.is_active !== false ? 'Active' : 'Deactivated'}
                              </button>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleEditClick(c)}
                                  title="Edit Contact"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fca5a5' }}
                                  onClick={() => handleDeleteContact(c.id)}
                                  title="Delete Contact"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* SAVE BUTTON BAR */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} 
              disabled={saving}
            >
              <Save size={18} />
              {saving ? 'Saving Configuration...' : 'Save All Settings'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
