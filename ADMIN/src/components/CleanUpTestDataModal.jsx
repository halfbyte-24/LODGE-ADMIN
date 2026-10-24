import React, { useState, useEffect } from 'react';
import { dataManagementService } from '../services/dataManagementService';
import { useAuth } from '../context/AuthContext';
import { Trash2, AlertTriangle, ShieldCheck, X, RefreshCw, Lock, CheckSquare, Square } from 'lucide-react';

export default function CleanUpTestDataModal({ isOpen, onClose, onSuccess }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  
  // Selection state
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [selectedExpenses, setSelectedExpenses] = useState(new Set());

  const [confirmInput, setConfirmInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dataManagementService.previewTestDataCleanup();
      setPreview(data);

      // Select all eligible by default
      setSelectedCustomers(new Set((data.eligibleCustomers || []).map(c => c.id)));
      setSelectedBookings(new Set((data.eligibleStandaloneBookings || []).map(b => b.id)));
      setSelectedBills(new Set((data.eligibleBills || []).map(bl => bl.id)));
      setSelectedExpenses(new Set((data.eligibleExpenses || []).map(e => e.id)));
    } catch (err) {
      console.error(err);
      setError('Failed to load test records preview: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setConfirmInput('');
      loadPreview();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSelected = selectedCustomers.size + selectedBookings.size + selectedBills.size + selectedExpenses.size;
  const allEligibleCount = preview ? preview.totalEligibleCount : 0;
  const isAllSelected = totalSelected > 0 && totalSelected === allEligibleCount;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCustomers(new Set());
      setSelectedBookings(new Set());
      setSelectedBills(new Set());
      setSelectedExpenses(new Set());
    } else if (preview) {
      setSelectedCustomers(new Set(preview.eligibleCustomers.map(c => c.id)));
      setSelectedBookings(new Set(preview.eligibleStandaloneBookings.map(b => b.id)));
      setSelectedBills(new Set(preview.eligibleBills.map(bl => bl.id)));
      setSelectedExpenses(new Set(preview.eligibleExpenses.map(e => e.id)));
    }
  };

  const toggleCustomer = (id) => {
    const next = new Set(selectedCustomers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCustomers(next);
  };

  const toggleBooking = (id) => {
    const next = new Set(selectedBookings);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBookings(next);
  };

  const toggleBill = (id) => {
    const next = new Set(selectedBills);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBills(next);
  };

  const toggleExpense = (id) => {
    const next = new Set(selectedExpenses);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedExpenses(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmInput.trim().toUpperCase() !== 'DELETE') return;
    if (totalSelected === 0) return;

    try {
      setSubmitting(true);
      setError('');
      const res = await dataManagementService.executeTestDataCleanup({
        selectedCustomerIds: Array.from(selectedCustomers),
        selectedBookingIds: Array.from(selectedBookings),
        selectedBillIds: Array.from(selectedBills),
        selectedExpenseIds: Array.from(selectedExpenses),
        confirmText: confirmInput.trim().toUpperCase(),
        adminUser: profile,
        reason: 'Admin-approved test data cleanup'
      });

      if (onSuccess) onSuccess(res.message);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Cleanup operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
      <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '1.75rem', borderRadius: '10px', background: 'white', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <button 
          type="button" 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Trash2 size={24} style={{ color: '#b91c1c' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Clean Up Test Data
          </h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 0, marginBottom: '1.25rem' }}>
          Safely remove dummy test customers, test bookings, unpaid test invoices, and test expenses created during development.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
            <div>Scanning database for disposable test records...</div>
          </div>
        ) : preview ? (
          <div>
            {/* Header selection controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                Eligible Test Records ({allEligibleCount} found)
              </div>
              {allEligibleCount > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {allEligibleCount === 0 ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <ShieldCheck size={36} style={{ color: '#16a34a', margin: '0 auto 0.5rem auto' }} />
                <div style={{ fontWeight: 600, color: '#166534', marginBottom: '4px' }}>No Disposable Test Records Found</div>
                <div>All records in the system are genuine operational data or protected transactions with recorded payments.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                {/* 1. Test Customers */}
                {preview.eligibleCustomers.map(cust => (
                  <label 
                    key={cust.id} 
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignItems: 'flex-start',
                      background: selectedCustomers.has(cust.id) ? '#fef2f2' : '#f8fafc',
                      border: `1px solid ${selectedCustomers.has(cust.id) ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedCustomers.has(cust.id)} 
                      onChange={() => toggleCustomer(cust.id)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        Customer: {cust.full_name}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                        Phone: {cust.phone} • {cust.linkedBookings.length} booking(s) • {cust.linkedBills.length} bill(s)
                        {cust.hasDemoPayments && (
                          <span style={{ color: '#b91c1c', fontWeight: 600 }}> • {cust.linkedPayments.length} demo payment(s) (₹{cust.totalPaymentsAmount.toFixed(2)})</span>
                        )}
                      </div>
                      {cust.linkedBookings.length > 0 && (
                        <div style={{ color: '#991b1b', fontSize: '0.75rem', marginTop: '3px' }}>
                          Linked bookings: {cust.linkedBookings.map(b => `#${b.booking_number} (${b.room ? `Room ${b.room}` : 'No room'})`).join(', ')}
                        </div>
                      )}
                      {cust.hasDemoPayments && (
                        <div style={{ color: '#b45309', fontSize: '0.73rem', marginTop: '4px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                          Atomic Demo Cleanup: Removes test customer, bookings, invoices &amp; demo receipts together
                        </div>
                      )}
                    </div>
                  </label>
                ))}

                {/* 2. Standalone Test Bookings */}
                {preview.eligibleStandaloneBookings.map(bkg => (
                  <label 
                    key={bkg.id}
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignItems: 'flex-start',
                      background: selectedBookings.has(bkg.id) ? '#fef2f2' : '#f8fafc',
                      border: `1px solid ${selectedBookings.has(bkg.id) ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedBookings.has(bkg.id)} 
                      onChange={() => toggleBooking(bkg.id)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        Booking #{bkg.booking_number}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                        Guest: {bkg.guest} • Room: {bkg.room}
                      </div>
                    </div>
                  </label>
                ))}

                {/* 3. Standalone Unpaid Test Bills */}
                {preview.eligibleBills.map(bl => (
                  <label 
                    key={bl.id}
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignItems: 'flex-start',
                      background: selectedBills.has(bl.id) ? '#fef2f2' : '#f8fafc',
                      border: `1px solid ${selectedBills.has(bl.id) ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedBills.has(bl.id)} 
                      onChange={() => toggleBill(bl.id)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        Invoice #{bl.invoice_number}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                        Guest: {bl.guest} • Amount: ₹{Number(bl.amount).toFixed(2)}
                      </div>
                    </div>
                  </label>
                ))}

                {/* 4. Test Expenses */}
                {preview.eligibleExpenses.map(exp => (
                  <label 
                    key={exp.id}
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      alignItems: 'flex-start',
                      background: selectedExpenses.has(exp.id) ? '#fef2f2' : '#f8fafc',
                      border: `1px solid ${selectedExpenses.has(exp.id) ? '#fca5a5' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedExpenses.has(exp.id)} 
                      onChange={() => toggleExpense(exp.id)}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>
                        Expense: {exp.title}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                        Amount: ₹{Number(exp.amount).toFixed(2)} • Date: {exp.date}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Protected Records Section */}
            {preview.protectedRecords.length > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                  <ShieldCheck size={16} style={{ color: '#16a34a' }} />
                  Genuine Operational Records ({preview.protectedRecords.length}) — Strictly Preserved:
                </div>
                <div style={{ color: '#15803d', fontSize: '0.78rem', marginBottom: '6px' }}>
                  These records represent authentic operational activity or legitimate customers. They are protected by the system and cannot be deleted.
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#14532d', fontSize: '0.78rem' }}>
                  {preview.protectedRecords.map(pr => (
                    <li key={pr.id}>
                      <strong>{pr.name}</strong> ({pr.details})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirmation form */}
            {allEligibleCount > 0 && (
              <form onSubmit={handleSubmit}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.9rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <strong>Selected for cleanup:</strong> {totalSelected} record(s).
                  <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                    Records will be removed in transactional sequence respecting foreign-key constraints.
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Type <strong>DELETE</strong> to confirm cleanup:
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    required
                    placeholder="DELETE"
                    value={confirmInput}
                    onChange={e => setConfirmInput(e.target.value)}
                    style={{ minHeight: '42px', fontSize: '0.95rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ minHeight: '42px', padding: '0.5rem 1rem' }}
                    onClick={onClose}
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
                      opacity: (submitting || confirmInput.trim().toUpperCase() !== 'DELETE' || totalSelected === 0) ? 0.6 : 1,
                      cursor: (submitting || confirmInput.trim().toUpperCase() !== 'DELETE' || totalSelected === 0) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={submitting || confirmInput.trim().toUpperCase() !== 'DELETE' || totalSelected === 0}
                  >
                    {submitting ? 'Cleaning Up...' : `Clean Up ${totalSelected} Record(s)`}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
