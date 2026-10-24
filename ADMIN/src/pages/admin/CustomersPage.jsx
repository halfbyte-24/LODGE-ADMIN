import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { dataManagementService } from '../../services/dataManagementService';
import CleanUpTestDataModal from '../../components/CleanUpTestDataModal';
import { Users, Search, RefreshCw, Trash2, X, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CustomersPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  // Delete modal state
  const [selectedCust, setSelectedCust] = useState(null);
  const [custDependency, setCustDependency] = useState(null);
  const [checkingDeps, setCheckingDeps] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const [{ data: custList, error }, { data: bookings }, { data: bills }] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('id, customer_id'),
        supabase.from('bills').select('id, customer_id')
      ]);

      if (error) throw error;

      const enhanced = (custList || []).map(c => {
        const bCount = (bookings || []).filter(b => b.customer_id === c.id).length;
        const billCount = (bills || []).filter(bill => bill.customer_id === c.id).length;
        return {
          ...c,
          bookings_count: bCount,
          bills_count: billCount,
          has_dependencies: bCount > 0 || billCount > 0
        };
      });

      setCustomers(enhanced);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error loading customers: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(term) ||
      (c.phone || '').includes(term) ||
      (c.email || '').toLowerCase().includes(term) ||
      (c.id || '').includes(term)
    );
  });

  const handleOpenDelete = async (cust) => {
    setSelectedCust(cust);
    setDeleteInput('');
    setCheckingDeps(true);
    try {
      const dep = await dataManagementService.inspectCustomerDependencies(cust.id);
      setCustDependency(dep);
    } catch (err) {
      setMessage({ type: 'error', text: 'Dependency check failed: ' + err.message });
    } finally {
      setCheckingDeps(false);
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCust) return;

    try {
      setSubmittingDelete(true);
      const res = await dataManagementService.deleteCustomer({
        id: selectedCust.id,
        confirmText: deleteInput.trim(),
        adminUser: profile,
        reason: 'Unlinked test customer deleted from guest management'
      });

      setMessage({ type: 'success', text: res.message });
      setSelectedCust(null);
      setCustDependency(null);
      setDeleteInput('');
      await loadCustomers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleMarkAsTest = async (cust) => {
    try {
      setSubmittingDelete(true);
      await dataManagementService.setTestDataFlag({
        entityType: 'customers',
        id: cust.id,
        isTest: true,
        adminUser: profile,
        reason: 'Marked as test customer to isolate from operational reports'
      });

      setMessage({ type: 'success', text: `Customer "${cust.full_name}" marked as test data.` });
      setSelectedCust(null);
      await loadCustomers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Update failed: ' + err.message });
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} style={{ color: 'var(--primary-color)' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Guests &amp; Customers
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Manage hotel guests and customer accounts with safe dependency verification.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn" 
            onClick={() => setShowCleanupModal(true)} 
            style={{ background: '#b91c1c', color: 'white', minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <Trash2 size={16} /> Clean Up Test Data
          </button>
          <button className="btn btn-outline" onClick={loadCustomers} disabled={loading} style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Alert message */}
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

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input" 
            style={{ width: '100%', paddingLeft: '2.25rem' }} 
            placeholder="Search guest name, phone, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          Loading guests...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No customers found</h3>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Full Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Contact Info</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>History &amp; Linkage</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(cust => (
                  <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{cust.full_name || 'Guest'}</td>
                    <td style={{ padding: '1rem' }}>
                      <div>{cust.phone || '—'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{cust.email || '—'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        background: cust.customer_type === 'room_guest' ? '#eff6ff' : '#f1f5f9',
                        color: cust.customer_type === 'room_guest' ? '#1e40af' : '#475569',
                        textTransform: 'capitalize'
                      }}>
                        {cust.customer_type?.replace('_', ' ') || 'Guest'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        background: cust.has_dependencies ? '#e0f2fe' : '#f1f5f9',
                        color: cust.has_dependencies ? '#0369a1' : '#64748b'
                      }}>
                        {cust.bookings_count} Bookings • {cust.bills_count} Bills
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(cust.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleOpenDelete(cust)}
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

      {/* DELETE CUSTOMER MODAL */}
      {selectedCust && (
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
              onClick={() => { setSelectedCust(null); setCustDependency(null); setDeleteInput(''); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} style={{ color: '#b91c1c' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {custDependency && !custDependency.canDelete ? 'Cannot Delete Customer' : 'Delete Customer?'}
              </h2>
            </div>

            {checkingDeps ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                Checking records...
              </div>
            ) : custDependency && !custDependency.canDelete ? (
              /* Blocked due to payment dependencies */
              <div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Customer:</strong> {selectedCust.full_name}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Linked bookings:</strong> {custDependency.linkedBookings?.length || 0}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Linked invoices:</strong> {custDependency.linkedBills?.length || 0}</div>
                  <div style={{ color: '#b91c1c', fontWeight: 600 }}><strong>Payments recorded:</strong> {custDependency.totalPaymentsCount || 0} (₹{(custDependency.totalPaymentsAmount || 0).toFixed(2)})</div>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.5 }}>
                  {custDependency.reason || 'This customer has financial payment history. Permanent deletion is disabled to preserve accounting audit records.'}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  If this is a test account with dummy payments, mark it as test data to isolate it from reports. Payments require a separate audited correction.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ minHeight: '42px', padding: '0.5rem 1rem' }}
                    onClick={() => { setSelectedCust(null); setCustDependency(null); }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    style={{ minHeight: '42px', padding: '0.5rem 1.25rem', fontWeight: 600 }}
                    onClick={() => handleMarkAsTest(selectedCust)}
                    disabled={submittingDelete}
                  >
                    {submittingDelete ? 'Updating...' : 'Mark as Test Data'}
                  </button>
                </div>
              </div>
            ) : (
              /* Safe to delete customer */
              <form onSubmit={handleDeleteSubmit}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Customer:</strong> {selectedCust.full_name}</div>
                  <div style={{ marginBottom: '4px' }}><strong>Linked bookings:</strong> {custDependency?.linkedBookings?.length || 0}</div>
                  <div><strong>Linked invoices:</strong> {custDependency?.linkedBills?.length || 0}</div>
                </div>

                {custDependency?.hasPayments && custDependency?.isDemoCustomer ? (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                    <strong>Atomic Demo Cleanup:</strong> Deleting this demo customer will safely remove their {custDependency.linkedBookings?.length || 0} linked test booking(s), {custDependency.linkedBills?.length || 0} invoice(s), and {custDependency.totalPaymentsCount} test payment receipt(s) (₹{(custDependency.totalPaymentsAmount || 0).toFixed(2)}) without leaving orphaned financial records.
                  </div>
                ) : custDependency?.hasUnpaidDependencies ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                    Deleting this customer will safely remove their {custDependency.linkedBookings?.length || 0} linked test booking(s) and {custDependency.linkedBills?.length || 0} unpaid test invoice(s).
                  </div>
                ) : (
                  <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '1rem', lineHeight: 1.5 }}>
                    Are you sure you want to delete this customer? This action cannot be undone.
                  </p>
                )}

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
                    onClick={() => { setSelectedCust(null); setCustDependency(null); setDeleteInput(''); }}
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
                    {submittingDelete ? 'Deleting...' : 'Delete Customer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Clean Up Test Data Modal */}
      <CleanUpTestDataModal 
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        onSuccess={(msg) => {
          setMessage({ type: 'success', text: msg });
          loadCustomers();
        }}
      />

    </div>
  );
}
