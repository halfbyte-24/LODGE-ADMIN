import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UtensilsCrossed, Plus, RefreshCw, Check, X, Edit3, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';

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

  const [editingItemId, setEditingItemId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

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
      setActionMessage({ type: 'error', text: 'Error loading menu: ' + err.message });
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
      setActionMessage({ type: 'success', text: 'Menu item created successfully.' });
      await loadMenu();
    } catch (err) {
      alert('Failed to add menu item: ' + err.message);
    }
  };

  const handleUpdatePrice = async (itemId) => {
    const p = parseFloat(editPrice);
    if (isNaN(p) || p <= 0) {
      alert('Please enter a valid price.');
      return;
    }
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ price: p, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
      setEditingItemId(null);
      setActionMessage({ type: 'success', text: 'Price updated successfully.' });
      await loadMenu();
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    }
  };

  const adjustPriceDelta = async (item, delta) => {
    const newPrice = Math.max(1, Number(item.price) + delta);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ price: newPrice, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      await loadMenu();
    } catch (err) {
      alert('Failed to update price: ' + err.message);
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

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setActionMessage({ type: 'success', text: `"${name}" removed from menu.` });
      await loadMenu();
    } catch (err) {
      alert('Failed to delete menu item: ' + err.message);
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
                  <th style={{ padding: '0.75rem 1rem' }}>Price (₹)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions &amp; Pricing</th>
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
                    <td style={{ padding: '1rem' }}>
                      {editingItemId === i.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>₹</span>
                          <input 
                            type="number"
                            className="input"
                            style={{ width: '80px', padding: '0.25rem 0.4rem', fontSize: '0.85rem' }}
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            min="1"
                          />
                          <button 
                            className="btn btn-success" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleUpdatePrice(i.id)}
                          >
                            <Save size={12} />
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                            onClick={() => setEditingItemId(null)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-color)' }}>₹{Number(i.price).toFixed(2)}</span>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }}
                            title="Edit Price"
                            onClick={() => {
                              setEditingItemId(i.id);
                              setEditPrice(i.price);
                            }}
                          >
                            <Edit3 size={11} />
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
                            title="Increase ₹10"
                            onClick={() => adjustPriceDelta(i, 10)}
                          >
                            +₹10
                          </button>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.15rem 0.35rem', fontSize: '0.7rem' }}
                            title="Decrease ₹10"
                            onClick={() => adjustPriceDelta(i, -10)}
                          >
                            -₹10
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: i.is_available ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {i.is_available ? 'Available' : 'Sold Out'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button 
                          className={`btn ${i.is_available ? 'btn-outline' : 'btn-success'}`}
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => toggleAvailability(i.id, i.is_available)}
                        >
                          {i.is_available ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderColor: '#fee2e2', color: '#dc2626' }}
                          title="Delete Item"
                          onClick={() => handleDeleteItem(i.id, i.name)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
