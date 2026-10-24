import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { dataManagementService } from '../../services/dataManagementService';
import { Receipt, Search, RefreshCw, FileText, Trash2, X, AlertTriangle, ShieldCheck, Printer } from 'lucide-react';

export default function BillHistoryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Delete modal state
  const [selectedBill, setSelectedBill] = useState(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Clear All modal state
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllInput, setClearAllInput] = useState('');
  const [submittingClearAll, setSubmittingClearAll] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bills')
        .select('*, customers(full_name, phone), bookings(room_id, rooms(room_number)), payments(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load invoices: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredBills = bills.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (b.invoice_number || '').toLowerCase().includes(term) ||
      (b.customers?.full_name || '').toLowerCase().includes(term) ||
      (b.customers?.phone || '').includes(term) ||
      (b.bookings?.rooms?.room_number || '').toString().includes(term)
    );
  });

  // Eligible for bulk clear: 0 payments and draft/cancelled or is_test_data
  const eligibleTestBills = bills.filter(b => {
    const hasZeroPayments = (b.payments?.length || 0) === 0;
    const isTestOrDraft = b.is_test_data === true || b.bill_status === 'draft' || b.bill_status === 'cancelled';
    return hasZeroPayments && isTestOrDraft;
  });
  const eligibleTestBillsTotal = eligibleTestBills.reduce((s, b) => s + Number(b.total_amount || 0), 0);

  // Individual Delete Handler
  const handleDeleteBill = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      setSubmittingDelete(true);
      const res = await dataManagementService.deleteBill({
        id: selectedBill.id,
        confirmText: deleteInput.trim(),
        adminUser: profile,
        reason: 'Invoice deleted from sales report'
      });

      setMessage({ type: 'success', text: res.message });
      setSelectedBill(null);
      setDeleteInput('');
      await loadHistory();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Mark as Test Handler (for paid invoices that cannot be hard deleted)
  const handleMarkAsTest = async (billId) => {
    try {
      setSubmittingDelete(true);
      await dataManagementService.setTestDataFlag({
        entityType: 'bills',
        id: billId,
        isTest: true,
        adminUser: profile,
        reason: 'Marked as test data to isolate from revenue totals'
      });

      setMessage({ type: 'success', text: 'Invoice marked as test data and isolated from revenue totals.' });
      setSelectedBill(null);
      await loadHistory();
    } catch (err) {
      setMessage({ type: 'error', text: 'Update failed: ' + err.message });
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Bulk Clear All Test Invoices Handler
  const handleClearAllSubmit = async (e) => {
    e.preventDefault();
    const val = clearAllInput.trim().toUpperCase();
    if (val !== 'DELETE' && val !== 'DELETE ALL') return;

    try {
      setSubmittingClearAll(true);
      const res = await dataManagementService.clearEligibleTestBills({
        adminUser: profile,
        reason: 'Sales report bulk test invoices cleanup'
      });

      setMessage({ type: 'success', text: res.message });
      setShowClearAllModal(false);
      setClearAllInput('');
      await loadHistory();
    } catch (err) {
      setMessage({ type: 'error', text: 'Clear All failed: ' + err.message });
    } finally {
      setSubmittingClearAll(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Invoice &amp; Sales Report</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Complete audit trail of all generated invoices and receipts.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={loadHistory} disabled={loading} style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          {eligibleTestBills.length > 0 && (
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => { setShowClearAllModal(true); setClearAllInput(''); }}
              style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#b91c1c', borderColor: '#fca5a5' }}
            >
              <Trash2 size={15} /> Clear All ({eligibleTestBills.length} Test Invoices)
            </button>
          )}
        </div>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#991b1b' : '#166534',
          fontSize: '0.875rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Search Input */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input" 
            style={{ width: '100%', paddingLeft: '2.25rem' }} 
            placeholder="Search invoice number, guest name, phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          Loading invoices...
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No invoices recorded</h3>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Invoice #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Room / Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Bill Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(b => {
                  const hasPayments = (b.payments?.length || 0) > 0;
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{b.invoice_number}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500 }}>{b.customers?.full_name || 'Guest'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{b.customers?.phone || '—'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {b.bookings?.rooms?.room_number ? `Room ${b.bookings.rooms.room_number}` : 'Restaurant Only'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>
                        ₹{Number(b.total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem',
                          background: b.bill_status === 'completed' ? '#d1fae5' : '#eff6ff',
                          color: b.bill_status === 'completed' ? '#065f46' : '#1e40af'
                        }}>
                          {b.bill_status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: b.payment_status === 'paid' ? '#d1fae5' : '#fee2e2',
                          color: b.payment_status === 'paid' ? '#065f46' : '#991b1b'
                        }}>
                          {b.payment_status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => navigate(`/admin/invoice/${b.id}`)}
                          style={{
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.78rem',
                            color: 'var(--primary-color)',
                            borderColor: 'var(--primary-color)',
                            marginRight: '0.5rem'
                          }}
                          title="View & Print Thermal Invoice"
                        >
                          <Printer size={13} style={{ display: 'inline', marginRight: '3px' }} />
                          Invoice
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => { setSelectedBill(b); setDeleteInput(''); }}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: INDIVIDUAL INVOICE DELETE / SAFE CHECK */}
      {selectedBill && (
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
              onClick={() => { setSelectedBill(null); setDeleteInput(''); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} style={{ color: '#b91c1c' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {(selectedBill.payments && selectedBill.payments.length > 0) ? 'Invoice Cannot Be Deleted' : 'Delete Invoice?'}
              </h2>
            </div>

            {/* If bill has payments, block permanent deletion and offer test mark */}
            {(selectedBill.payments && selectedBill.payments.length > 0) ? (
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Invoice:</strong> {selectedBill.invoice_number}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Customer:</strong> {selectedBill.customers?.full_name || 'Guest'}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Amount:</strong> ₹{Number(selectedBill.total_amount).toFixed(2)}</div>
                  <div><strong>Payment records:</strong> {selectedBill.payments.length} payment(s)</div>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.5 }}>
                  This invoice has payment records. Deleting it could affect financial history, so permanent deletion is disabled.
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  If this was a test invoice, you can mark it as test data. Test records will be excluded from relevant financial totals, while the audit history remains preserved.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ minHeight: '42px', padding: '0.5rem 1rem' }}
                    onClick={() => setSelectedBill(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    style={{ minHeight: '42px', padding: '0.5rem 1.25rem', fontWeight: 600 }}
                    onClick={() => handleMarkAsTest(selectedBill.id)}
                    disabled={submittingDelete}
                  >
                    {submittingDelete ? 'Updating...' : 'Mark as Test Data'}
                  </button>
                </div>
              </div>
            ) : (
              /* If bill has 0 payments, allow simple DELETE confirmation */
              <form onSubmit={handleDeleteBill}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Invoice:</strong> {selectedBill.invoice_number}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Customer:</strong> {selectedBill.customers?.full_name || 'Guest'}</div>
                  <div><strong>Amount:</strong> ₹{Number(selectedBill.total_amount).toFixed(2)} (0 payments recorded)</div>
                </div>

                <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
                  This invoice will be permanently deleted. This action cannot be undone.
                </p>

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
                    onClick={() => { setSelectedBill(null); setDeleteInput(''); }}
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
                    {submittingDelete ? 'Deleting...' : 'Delete Invoice'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CLEAR ALL TEST INVOICES */}
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
                Clear Test Invoices?
              </h2>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '6px' }}>
                Found <strong>{eligibleTestBills.length}</strong> unpaid test invoice(s) totaling <strong>₹{eligibleTestBillsTotal.toFixed(2)}</strong>.
              </div>
              <div style={{ color: '#166534', fontWeight: 600 }}>
                All genuine paid bills and customer receipts are strictly protected.
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
                  {submittingClearAll ? 'Clearing...' : 'Clear Test Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
