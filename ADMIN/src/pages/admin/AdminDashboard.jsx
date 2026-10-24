import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { dataManagementService } from '../../services/dataManagementService';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Users, 
  BedDouble, Receipt, AlertCircle, RefreshCw, ShieldCheck, Filter
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 'today', 'month', 'all'
  const [includeTestData, setIncludeTestData] = useState(false);
  const [excludedTestCount, setExcludedTestCount] = useState(0);
  const [stats, setStats] = useState({
    totalPaymentsReceived: 0,
    totalApprovedExpenses: 0,
    netProfitLoss: 0,
    todayPayments: 0,
    todayExpenses: 0,
    monthPayments: 0,
    monthExpenses: 0,
    totalBookingsCount: 0,
    pendingBookingsCount: 0,
    occupiedRoomsCount: 0,
    totalRoomsCount: 0,
    outstandingDue: 0,
    totalInvoicedRevenue: 0,
    recentPayments: [],
    recentBookings: []
  });

  const loadFinancialData = async () => {
    try {
      setLoading(true);

      const [paymentsRes, expensesRes, billsRes, bookingsRes, roomsRes] = await Promise.all([
        supabase.from('payments').select('*, bills(*)').order('paid_at', { ascending: false }),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('bills').select('*'),
        supabase.from('bookings').select('*, customers(*)').order('created_at', { ascending: false }),
        supabase.from('rooms').select('*')
      ]);

      const rawPayments = paymentsRes.data || [];
      const rawExpenses = expensesRes.data || [];
      const rawBills = billsRes.data || [];
      const rawBookings = bookingsRes.data || [];
      const rooms = roomsRes.data || [];

      // Exclude flagged test entries
      const payments = rawPayments.filter(p => !p.is_test_data);
      const expenses = rawExpenses.filter(e => !e.is_test_data);
      const bills = rawBills.filter(b => !b.is_test_data);
      const bookings = rawBookings.filter(b => !b.is_test_data);

      const todayStr = new Date().toISOString().split('T')[0];
      const currentMonthStr = todayStr.slice(0, 7); // 'YYYY-MM'

      // 1. Strict cash movements (Actual payments received)
      const totalPaymentsReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const todayPayments = payments
        .filter(p => (p.paid_at || '').startsWith(todayStr))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const monthPayments = payments
        .filter(p => (p.paid_at || '').startsWith(currentMonthStr))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // 2. Strict expenses (Approved or paid)
      const totalApprovedExpenses = expenses
        .filter(e => e.status !== 'rejected')
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const todayExpenses = expenses
        .filter(e => e.status !== 'rejected' && e.expense_date === todayStr)
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const monthExpenses = expenses
        .filter(e => e.status !== 'rejected' && (e.expense_date || '').startsWith(currentMonthStr))
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 3. Invoiced revenue & outstanding dues (completed/invoiced bills)
      const validBills = bills.filter(b => b.bill_status !== 'cancelled' && b.bill_status !== 'draft');
      const totalInvoicedRevenue = validBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const outstandingDue = Math.max(0, totalInvoicedRevenue - totalPaymentsReceived);

      // 4. Net Cash Profit / Loss = Actual Payments Received - Actual Expenses
      const netProfitLoss = totalPaymentsReceived - totalApprovedExpenses;

      // 5. Booking counts
      const pendingBookings = bookings.filter(b => b.booking_status === 'pending');
      const occupiedRooms = rooms.filter(r => r.status === 'occupied');

      setStats({
        totalPaymentsReceived,
        totalApprovedExpenses,
        netProfitLoss,
        todayPayments,
        todayExpenses,
        monthPayments,
        monthExpenses,
        totalBookingsCount: bookings.length,
        pendingBookingsCount: pendingBookings.length,
        occupiedRoomsCount: occupiedRooms.length,
        totalRoomsCount: rooms.length,
        outstandingDue,
        totalInvoicedRevenue,
        recentPayments: payments.slice(0, 5),
        recentBookings: bookings.slice(0, 5)
      });
    } catch (err) {
      console.error('Failed to calculate dashboard finances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1300px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Profit &amp; Loss Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Financial overview and operational health for Amontron Hotel and Restaurant.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={loadFinancialData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '40px' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Computing real financial analytics...</div>
      ) : (
        <>
          {/* PRIMARY CASH FLOW METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span>Actual Cash Received</span>
                <TrendingUp size={20} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.5rem' }}>
                ₹{stats.totalPaymentsReceived.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Today: ₹{stats.todayPayments.toFixed(2)} • Month: ₹{stats.monthPayments.toFixed(2)}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span>Approved Expenses</span>
                <TrendingDown size={20} color="#ef4444" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444', marginTop: '0.5rem' }}>
                ₹{stats.totalApprovedExpenses.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Today: ₹{stats.todayExpenses.toFixed(2)} • Month: ₹{stats.monthExpenses.toFixed(2)}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${stats.netProfitLoss >= 0 ? '#10b981' : '#ef4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span>Net Cash Movement</span>
                <DollarSign size={20} color={stats.netProfitLoss >= 0 ? '#10b981' : '#ef4444'} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: stats.netProfitLoss >= 0 ? '#10b981' : '#ef4444', marginTop: '0.5rem' }}>
                ₹{stats.netProfitLoss.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Cash Received minus Expenses Paid
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <span>Outstanding Balance</span>
                <Receipt size={20} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '0.5rem' }}>
                ₹{stats.outstandingDue.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Invoiced Revenue: ₹{stats.totalInvoicedRevenue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* OPERATIONAL COUNTERS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Online Requests</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706', marginTop: '0.25rem' }}>
                {stats.pendingBookingsCount}
              </div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Stays Booked</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                {stats.totalBookingsCount}
              </div>
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Occupied Rooms</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '0.25rem' }}>
                {stats.occupiedRoomsCount} / {stats.totalRoomsCount}
              </div>
            </div>
          </div>

          {/* TWO COLUMN RECENT TABLES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
            {/* Recent Payments */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent Payments Settled</h2>
              {stats.recentPayments.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No payment records found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.recentPayments.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>₹{Number(p.amount).toFixed(2)} via {p.payment_method?.toUpperCase()}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Bill #{p.bills?.invoice_number}</div>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(p.paid_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Bookings */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Latest Reservation Requests</h2>
              {stats.recentBookings.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No bookings found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.recentBookings.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{b.booking_number} — {b.customers?.full_name || b.guest_name || 'Guest'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{b.check_in} to {b.check_out} ({b.number_of_guests} guests)</div>
                      </div>
                      <div style={{ fontWeight: 600, color: b.booking_status === 'pending' ? '#d97706' : '#2563eb' }}>
                        {b.booking_status?.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
