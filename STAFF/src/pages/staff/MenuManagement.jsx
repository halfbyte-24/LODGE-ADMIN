import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UtensilsCrossed, Plus, RefreshCw, Check, X } from 'lucide-react';

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category_id: '',
    price: '',
    is_veg: true,
    is_available: true
  });

  const loadMenu = async () => {
    try {
      setLoading(true);
      const [catsRes, itemsRes] = await Promise.all([
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*, menu_categories(name, type)').order('name', { ascending: true })
      ]);

      setCategories(catsRes.data || []);
      setItems(itemsRes.data || []);
      if (catsRes.data?.length > 0 && !newItem.category_id) {
        setNewItem(prev => ({ ...prev, category_id: catsRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category_id || !newItem.price) {
      alert('Please fill all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('menu_items').insert([{
        name: newItem.name.trim(),
        category_id: newItem.category_id,
        price: parseFloat(newItem.price),
        is_veg: newItem.is_veg,
        is_available: newItem.is_available
      }]);

      if (error) throw error;
      setNewItem({ name: '', category_id: categories[0]?.id || '', price: '', is_veg: true, is_available: true });
      setShowAddForm(false);
      await loadMenu();
    } catch (err) {
      alert('Failed to add menu item: ' + err.message);
    }
  };

  const toggleAvailability = async (id, currentVal) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentVal, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await loadMenu();
    } catch (err) {
      alert('Failed to update availability: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Restaurant Menu Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Configure dishes, beverages, pricing, and live availability.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={loadMenu} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} /> {showAddForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Add Menu Item</h2>
          <form onSubmit={handleAddItem}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Item Name *</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="e.g. Kadai Paneer"
                  value={newItem.name} 
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Category *</label>
                <select 
                  className="input" 
                  value={newItem.category_id} 
                  onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Price (₹) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="1" 
                  className="input" 
                  required 
                  placeholder="0.00"
                  value={newItem.price} 
                  onChange={e => setNewItem({ ...newItem, price: e.target.value })} 
                />
              </div>
              <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.8rem' }}>
                <input 
                  type="checkbox" 
                  id="vegCheck"
                  checked={newItem.is_veg} 
                  onChange={e => setNewItem({ ...newItem, is_veg: e.target.checked })} 
                />
                <label htmlFor="vegCheck" style={{ fontSize: '0.875rem' }}>Vegetarian Item</label>
              </div>
            </div>
            <button type="submit" className="btn btn-success">Save Menu Item</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading menu...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UtensilsCrossed size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No menu items found</h3>
          <p>Add food or drink items to populate the customer restaurant menu.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Price</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Availability</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{i.name}</td>
                    <td style={{ padding: '1rem' }}>{i.menu_categories?.name || '—'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        background: i.is_veg ? '#d1fae5' : '#fee2e2',
                        color: i.is_veg ? '#065f46' : '#991b1b'
                      }}>
                        {i.is_veg ? 'VEG' : 'NON-VEG'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>₹{Number(i.price).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: i.is_available ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                        {i.is_available ? 'Available' : 'Sold Out'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        className={`btn ${i.is_available ? 'btn-outline' : 'btn-success'}`}
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => toggleAvailability(i.id, i.is_available)}
                      >
                        {i.is_available ? 'Mark Sold Out' : 'Mark Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
