import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Plus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  { value: 'food_supplies', label: 'Food Supplies' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'gas', label: 'Gas' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'water', label: 'Water' },
  { value: 'other', label: 'Other' }
];

export default function ExpensesPage() {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    title: '',
    category: 'food_supplies',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*, profiles(full_name, email)')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error loading expenses: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!formData.title || isNaN(amt) || amt <= 0) {
      alert('Please enter a valid title and positive amount.');
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          title: formData.title.trim(),
          category: formData.category,
          amount: amt,
          expense_date: formData.expense_date,
          description: formData.description.trim() || null,
          staff_id: profile?.id,
          status: 'approved'
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Expense recorded successfully!' });
      setFormData({
        title: '',
        category: 'food_supplies',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowAddForm(false);
      await loadExpenses();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to record expense: ' + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Lodge Expenses</h1>
          <p style={{ color: 'var(--text-muted)' }}>Track operational and supply costs recorded by staff.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={loadExpenses} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} /> {showAddForm ? 'Cancel' : 'Record Expense'}
          </button>
        </div>
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

      {/* RECORD EXPENSE FORM */}
      {showAddForm && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Record Hotel / Restaurant Expense</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admin expenditure tracking</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Item / Expense Name *</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Cooking Gas, Vegetables, Rice..." 
                  required
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Price / Amount (₹) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  className="input" 
                  placeholder="0.00" 
                  required
                  value={formData.amount} 
                  onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Category *</label>
                <select 
                  className="input" 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Date *</label>
                <input 
                  type="date" 
                  className="input" 
                  required
                  value={formData.expense_date} 
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })} 
                />
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Quantity / Remarks / Invoice # (Optional)</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Purchased from Vendor A, Invoice #102" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ padding: '0.75rem 1.5rem', fontWeight: 600 }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Expense Record'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUMMARY STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Recorded Expenses</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444', marginTop: '0.25rem' }}>
            ₹{totalExpenseAmount.toFixed(2)}
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Expense Entries</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
            {expenses.length}
          </div>
        </div>
      </div>

      {/* EXPENSES TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <DollarSign size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No expenses recorded yet</h3>
          <p>Click "Record Expense" above to add the first operational expenditure.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Title</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Recorded By</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Remarks</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{exp.expense_date}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{exp.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                        {exp.category?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                      {exp.profiles?.full_name || exp.profiles?.email || 'Staff'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{exp.description || '—'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                      ₹{Number(exp.amount).toFixed(2)}
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
