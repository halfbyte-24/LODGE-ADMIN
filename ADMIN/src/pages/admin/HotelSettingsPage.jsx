import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Save, RefreshCw } from 'lucide-react';

export default function HotelSettingsPage() {
  const [settings, setSettings] = useState({
    hotel_name: 'Amontron Hotel and Restaurant',
    phone: '+91 94334 24718',
    email: 'amontronhotelandrestaurant@gmail.com',
    address: '123 Highway Road',
    city: 'Cityville',
    state: 'State',
    pin_code: '12345',
    google_maps_url: 'https://maps.app.goo.gl/rSui7ryM9LkorzYk6?g_st=ac',
    description: 'Premier eco lodge retreat and traditional fine dining.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('hotel_settings').select('*').limit(1);
      if (!error && data && data.length > 0) {
        setSettings(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('hotel_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('hotel_settings').insert([settings]);
        if (error) throw error;
      }
      setMessage({ type: 'success', text: 'Hotel settings saved successfully!' });
      await loadSettings();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Hotel Configuration</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure lodge contact details, address, and invoice headers.</p>
      </div>

      {message.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          background: message.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: message.type === 'error' ? '#991b1b' : '#065f46'
        }}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Hotel / Lodge Name</label>
              <input 
                type="text" 
                className="input" 
                value={settings.hotel_name || ''} 
                onChange={e => setSettings({ ...settings, hotel_name: e.target.value })} 
                required 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input 
                type="text" 
                className="input" 
                value={settings.phone || ''} 
                onChange={e => setSettings({ ...settings, phone: e.target.value })} 
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input 
                type="email" 
                className="input" 
                value={settings.email || ''} 
                onChange={e => setSettings({ ...settings, email: e.target.value })} 
              />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Street Address</label>
              <input 
                type="text" 
                className="input" 
                value={settings.address || ''} 
                onChange={e => setSettings({ ...settings, address: e.target.value })} 
              />
            </div>

            <div className="input-group">
              <label className="input-label">City</label>
              <input 
                type="text" 
                className="input" 
                value={settings.city || ''} 
                onChange={e => setSettings({ ...settings, city: e.target.value })} 
              />
            </div>

            <div className="input-group">
              <label className="input-label">State &amp; PIN Code</label>
              <input 
                type="text" 
                className="input" 
                value={settings.state || ''} 
                onChange={e => setSettings({ ...settings, state: e.target.value })} 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}
