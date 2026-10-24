import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { dataManagementService } from '../../services/dataManagementService';
import { DollarSign, Plus, CheckCircle2, AlertCircle, RefreshCw, Trash2, X, AlertTriangle } from 'lucide-react';

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

  // Delete modal state
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Clear All modal state
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllInput, setClearAllInput] = useState('');
  const [submittingClearAll, setSubmittingClearAll] = useState(false);

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

  // Eligible test expenses
  const testExpenses = expenses.filter(e => {
    const titleLower = (e.title || '').toLowerCase();
    const descLower = (e.description || '').toLowerCase();
    return e.is_test_data === true || titleLower.includes('test') || descLower.includes('test');
  });
  const testExpensesTotal = testExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

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

  // Individual Delete Handler
  const handleDeleteExpense = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;

    try {
      setSubmittingDelete(true);
      const res = await dataManagementService.deleteExpense({
        id: selectedExpense.id,
        confirmText: deleteInput.trim(),
        adminUser: profile,
        reason: 'Expense deleted by admin'
      });

      setMessage({ type: 'success', text: res.message });
      setSelectedExpense(null);
      setDeleteInput('');
      await loadExpenses();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Bulk Clear All Test Expenses Handler
  const handleClearAllSubmit = async (e) => {
    e.preventDefault();
    const val = clearAllInput.trim().toUpperCase();
    if (val !== 'DELETE' && val !== 'DELETE ALL') return;

    try {
      setSubmittingClearAll(true);
      const res = await dataManagementService.clearEligibleTestExpenses({
        adminUser: profile,
        reason: 'Expense report bulk test expenses cleanup'
      });

      setMessage({ type: 'success', text: res.message });
      setShowClearAllModal(false);
      setClearAllInput('');
      await loadExpenses();
    } catch (err) {
      setMessage({ type: 'error', text: 'Clear All failed: ' + err.message });
    } finally {
      setSubmittingClearAll(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Hotel Expenses</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Track operational and supply costs recorded by staff.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={loadExpenses} disabled={loading} style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          
          {testExpenses.length > 0 && (
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => { setShowClearAllModal(true); setClearAllInput(''); }}
              style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#b91c1c', borderColor: '#fca5a5' }}
            >
              <Trash2 size={15} /> Clear All ({testExpenses.length} Test Entries)
            </button>
          )}

          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> {showAddForm ? 'Cancel' : 'Record Expense'}
          </button>
        </div>
      </div>

      {/* Alert message */}
      {message.text && (
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#991b1b' : '#166534',
          fontSize: '0.875rem'
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
                <label className="input-label">Category *</label>
                <select 
                  className="input" 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Amount (₹) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  className="input" 
                  placeholder="0.00" 
                  required
                  value={formData.amount} 
                  onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Date of Expenditure *</label>
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
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          Loading expenses...
        </div>
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
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
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => { setSelectedExpense(exp); setDeleteInput(''); }}
                        style={{
                          padding: '0.25rem 0.55rem',
                          fontSize: '0.78rem',
                          color: '#b91c1c',
                          borderColor: '#fca5a5'
                        }}
                      >
                        <Trash2 size={13} style={{ display: 'inline', marginRight: '3px' }} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: INDIVIDUAL EXPENSE DELETE */}
      {selectedExpense && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', borderRadius: '10px', background: 'white', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <button 
              type="button" 
              onClick={() => { setSelectedExpense(null); setDeleteInput(''); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} style={{ color: '#b91c1c' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Delete Expense?
              </h2>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '4px' }}><strong>Expense:</strong> {selectedExpense.title}</div>
              <div style={{ marginBottom: '4px' }}><strong>Category:</strong> {selectedExpense.category} • <strong>Date:</strong> {selectedExpense.expense_date}</div>
              <div><strong>Amount:</strong> ₹{Number(selectedExpense.amount).toFixed(2)}</div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>

            <form onSubmit={handleDeleteExpense}>
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input 
                  type="text" 
                  className="input" 
                  required
                  placeholder="DELETE"
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  style={{ minHeight: '42px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ minHeight: '42px', padding: '0.5rem 1rem' }}
                  onClick={() => { setSelectedExpense(null); setDeleteInput(''); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ 
                    background: '#b91c1c', 
                    color: 'white', 
                    minHeight: '42px', 
                    padding: '0.5rem 1.25rem', 
                    fontWeight: 600,
                    opacity: (submittingDelete || deleteInput.trim().toUpperCase() !== 'DELETE') ? 0.6 : 1,
                    cursor: (submittingDelete || deleteInput.trim().toUpperCase() !== 'DELETE') ? 'not-allowed' : 'pointer'
                  }}
                  disabled={submittingDelete || deleteInput.trim().toUpperCase() !== 'DELETE'}
                >
                  {submittingDelete ? 'Deleting...' : 'Delete Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLEAR ALL TEST EXPENSES */}
      {showClearAllModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', borderRadius: '10px', background: 'white', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <button 
              type="button" 
              onClick={() => { setShowClearAllModal(false); setClearAllInput(''); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Trash2 size={22} style={{ color: '#b91c1c' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Clear Test Expenses?
              </h2>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '6px' }}>
                Found <strong>{testExpenses.length}</strong> test expense(s) totaling <strong>₹{testExpensesTotal.toFixed(2)}</strong>.
              </div>
              <div style={{ color: '#166534', fontWeight: 600 }}>
                Genuine operating expenses (Rice, Gas Cylinder, Groceries, etc.) are strictly protected.
              </div>
            </div>

            <form onSubmit={handleClearAllSubmit}>
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Type <strong>DELETE</strong> to confirm:
                </label>
                <input 
                  type="text" 
                  className="input" 
                  required
                  placeholder="DELETE"
                  value={clearAllInput}
                  onChange={e => setClearAllInput(e.target.value)}
                  style={{ minHeight: '42px', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ minHeight: '42px', padding: '0.5rem 1rem' }}
                  onClick={() => { setShowClearAllModal(false); setClearAllInput(''); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ 
                    background: '#b91c1c', 
                    color: 'white', 
                    minHeight: '42px', 
                    padding: '0.5rem 1.25rem', 
                    fontWeight: 600,
                    opacity: (submittingClearAll || (clearAllInput.trim().toUpperCase() !== 'DELETE' && clearAllInput.trim().toUpperCase() !== 'DELETE ALL')) ? 0.6 : 1,
                    cursor: (submittingClearAll || (clearAllInput.trim().toUpperCase() !== 'DELETE' && clearAllInput.trim().toUpperCase() !== 'DELETE ALL')) ? 'not-allowed' : 'pointer'
                  }}
                  disabled={submittingClearAll || (clearAllInput.trim().toUpperCase() !== 'DELETE' && clearAllInput.trim().toUpperCase() !== 'DELETE ALL')}
                >
                  {submittingClearAll ? 'Clearing...' : 'Clear Test Expenses'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
