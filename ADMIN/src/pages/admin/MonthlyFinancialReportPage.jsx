import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { financialReportService } from '../../services/financialReportService';
import { dataManagementService } from '../../services/dataManagementService';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Archive, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Receipt, 
  CreditCard, 
  FileText,
  Lock,
  Trash2,
  X
} from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyFinancialReportPage() {
  const { profile } = useAuth();
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  
  const [report, setReport] = useState(null);
  const [archivedMonths, setArchivedMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'payments' | 'expenses' | 'archives'
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal states
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [submittingClose, setSubmittingClose] = useState(false);

  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [clearAllPreview, setClearAllPreview] = useState(null);
  const [clearAllInput, setClearAllInput] = useState('');
  const [submittingClearAll, setSubmittingClearAll] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const [reportData, allArchives] = await Promise.all([
        financialReportService.getMonthlyFinancialReport(selectedYear, selectedMonth),
        financialReportService.getAllArchivedMonths()
      ]);

      setReport(reportData);
      setArchivedMonths(allArchives);
    } catch (err) {
      console.error('[MonthlyFinancialReport] Load error:', err);
      setMessage({ type: 'error', text: 'Failed to load financial report: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const handleCloseMonthSubmit = async (e) => {
    e.preventDefault();
    if (!report) return;

    try {
      setSubmittingClose(true);
      await financialReportService.closeAndArchiveMonth({
        year: selectedYear,
        month: selectedMonth,
        reportData: report,
        notes: closeNotes,
        adminUser: profile
      });

      setMessage({ 
        type: 'success', 
        text: `Month ${report.monthYear} has been successfully closed and finalized. The snapshot is permanently preserved.` 
      });
      setShowCloseModal(false);
      setCloseNotes('');
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error closing month: ' + err.message });
    } finally {
      setSubmittingClose(false);
    }
  };

  const handleOpenClearAll = async () => {
    try {
      setLoading(true);
      const prev = await dataManagementService.previewMonthClearAll(selectedYear, selectedMonth);
      setClearAllPreview(prev);
      setClearAllInput('');
      setShowClearAllModal(true);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to inspect records: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllSubmit = async (e) => {
    e.preventDefault();
    const val = clearAllInput.trim().toUpperCase();
    if (val !== 'DELETE' && val !== 'DELETE ALL') return;

    try {
      setSubmittingClearAll(true);
      const res = await dataManagementService.executeMonthClearAll({
        year: selectedYear,
        month: selectedMonth,
        adminUser: profile,
        reason: 'Monthly financial report Clear All test data cleanup'
      });

      setMessage({ type: 'success', text: res.message });
      setShowClearAllModal(false);
      setClearAllInput('');
      setClearAllPreview(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Clear All failed: ' + err.message });
    } finally {
      setSubmittingClearAll(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    financialReportService.exportMonthlySummaryCSV(report);
  };

  // Generate year options (current year down 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    yearOptions.push(y);
  }

  const expectedConfirmPhrase = report ? `ARCHIVE-${report.monthYear}` : '';

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={24} style={{ color: 'var(--primary-color)' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Monthly Financial Report
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Reliable month-wise cash movement, actual receipts, operational expenses, and safe closing.
          </p>
        </div>

        {/* Date Selector, Test Toggle & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', outline: 'none' }}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', outline: 'none' }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-outline" onClick={loadData} disabled={loading} style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button className="btn btn-outline" onClick={handleExportCSV} disabled={!report} style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Download size={15} /> Export CSV
          </button>

          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={handleOpenClearAll}
            title="Safely clear disposable test data for this month"
            style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#b91c1c', borderColor: '#fca5a5' }}
          >
            <Trash2 size={15} /> Clear All
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          background: message.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: message.type === 'error' ? '#991b1b' : '#065f46',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Archive Status Banner */}
      {report && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          background: report.isArchived ? '#f8fafc' : '#f0fdf4',
          border: `1px solid ${report.isArchived ? '#cbd5e1' : '#bbf7d0'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {report.isArchived ? (
              <Lock size={22} style={{ color: '#475569' }} />
            ) : (
              <ShieldCheck size={22} style={{ color: '#16a34a' }} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: report.isArchived ? '#334155' : '#166534' }}>
                {report.isArchived ? 'Finalized & Archived Month' : 'Active Financial Period'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {report.isArchived 
                  ? `Closed on ${new Date(report.archivedSnapshot?.closed_at || '').toLocaleDateString()} — Preserved for official review.`
                  : 'Open period. Live receipts and expenses are dynamically aggregated.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!report.isArchived ? (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setShowCloseModal(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '38px' }}
              >
                <Archive size={15} /> Close &amp; Archive Month
              </button>
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> Preserved Snapshot
              </span>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          Calculating monthly financial metrics...
        </div>
      ) : report ? (
        <>
          {/* KEY FINANCIAL METRICS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            
            {/* 1. Actual Payments Received */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>ACTUAL RECEIPTS</span>
                <DollarSign size={16} style={{ color: '#16a34a' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>
                ₹{report.actualCashReceived.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {report.paymentsCount} payments received ({report.paymentMethods.cash > 0 ? `Cash: ₹${report.paymentMethods.cash.toFixed(0)}` : ''} {report.paymentMethods.upi > 0 ? `UPI: ₹${report.paymentMethods.upi.toFixed(0)}` : ''})
              </div>
            </div>

            {/* 2. Recorded Expenses */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>RECORDED EXPENSES</span>
                <TrendingDown size={16} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>
                ₹{report.recordedExpenses.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {report.expensesCount} operational expenses incurred
              </div>
            </div>

            {/* 3. Net Cash Movement */}
            <div className="card" style={{ 
              padding: '1.25rem', 
              borderLeft: `4px solid ${report.netCashMovement >= 0 ? '#0284c7' : '#ea580c'}` 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>NET CASH MOVEMENT</span>
                <TrendingUp size={16} style={{ color: report.netCashMovement >= 0 ? '#0284c7' : '#ea580c' }} />
              </div>
              <div style={{ 
                fontSize: '1.6rem', 
                fontWeight: 800, 
                color: report.netCashMovement >= 0 ? '#0284c7' : '#ea580c', 
                marginTop: '0.5rem' 
              }}>
                {report.netCashMovement >= 0 ? '+' : ''}₹{report.netCashMovement.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Actual receipts minus recorded expenses
              </div>
            </div>

            {/* 4. Invoiced Revenue */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>INVOICED REVENUE</span>
                <Receipt size={16} style={{ color: '#8b5cf6' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6d28d9', marginTop: '0.5rem' }}>
                ₹{report.invoicedRevenue.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {report.billsCount} valid bills / invoices generated
              </div>
            </div>

            {/* 5. Outstanding Customer Balances */}
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>OUTSTANDING BALANCE</span>
                <AlertCircle size={16} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: '0.5rem' }}>
                ₹{report.outstandingDue.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Uncollected guest dues from this month
              </div>
            </div>

          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
            <button 
              type="button" 
              onClick={() => setActiveTab('summary')}
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'summary' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === 'summary' ? 'var(--primary-color)' : 'var(--text-muted)'
              }}
            >
              Overview &amp; Breakdown
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('payments')}
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'payments' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === 'payments' ? 'var(--primary-color)' : 'var(--text-muted)'
              }}
            >
              Itemized Payments ({report.paymentsCount})
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('expenses')}
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'expenses' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === 'expenses' ? 'var(--primary-color)' : 'var(--text-muted)'
              }}
            >
              Itemized Expenses ({report.expensesCount})
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('archives')}
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                background: 'transparent',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'archives' ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === 'archives' ? 'var(--primary-color)' : 'var(--text-muted)'
              }}
            >
              Archived Months History ({archivedMonths.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & BREAKDOWN */}
          {activeTab === 'summary' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Payment Methods Breakdown */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Payment Methods Received</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(report.paymentMethods).map(([method, amount]) => (
                    <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-main)' }}>
                        {method}
                      </span>
                      <span style={{ fontWeight: 700, color: amount > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                        ₹{amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories Breakdown */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Expense Categories</h3>
                {Object.keys(report.expenseCategories).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No expenses recorded this month.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(report.expenseCategories).map(([cat, amount]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-main)' }}>
                          {cat.replace('_', ' ')}
                        </span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>
                          ₹{amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Operational Activity Summary */}
              <div className="card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Monthly Operations Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Bookings</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>{report.bookingsCount}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoices / Bills Generated</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>{report.billsCount}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Individual Payments Collected</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>{report.paymentsCount}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operational Expenses Incurred</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>{report.expensesCount}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ITEMIZED PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                Payments Received in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>
              {report.paymentsList.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No payments were recorded during this month.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem' }}>Payment Date</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Invoice #</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.paymentsList.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>{p.paid_at ? new Date(p.paid_at).toLocaleString() : '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.bills?.invoice_number || 'Direct'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{p.bills?.customers?.full_name || 'Guest'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                              {p.payment_method || 'CASH'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            ₹{Number(p.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ITEMIZED EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                Expenses Recorded in {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>
              {report.expensesList.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No expenses were recorded during this month.
                </div>
              ) : (
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
                      {report.expensesList.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 1rem' }}>{e.expense_date}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{e.title}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                              {e.category?.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                            {e.profiles?.full_name || 'Staff'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{e.description || '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                            ₹{Number(e.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ARCHIVED MONTHS HISTORY */}
          {activeTab === 'archives' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>
                Permanently Archived Monthly Summaries
              </div>
              {archivedMonths.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No months have been finalized and archived yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                      <tr>
                        <th style={{ padding: '0.75rem 1rem' }}>Month / Year</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Date Range</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actual Receipts</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Expenses</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net Movement</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Closed At</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedMonths.map((arch, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{arch.month_year}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {arch.date_from} to {arch.date_to}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                            ₹{Number(arch.actual_payments_received || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                            ₹{Number(arch.recorded_expenses || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: Number(arch.net_cash_movement) >= 0 ? '#0284c7' : '#ea580c' }}>
                            {Number(arch.net_cash_movement) >= 0 ? '+' : ''}₹{Number(arch.net_cash_movement || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {arch.closed_at ? new Date(arch.closed_at).toLocaleDateString() : 'Finalized'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <button 
                              type="button" 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                const [y, m] = arch.month_year.split('-');
                                setSelectedYear(Number(y));
                                setSelectedMonth(Number(m));
                                setActiveTab('summary');
                              }}
                            >
                              View Summary
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}

      {/* MODAL 1: CLOSE & ARCHIVE MONTH */}
      {showCloseModal && report && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '1.5rem', borderRadius: '8px', background: 'white', position: 'relative' }}>
            <button 
              type="button" 
              onClick={() => setShowCloseModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Archive size={22} style={{ color: 'var(--primary-color)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Close &amp; Archive Month</h2>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Closing <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong> will create a finalized, immutable monthly financial snapshot. Future records will not alter this snapshot.
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Actual Cash Received:</span>
                <strong style={{ color: '#16a34a' }}>₹{report.actualCashReceived.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recorded Expenses:</span>
                <strong style={{ color: '#ef4444' }}>₹{report.recordedExpenses.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                <span>Net Cash Movement:</span>
                <strong style={{ color: report.netCashMovement >= 0 ? '#0284c7' : '#ea580c' }}>
                  {report.netCashMovement >= 0 ? '+' : ''}₹{report.netCashMovement.toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleCloseMonthSubmit}>
              <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label">Closing Notes / Auditor Remarks (Optional)</label>
                <textarea 
                  className="input" 
                  rows={2}
                  placeholder="e.g. Accounts verified by management. All bills cleared."
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCloseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingClose}>
                  {submittingClose ? 'Closing Month...' : 'Confirm & Finalize Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRMATION MODAL */}
      {showClearAllModal && clearAllPreview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', borderRadius: '10px', background: 'white', position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
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
                Clear Test Records ({clearAllPreview.monthYear})?
              </h2>
            </div>

            {/* Explanation box: What will be deleted vs preserved */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.9rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: '6px' }}>
                Test records to be cleared ({clearAllPreview.totalEligibleCount} total):
              </div>
              <ul style={{ margin: '0 0 10px 0', paddingLeft: '1.25rem', color: '#475569', lineHeight: 1.5 }}>
                <li><strong>{clearAllPreview.eligibleExpenses.length}</strong> test expense(s)</li>
                <li><strong>{clearAllPreview.eligibleBills.length}</strong> unpaid test bill(s)</li>
                <li><strong>{clearAllPreview.eligibleBookings.length}</strong> unlinked test booking(s)</li>
              </ul>

              <div style={{ fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Guaranteed Protected Records:</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#166534', lineHeight: 1.5 }}>
                <li><strong>{clearAllPreview.protectedPaidBills.length}</strong> paid invoice(s) &amp; cash payment receipts</li>
                <li><strong>{clearAllPreview.genuineExpenses.length}</strong> genuine operating expense(s)</li>
                <li>All legitimate customer and booking records</li>
              </ul>
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
                  {submittingClearAll ? 'Clearing...' : 'Clear Test Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
