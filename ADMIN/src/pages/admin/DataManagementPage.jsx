import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataManagementService } from '../../services/dataManagementService';
import CleanUpTestDataModal from '../../components/CleanUpTestDataModal';
import { 
  Database, 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Users, 
  CalendarCheck, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  Info,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';

const TABS = [
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'bills', label: 'Bills / Invoices', icon: Receipt },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'expenses', label: 'Expenses', icon: DollarSign },
];

export default function DataManagementPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'test_only', 'genuine_only'
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  // Modal states
  const [flagModal, setFlagModal] = useState({ open: false, record: null, newFlag: false, cascade: true, reason: '', submitting: false });
  const [deleteModal, setDeleteModal] = useState({ open: false, record: null, confirmInput: '', reason: '', submitting: false });

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const data = await dataManagementService.loadEntities(activeTab);
      setRecords(data || []);
    } catch (err) {
      console.error('[DataManagement] Load error:', err);
      setMessage({ type: 'error', text: 'Failed to load records: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Filtered records
  const filteredRecords = records.filter(item => {
    // Test filter
    if (filterMode === 'test_only' && !item.is_test_data) return false;
    if (filterMode === 'genuine_only' && item.is_test_data) return false;

    // Search filter
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    if (activeTab === 'customers') {
      return (
        (item.full_name || '').toLowerCase().includes(term) ||
        (item.phone || '').includes(term) ||
        (item.email || '').toLowerCase().includes(term) ||
        (item.id || '').includes(term)
      );
    }
    if (activeTab === 'bookings') {
      return (
        (item.booking_number || '').toLowerCase().includes(term) ||
        (item.customer_name || '').toLowerCase().includes(term) ||
        (item.id || '').includes(term)
      );
    }
    if (activeTab === 'bills') {
      return (
        (item.invoice_number || '').toLowerCase().includes(term) ||
        (item.customer_name || '').toLowerCase().includes(term) ||
        (item.id || '').includes(term)
      );
    }
    if (activeTab === 'payments') {
      return (
        (item.invoice_number || '').toLowerCase().includes(term) ||
        (item.customer_name || '').toLowerCase().includes(term) ||
        (item.payment_method || '').toLowerCase().includes(term) ||
        (item.id || '').includes(term)
      );
    }
    if (activeTab === 'expenses') {
      return (
        (item.title || '').toLowerCase().includes(term) ||
        (item.category || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term) ||
        (item.id || '').includes(term)
      );
    }
    return true;
  });

  // Action handlers
  const openFlagModal = (record, newFlag) => {
    setFlagModal({
      open: true,
      record,
      newFlag,
      cascade: activeTab === 'customers' || activeTab === 'bookings',
      reason: newFlag ? 'Flagging verified test entity and related transactions' : 'Restoring genuine operational entity',
      submitting: false
    });
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!flagModal.record) return;

    try {
      setFlagModal(prev => ({ ...prev, submitting: true }));
      const res = await dataManagementService.setTestDataFlag({
        entityType: activeTab,
        id: flagModal.record.id,
        isTest: flagModal.newFlag,
        cascade: flagModal.cascade,
        adminUser: profile,
        reason: flagModal.reason
      });

      setMessage({ type: 'success', text: res.message });
      setFlagModal({ open: false, record: null, newFlag: false, cascade: true, reason: '', submitting: false });
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error setting test flag: ' + err.message });
      setFlagModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const openDeleteModal = (record) => {
    if (!record.can_permanently_delete) {
      alert('This record has active foreign key dependencies and cannot be deleted. Flag it as test data instead.');
      return;
    }

    setDeleteModal({
      open: true,
      record,
      confirmInput: '',
      reason: 'Admin verified unlinked test sandbox entry',
      submitting: false
    });
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deleteModal.record) return;

    try {
      setDeleteModal(prev => ({ ...prev, submitting: true }));
      const res = await dataManagementService.deletePermanently({
        entityType: activeTab,
        id: deleteModal.record.id,
        confirmText: deleteModal.confirmInput.trim(),
        adminUser: profile,
        reason: deleteModal.reason
      });

      setMessage({ type: 'success', text: res.message });
      setDeleteModal({ open: false, record: null, confirmInput: '', reason: '', submitting: false });
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Deletion failed: ' + err.message });
      setDeleteModal(prev => ({ ...prev, submitting: false }));
    }
  };

  // Stats for the active tab
  const totalCount = records.length;
  const testCount = records.filter(r => r.is_test_data).length;
  const genuineCount = totalCount - testCount;
  const safeDeleteCount = records.filter(r => r.can_permanently_delete && r.is_test_data).length;

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1300px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={24} style={{ color: 'var(--primary-color)' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Admin Data Management &amp; Test Cleanup
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Inspect dependencies, safely classify test sandbox entries, and purge verified unlinked records without altering genuine financial history.
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
          <button className="btn btn-outline" onClick={loadData} disabled={loading} style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {message.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: message.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#86efac'}`,
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'transparent',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>TOTAL {activeTab.toUpperCase()}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{totalCount}</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>FLAGGED AS TEST DATA</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{testCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Excluded from clean reports</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>GENUINE OPERATIONAL</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{genuineCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Protected active records</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>SAFE UNLINKED TEST</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{safeDeleteCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0 dependencies (permanent purge safe)</div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              style={{ width: '100%', paddingLeft: '2.25rem' }} 
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="input" 
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
          >
            <option value="all">Show All ({records.length})</option>
            <option value="test_only">Test Records Only ({testCount})</option>
            <option value="genuine_only">Genuine Records Only ({genuineCount})</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          Loading records and inspecting dependencies...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Info size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3>No records match your criteria</h3>
          <p>Try clearing your search term or switching filter mode.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Classification</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Record Info</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Details</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Linked Dependencies</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: item.is_test_data ? '#fffbeb' : 'transparent' }}>
                    
                    {/* 1. Classification */}
                    <td style={{ padding: '1rem' }}>
                      {item.is_test_data ? (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          background: '#fef3c7', 
                          color: '#92400e', 
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          border: '1px solid #fde68a'
                        }}>
                          TEST DATA
                        </span>
                      ) : (
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          background: '#f0fdf4', 
                          color: '#166534', 
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          border: '1px solid #bbf7d0'
                        }}>
                          GENUINE
                        </span>
                      )}
                    </td>

                    {/* 2. Record Info */}
                    <td style={{ padding: '1rem' }}>
                      {activeTab === 'customers' && (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.full_name || 'Unnamed'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID: {item.id.slice(0, 8)}...</div>
                        </div>
                      )}
                      {activeTab === 'bookings' && (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.booking_number || 'No Number'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID: {item.id.slice(0, 8)}...</div>
                        </div>
                      )}
                      {activeTab === 'bills' && (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.invoice_number || 'Draft'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID: {item.id.slice(0, 8)}...</div>
                        </div>
                      )}
                      {activeTab === 'payments' && (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>₹{Number(item.amount || 0).toFixed(2)}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID: {item.id.slice(0, 8)}...</div>
                        </div>
                      )}
                      {activeTab === 'expenses' && (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.title}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>ID: {item.id.slice(0, 8)}...</div>
                        </div>
                      )}
                    </td>

                    {/* 3. Details */}
                    <td style={{ padding: '1rem' }}>
                      {activeTab === 'customers' && (
                        <div style={{ fontSize: '0.8rem' }}>
                          <div>Phone: {item.phone || '—'}</div>
                          <div style={{ color: 'var(--text-muted)' }}>Email: {item.email || '—'}</div>
                        </div>
                      )}
                      {activeTab === 'bookings' && (
                        <div style={{ fontSize: '0.8rem' }}>
                          <div>Guest: {item.customer_name}</div>
                          <div style={{ color: 'var(--text-muted)' }}>Room: {item.room_number} • Status: {item.booking_status}</div>
                        </div>
                      )}
                      {activeTab === 'bills' && (
                        <div style={{ fontSize: '0.8rem' }}>
                          <div>Customer: {item.customer_name}</div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Total: ₹{Number(item.total_amount).toFixed(2)}</div>
                        </div>
                      )}
                      {activeTab === 'payments' && (
                        <div style={{ fontSize: '0.8rem' }}>
                          <div>Invoice: {item.invoice_number}</div>
                          <div style={{ color: 'var(--text-muted)' }}>Method: {item.payment_method?.toUpperCase()} • Guest: {item.customer_name}</div>
                        </div>
                      )}
                      {activeTab === 'expenses' && (
                        <div style={{ fontSize: '0.8rem' }}>
                          <div>Amount: ₹{Number(item.amount).toFixed(2)} • Date: {item.expense_date}</div>
                          <div style={{ color: 'var(--text-muted)' }}>Category: {item.category} • Recorded By: {item.recorded_by}</div>
                        </div>
                      )}
                    </td>

                    {/* 4. Linked Dependencies */}
                    <td style={{ padding: '1rem' }}>
                      {activeTab === 'customers' && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: item.linked_bookings_count > 0 ? '#e0f2fe' : '#f1f5f9', color: item.linked_bookings_count > 0 ? '#0369a1' : 'var(--text-muted)' }}>
                            {item.linked_bookings_count} Bookings
                          </span>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: item.linked_bills_count > 0 ? '#fef3c7' : '#f1f5f9', color: item.linked_bills_count > 0 ? '#b45309' : 'var(--text-muted)' }}>
                            {item.linked_bills_count} Bills
                          </span>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: item.linked_payments_count > 0 ? '#dcfce7' : '#f1f5f9', color: item.linked_payments_count > 0 ? '#15803d' : 'var(--text-muted)' }}>
                            {item.linked_payments_count} Payments
                          </span>
                        </div>
                      )}

                      {activeTab === 'bookings' && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: item.linked_bills_count > 0 ? '#fef3c7' : '#f1f5f9', color: item.linked_bills_count > 0 ? '#b45309' : 'var(--text-muted)' }}>
                            {item.linked_bills_count} Invoices
                          </span>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: item.linked_payments_count > 0 ? '#dcfce7' : '#f1f5f9', color: item.linked_payments_count > 0 ? '#15803d' : 'var(--text-muted)' }}>
                            {item.linked_payments_count} Payments
                          </span>
                        </div>
                      )}

                      {activeTab === 'bills' && (
                        <div>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: item.linked_payments_count > 0 ? '#dcfce7' : '#f1f5f9', color: item.linked_payments_count > 0 ? '#15803d' : 'var(--text-muted)' }}>
                            {item.linked_payments_count} Payment Receipts
                          </span>
                        </div>
                      )}

                      {activeTab === 'payments' && (
                        <div>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>
                            <Lock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                            Financial Receipt (Permanent Deletion Blocked)
                          </span>
                        </div>
                      )}

                      {activeTab === 'expenses' && (
                        <div>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: '#f1f5f9', color: 'var(--text-muted)' }}>
                            Standalone operational entry
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 5. Actions */}
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        
                        {/* Toggle Test Flag Button */}
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => openFlagModal(item, !item.is_test_data)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            minHeight: '28px',
                            color: item.is_test_data ? '#16a34a' : '#d97706',
                            borderColor: item.is_test_data ? '#bbf7d0' : '#fde68a'
                          }}
                        >
                          {item.is_test_data ? 'Mark Genuine' : 'Flag as Test'}
                        </button>

                        {/* Permanent Delete Button */}
                        <button
                          type="button"
                          className="btn"
                          disabled={!item.can_permanently_delete}
                          onClick={() => openDeleteModal(item)}
                          title={item.can_permanently_delete ? 'Permanently purge unlinked test entry' : 'Cannot delete: record has linked child dependencies'}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            minHeight: '28px',
                            background: item.can_permanently_delete ? '#fee2e2' : '#f1f5f9',
                            color: item.can_permanently_delete ? '#991b1b' : '#94a3b8',
                            border: `1px solid ${item.can_permanently_delete ? '#fca5a5' : '#e2e8f0'}`,
                            cursor: item.can_permanently_delete ? 'pointer' : 'not-allowed'
                          }}
                        >
                          <Trash2 size={13} style={{ display: 'inline', marginRight: '3px' }} />
                          Purge
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

      {/* MODAL 1: CASCADING TEST DATA FLAGGING */}
      {flagModal.open && flagModal.record && (
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
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '1.5rem', borderRadius: '8px', background: 'white', position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setFlagModal({ open: false, record: null, newFlag: false, cascade: true, reason: '', submitting: false })}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ShieldCheck size={22} style={{ color: flagModal.newFlag ? '#d97706' : '#16a34a' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {flagModal.newFlag ? 'Flag as Test Data' : 'Restore to Genuine Data'}
              </h2>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Target:</strong> {activeTab.slice(0, -1).toUpperCase()} ID: {flagModal.record.id}</div>
              {flagModal.record.full_name && <div><strong>Name:</strong> {flagModal.record.full_name}</div>}
              {flagModal.record.invoice_number && <div><strong>Invoice:</strong> {flagModal.record.invoice_number}</div>}
            </div>

            {(activeTab === 'customers' || activeTab === 'bookings') && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem', color: '#92400e' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={flagModal.cascade} 
                    onChange={e => setFlagModal(prev => ({ ...prev, cascade: e.target.checked }))} 
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    <strong>Cascading Consistency (Recommended):</strong> Automatically flag/unflag all linked child bookings, bills, and payment records so financial reports remain mathematically balanced.
                  </span>
                </label>
              </div>
            )}

            <form onSubmit={handleFlagSubmit}>
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label">Reason / Remarks (For Audit Trail) *</label>
                <input 
                  type="text" 
                  className="input" 
                  required
                  placeholder="e.g. Staging test customer created during check-in testing"
                  value={flagModal.reason}
                  onChange={e => setFlagModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setFlagModal({ open: false, record: null, newFlag: false, cascade: true, reason: '', submitting: false })}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={flagModal.submitting}
                >
                  {flagModal.submitting ? 'Updating...' : 'Confirm Classification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STRICT TYPED CONFIRMATION PERMANENT DELETION */}
      {deleteModal.open && deleteModal.record && (
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
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '1.5rem', borderRadius: '8px', background: 'white', position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setDeleteModal({ open: false, record: null, confirmInput: '', reason: '', submitting: false })}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} style={{ color: '#b91c1c' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#b91c1c' }}>
                Permanent Test Record Deletion
              </h2>
            </div>

            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#991b1b' }}>
              <strong>Safety Verified:</strong> This record has <strong>0 dependencies</strong> and will be permanently purged. This action cannot be undone. An audit log will record your identity and timestamp.
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div><strong>Target:</strong> {activeTab.slice(0, -1).toUpperCase()} ID: {deleteModal.record.id}</div>
              {deleteModal.record.full_name && <div><strong>Name:</strong> {deleteModal.record.full_name}</div>}
              {deleteModal.record.title && <div><strong>Title:</strong> {deleteModal.record.title}</div>}
            </div>

            <form onSubmit={handleDeleteSubmit}>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Audit Reason *</label>
                <input 
                  type="text" 
                  className="input" 
                  required
                  placeholder="e.g. Verified sandbox test entry with no genuine history"
                  value={deleteModal.reason}
                  onChange={e => setDeleteModal(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label">
                  To confirm permanent deletion, type <strong>DELETE</strong>:
                </label>
                <input 
                  type="text" 
                  className="input" 
                  required
                  placeholder="DELETE"
                  value={deleteModal.confirmInput}
                  onChange={e => setDeleteModal(prev => ({ ...prev, confirmInput: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setDeleteModal({ open: false, record: null, confirmInput: '', reason: '', submitting: false })}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={{ background: '#b91c1c', color: 'white' }}
                  disabled={deleteModal.submitting || deleteModal.confirmInput.trim().toUpperCase() !== 'DELETE'}
                >
                  {deleteModal.submitting ? 'Purging...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE TEST DATA CLEANUP MODAL */}
      <CleanUpTestDataModal 
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        onSuccess={(msg) => {
          setMessage({ type: 'success', text: msg });
          loadData();
        }}
      />

    </div>
  );
}
