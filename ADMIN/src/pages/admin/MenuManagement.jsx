import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  UtensilsCrossed, Plus, RefreshCw, Check, X, Edit3, Trash2, 
  Save, Search, Image as ImageIcon, Upload, Tag, Filter, AlertCircle, 
  CheckCircle2, FolderPlus, ArrowUpDown
} from 'lucide-react';

const CATEGORY_KEYWORDS = [
  { keywords: ['roll', 'wrap', 'kathi', 'frankie'], catName: 'Rolls', type: 'food' },
  { keywords: ['biryani', 'biriyani', 'dum biryani'], catName: 'Biriyani', type: 'food' },
  { keywords: ['rice', 'fried rice', 'pulao', 'jeera rice', 'khichdi'], catName: 'Rice', type: 'food' },
  { keywords: ['chicken', 'murgh', 'kebab', 'tikka chicken', 'chilli chicken', 'butter chicken'], catName: 'Chicken', type: 'food' },
  { keywords: ['mutton', 'lamb', 'gosht', 'rogan josh', 'keema'], catName: 'Mutton', type: 'food' },
  { keywords: ['fish', 'prawn', 'pomfret', 'seafood', 'crab'], catName: 'Fish', type: 'food' },
  { keywords: ['paneer', 'veg', 'mushroom', 'aloo', 'gobi', 'dal', 'palak', 'kofta', 'chana'], catName: 'Paneer & Veg', type: 'food' },
  { keywords: ['roti', 'naan', 'paratha', 'kulcha', 'bread', 'tandoori roti', 'chapati', 'poori'], catName: 'Roti & Bread', type: 'food' },
  { keywords: ['tea', 'coffee', 'chai', 'espresso', 'cappuccino', 'latte'], catName: 'Tea & Coffee', type: 'drink' },
  { keywords: ['water', 'soda', 'coke', 'pepsi', 'sprite', 'juice', 'shake', 'smoothie', 'mojito', 'lassi', 'drink', 'beverage', 'cold drink'], catName: 'Drinks', type: 'drink' },
  { keywords: ['ice cream', 'dessert', 'kheer', 'gulab jamun', 'rasgulla', 'halwa', 'cake', 'sweet'], catName: 'Desserts', type: 'food' },
  { keywords: ['snack', 'pakora', 'fries', 'finger', 'samosa', 'starter', 'soup', 'manchurian', 'spring roll'], catName: 'Snacks & Starters', type: 'food' },
];

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Item Modal / Form state (Add or Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null when adding new
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    is_veg: true,
    is_available: true,
    image_url: '',
    description: ''
  });

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('food');
  const [editingCategory, setEditingCategory] = useState(null); // { id, name, type }

  // Inline Quick Price Editing
  const [quickEditId, setQuickEditId] = useState(null);
  const [quickEditPrice, setQuickEditPrice] = useState('');

  // Suggested category state
  const [suggestedCategory, setSuggestedCategory] = useState(null);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const [catsRes, itemsRes] = await Promise.all([
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }).order('name', { ascending: true }),
        supabase.from('menu_items').select('*, menu_categories(id, name, type)').order('name', { ascending: true })
      ]);

      if (catsRes.error) console.warn('Categories query warning:', catsRes.error);
      if (itemsRes.error) console.warn('Items query warning:', itemsRes.error);

      const loadedCats = catsRes.data || [];
      const loadedItems = itemsRes.data || [];

      setCategories(loadedCats);
      setItems(loadedItems);

      if (loadedCats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: loadedCats[0].id }));
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ type: 'error', text: 'Error loading menu: ' + (err.message || 'Check database connection') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // Clear message after 4s
  useEffect(() => {
    if (actionMessage.text) {
      const timer = setTimeout(() => setActionMessage({ type: '', text: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Compute category suggestions whenever item name changes
  useEffect(() => {
    const trimmed = (formData.name || '').trim().toLowerCase();
    if (!trimmed || editingItem) {
      setSuggestedCategory(null);
      return;
    }

    // Find keyword match
    let matchCatName = null;
    let matchType = 'food';
    for (const rule of CATEGORY_KEYWORDS) {
      if (rule.keywords.some(k => trimmed.includes(k))) {
        matchCatName = rule.catName;
        matchType = rule.type;
        break;
      }
    }

    if (matchCatName) {
      // Find matching category in existing categories
      const existing = categories.find(c => 
        c.name.toLowerCase() === matchCatName.toLowerCase() ||
        c.name.toLowerCase().includes(matchCatName.toLowerCase()) ||
        matchCatName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (existing) {
        if (existing.id !== formData.category_id) {
          setSuggestedCategory({ category: existing, isNew: false });
        } else {
          setSuggestedCategory(null);
        }
      } else {
        setSuggestedCategory({ name: matchCatName, type: matchType, isNew: true });
      }
    } else {
      setSuggestedCategory(null);
    }
  }, [formData.name, categories, formData.category_id, editingItem]);

  const openAddForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      price: '',
      is_veg: true,
      is_available: true,
      image_url: '',
      description: ''
    });
    setImageFile(null);
    setImagePreview('');
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category_id: item.category_id || categories[0]?.id || '',
      price: item.price ? String(item.price) : '',
      is_veg: !!item.is_veg,
      is_available: item.is_available !== false,
      image_url: item.image_url || '',
      description: item.description || ''
    });
    setImageFile(null);
    setImagePreview(item.image_url || '');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate mime
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      alert('Invalid file format. Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImageToStorage = async (file) => {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanFileName = `dish_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = cleanFileName;

      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) {
        console.warn('Storage upload warning:', error);
        throw error;
      }

      const { data: publicData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      return publicData?.publicUrl || null;
    } catch (err) {
      console.error('Failed to upload image to Supabase Storage:', err);
      // Return null and notify user
      alert('Notice: Could not upload directly to Supabase storage (' + (err.message || 'Bucket not initialized') + '). The item will be saved with the preview or direct URL.');
      return null;
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    const price = parseFloat(formData.price);

    if (!name) {
      alert('Please enter an item name.');
      return;
    }
    if (!formData.category_id) {
      alert('Please select or create a category.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price greater than 0.');
      return;
    }

    try {
      setSaving(true);
      let finalImageUrl = formData.image_url;

      // Upload image if a new file was chosen
      if (imageFile) {
        const uploadedUrl = await uploadImageToStorage(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else if (imagePreview && imagePreview.startsWith('http')) {
          finalImageUrl = imagePreview;
        }
      }

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('menu_items')
          .update({
            name,
            category_id: formData.category_id,
            price,
            is_veg: formData.is_veg,
            is_available: formData.is_available,
            image_url: finalImageUrl || null,
            description: formData.description?.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        setActionMessage({ type: 'success', text: `"${name}" updated successfully.` });
      } else {
        // Insert
        const { error } = await supabase
          .from('menu_items')
          .insert([{
            name,
            category_id: formData.category_id,
            price,
            is_veg: formData.is_veg,
            is_available: formData.is_available,
            image_url: finalImageUrl || null,
            description: formData.description?.trim() || null
          }]);

        if (error) throw error;
        setActionMessage({ type: 'success', text: `"${name}" added to menu.` });
      }

      closeForm();
      await loadMenu();
    } catch (err) {
      console.error('Save item error:', err);
      alert('Failed to save menu item: ' + (err.message || 'Database error'));
    } finally {
      setSaving(false);
    }
  };

  // Quick Price delta (+₹10 or -₹10)
  const adjustPriceDelta = async (item, delta) => {
    const newPrice = Math.max(1, Number(item.price) + delta);
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ price: newPrice, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, price: newPrice } : i));
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    }
  };

  // Quick Inline Price save
  const handleSaveQuickPrice = async (itemId) => {
    const p = parseFloat(quickEditPrice);
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
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, price: p } : i));
      setQuickEditId(null);
      setActionMessage({ type: 'success', text: 'Price updated.' });
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    }
  };

  // Toggle availability (Live Sold out toggle)
  const toggleAvailability = async (id, currentVal) => {
    try {
      const newVal = !currentVal;
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: newVal, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_available: newVal } : i));
      setActionMessage({ 
        type: 'success', 
        text: newVal ? 'Item marked Available (Visible in Staff billing).' : 'Item marked Sold Out (Hidden in Staff billing).' 
      });
    } catch (err) {
      alert('Failed to update availability: ' + err.message);
    }
  };

  // Delete item with safety confirmation
  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      setActionMessage({ type: 'success', text: `"${name}" removed from menu.` });
    } catch (err) {
      alert('Failed to delete item: ' + (err.message || 'It may be referenced by historical orders.'));
    }
  };

  // Category Actions
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('menu_categories')
        .insert([{
          name,
          type: newCatType,
          sort_order: categories.length + 1,
          is_active: true
        }])
        .select();

      if (error) throw error;
      setActionMessage({ type: 'success', text: `Category "${name}" created.` });
      setNewCatName('');
      await loadMenu();
      if (data && data[0]) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    } catch (err) {
      alert('Failed to create category: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (catId) => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('menu_categories')
        .update({
          name: editingCategory.name.trim(),
          type: editingCategory.type
        })
        .eq('id', catId);

      if (error) throw error;
      setActionMessage({ type: 'success', text: 'Category updated successfully.' });
      setEditingCategory(null);
      await loadMenu();
    } catch (err) {
      alert('Failed to update category: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const itemsInCat = items.filter(i => i.category_id === cat.id);
    if (itemsInCat.length > 0) {
      if (window.confirm(`Category "${cat.name}" has ${itemsInCat.length} menu items. Deleting it will cause database constraint errors. Would you like to deactivate it instead?`)) {
        try {
          const { error } = await supabase
            .from('menu_categories')
            .update({ is_active: false })
            .eq('id', cat.id);
          if (error) throw error;
          setActionMessage({ type: 'success', text: `Category "${cat.name}" deactivated.` });
          await loadMenu();
        } catch (err) {
          alert('Failed to deactivate category: ' + err.message);
        }
      }
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', cat.id);

      if (error) throw error;
      setActionMessage({ type: 'success', text: `Category "${cat.name}" deleted.` });
      await loadMenu();
    } catch (err) {
      alert('Failed to delete category: ' + err.message);
    }
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (selectedCategoryFilter !== 'ALL' && item.category_id !== selectedCategoryFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCat = (item.menu_categories?.name || '').toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });
  }, [items, selectedCategoryFilter, searchQuery]);

  return (
    <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Restaurant Menu Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage dishes, food photos, categories, live availability, and menu pricing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={() => setIsCategoryModalOpen(true)}
            style={{ minHeight: '44px' }}
          >
            <FolderPlus size={16} /> Manage Categories
          </button>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={loadMenu} 
            disabled={loading}
            style={{ minHeight: '44px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={openAddForm}
            style={{ minHeight: '44px' }}
          >
            <Plus size={18} /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage.text && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '0.875rem 1.25rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1.5rem',
          background: actionMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: actionMessage.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${actionMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {actionMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search dishes or categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem', width: '100%', minHeight: '42px' }}
            />
          </div>

          {/* Category Quick Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Filter size={14} /> Category:
            </span>
            <button 
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`btn ${selectedCategoryFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '36px' }}
            >
              All ({items.length})
            </button>
            {categories.map(c => {
              const count = items.filter(i => i.category_id === c.id).length;
              const isSelected = selectedCategoryFilter === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCategoryFilter(c.id)}
                  className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', minHeight: '36px' }}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1050,
          overflowY: 'auto'
        }}>
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '650px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <button 
                type="button" 
                onClick={closeForm} 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.5rem', minHeight: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              {/* Item Name */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ fontWeight: 600 }}>Item Name *</label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="e.g. Chicken Roll, Kadai Paneer, Mango Lassi"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ minHeight: '44px' }}
                />
              </div>

              {/* Category Suggestion Pill */}
              {suggestedCategory && (
                <div style={{ 
                  background: '#eff6ff', 
                  border: '1px solid #bfdbfe', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '0.65rem 0.85rem', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#1e40af'
                }}>
                  <span>
                    💡 Suggested category: <strong>{suggestedCategory.isNew ? suggestedCategory.name : suggestedCategory.category.name}</strong>
                  </span>
                  <button 
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', minHeight: '30px' }}
                    onClick={() => {
                      if (!suggestedCategory.isNew) {
                        setFormData(prev => ({ ...prev, category_id: suggestedCategory.category.id }));
                      } else {
                        // Create and select this category
                        setNewCatName(suggestedCategory.name);
                        setNewCatType(suggestedCategory.type || 'food');
                        setIsCategoryModalOpen(true);
                      }
                      setSuggestedCategory(null);
                    }}
                  >
                    Apply Suggestion
                  </button>
                </div>
              )}

              {/* Category & Price in Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label" style={{ fontWeight: 600 }}>Category *</label>
                    <button 
                      type="button" 
                      onClick={() => setIsCategoryModalOpen(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                    >
                      + New Category
                    </button>
                  </div>
                  <select 
                    className="input" 
                    required
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    style={{ minHeight: '44px' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600 }}>Price (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="1" 
                    className="input" 
                    required 
                    placeholder="0.00"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    style={{ minHeight: '44px' }}
                  />
                </div>
              </div>

              {/* Veg / Non-Veg & Availability */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_veg}
                    onChange={e => setFormData({ ...formData, is_veg: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600, color: formData.is_veg ? '#059669' : '#dc2626' }}>
                    {formData.is_veg ? '🟢 Vegetarian Dish' : '🔴 Non-Vegetarian Dish'}
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_available}
                    onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Available for Orders (Live)</span>
                </label>
              </div>

              {/* Food Image Upload & Preview */}
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ImageIcon size={16} /> Dish Photo (Optional)
                </label>

                {imagePreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
                    <img 
                      src={imagePreview} 
                      alt="Dish preview" 
                      style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Image Selected</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Existing image'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', minHeight: '34px' }}
                      >
                        Change
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={handleRemoveImage}
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fecaca', minHeight: '34px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#fafafa',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <Upload size={24} style={{ margin: '0 auto 0.5rem auto', color: 'var(--text-muted)' }} />
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Click to upload photo
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      PNG, JPG, or WEBP up to 5MB
                    </div>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageSelect}
                />
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={closeForm}
                  disabled={saving}
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={saving}
                  style={{ minHeight: '44px', minWidth: '120px' }}
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1060,
          overflowY: 'auto'
        }}>
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '550px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Menu Categories
              </h2>
              <button 
                type="button" 
                onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.5rem', minHeight: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Add New Category</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Category Name (e.g. Rolls, Desserts)"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  style={{ flex: '1 1 180px', minHeight: '40px' }}
                  required
                />
                <select 
                  className="input" 
                  value={newCatType}
                  onChange={e => setNewCatType(e.target.value)}
                  style={{ width: '100px', minHeight: '40px' }}
                >
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                </select>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving || !newCatName.trim()}
                  style={{ minHeight: '40px' }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Existing Categories ({categories.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {categories.map(cat => {
                  const isEditing = editingCategory?.id === cat.id;
                  const itemCount = items.filter(i => i.category_id === cat.id).length;

                  return (
                    <div 
                      key={cat.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '0.65rem 0.85rem', 
                        background: '#ffffff', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-md)',
                        gap: '0.5rem'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                          <input 
                            type="text" 
                            className="input" 
                            value={editingCategory.name}
                            onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            style={{ flex: 1, padding: '0.3rem 0.5rem', minHeight: '34px' }}
                          />
                          <select 
                            className="input" 
                            value={editingCategory.type}
                            onChange={e => setEditingCategory({ ...editingCategory, type: e.target.value })}
                            style={{ width: '90px', padding: '0.3rem 0.5rem', minHeight: '34px' }}
                          >
                            <option value="food">Food</option>
                            <option value="drink">Drink</option>
                          </select>
                          <button 
                            type="button" 
                            className="btn btn-success" 
                            onClick={() => handleUpdateCategory(cat.id)}
                            style={{ padding: '0.3rem 0.6rem', minHeight: '34px' }}
                          >
                            <Save size={14} />
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={() => setEditingCategory(null)}
                            style={{ padding: '0.3rem 0.5rem', minHeight: '34px' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</span>
                            <span style={{ 
                              marginLeft: '0.5rem', 
                              fontSize: '0.7rem', 
                              padding: '0.15rem 0.4rem', 
                              borderRadius: '4px', 
                              background: '#f1f5f9', 
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase'
                            }}>
                              {cat.type}
                            </span>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ({itemCount} items)
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button 
                              type="button" 
                              className="btn btn-outline" 
                              onClick={() => setEditingCategory({ id: cat.id, name: cat.name, type: cat.type })}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minHeight: '32px' }}
                              title="Rename Category"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-outline" 
                              onClick={() => handleDeleteCategory(cat)}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fecaca', minHeight: '32px' }}
                              title="Delete / Deactivate Category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
                style={{ minHeight: '40px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto', opacity: 0.6 }} />
          <p style={{ fontWeight: 500 }}>Loading menu inventory...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <UtensilsCrossed size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            No menu items found
          </h3>
          <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            {searchQuery || selectedCategoryFilter !== 'ALL'
              ? 'Try adjusting your search or category filter.'
              : 'Add dishes and beverages to populate the menu for staff billing.'}
          </p>
          <button type="button" className="btn btn-primary" onClick={openAddForm} style={{ minHeight: '44px' }}>
            <Plus size={16} /> Add First Menu Item
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', minWidth: '650px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.85rem 1rem' }}>Dish / Beverage</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Price (₹)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Availability</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                    {/* Dish with thumbnail */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0, border: '1px solid var(--border-color)' }}
                          />
                        ) : (
                          <div style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: 'var(--radius-md)', 
                            background: '#f1f5f9', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: '#94a3b8'
                          }}>
                            <UtensilsCrossed size={18} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                          {item.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        background: '#f8fafc', 
                        border: '1px solid var(--border-color)', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 500
                      }}>
                        {item.menu_categories?.name || 'Unassigned'}
                      </span>
                    </td>

                    {/* Veg / Non-Veg */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: item.is_veg ? '#d1fae5' : '#fee2e2',
                        color: item.is_veg ? '#065f46' : '#991b1b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {item.is_veg ? '🟢 VEG' : '🔴 NON-VEG'}
                      </span>
                    </td>

                    {/* Price and adjustments */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {quickEditId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 600 }}>₹</span>
                          <input 
                            type="number"
                            className="input"
                            style={{ width: '85px', padding: '0.25rem 0.4rem', fontSize: '0.85rem', minHeight: '34px' }}
                            value={quickEditPrice}
                            onChange={e => setQuickEditPrice(e.target.value)}
                            min="1"
                          />
                          <button 
                            type="button"
                            className="btn btn-success" 
                            style={{ padding: '0.25rem 0.5rem', minHeight: '34px' }}
                            onClick={() => handleSaveQuickPrice(item.id)}
                            title="Save Price"
                          >
                            <Save size={14} />
                          </button>
                          <button 
                            type="button"
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.4rem', minHeight: '34px' }}
                            onClick={() => setQuickEditId(null)}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-color)' }}>
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                          <button 
                            type="button"
                            className="btn btn-outline" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', minHeight: '30px' }}
                            title="Edit Price"
                            onClick={() => {
                              setQuickEditId(item.id);
                              setQuickEditPrice(item.price);
                            }}
                          >
                            <Edit3 size={11} />
                          </button>
                          <button 
                            type="button"
                            className="btn btn-outline" 
                            style={{ padding: '0.2rem 0.35rem', fontSize: '0.7rem', minHeight: '30px' }}
                            title="Increase ₹10"
                            onClick={() => adjustPriceDelta(item, 10)}
                          >
                            +10
                          </button>
                          <button 
                            type="button"
                            className="btn btn-outline" 
                            style={{ padding: '0.2rem 0.35rem', fontSize: '0.7rem', minHeight: '30px' }}
                            title="Decrease ₹10"
                            onClick={() => adjustPriceDelta(item, -10)}
                          >
                            -10
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Live Availability Status */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        color: item.is_available ? '#059669' : '#dc2626', 
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: item.is_available ? '#10b981' : '#ef4444' 
                        }}></span>
                        {item.is_available ? 'Available' : 'Sold Out'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', minHeight: '36px' }}
                          title="Edit Item Details"
                          onClick={() => openEditForm(item)}
                        >
                          <Edit3 size={13} style={{ marginRight: '0.2rem' }} /> Edit
                        </button>
                        <button 
                          type="button"
                          className={`btn ${item.is_available ? 'btn-outline' : 'btn-success'}`}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', minHeight: '36px' }}
                          onClick={() => toggleAvailability(item.id, item.is_available)}
                          title={item.is_available ? 'Hide from Staff billing' : 'Make visible to Staff'}
                        >
                          {item.is_available ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderColor: '#fee2e2', color: '#dc2626', minHeight: '36px' }}
                          title="Delete Item"
                          onClick={() => handleDeleteItem(item.id, item.name)}
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
