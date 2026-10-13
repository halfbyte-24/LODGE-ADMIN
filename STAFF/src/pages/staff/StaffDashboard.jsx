import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { Users, BedDouble, Receipt, DollarSign, Activity, AlertCircle } from 'lucide-react';

const defaultStats = {
  totalCustomers: 0,
  roomGuests: 0,
  totalRooms: 0,
  availableRooms: 0,
  restaurantOnly: 0,
  totalBills: 0,
  totalSales: 0,
  pendingPayments: 0,
  revenue: { room: 0, food: 0, drink: 0, service: 0 },
  recentActivity: []
};

export default function StaffDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        setErrorMsg('');
        const data = await dashboardService.getStaffDashboardStats();
        if (data) {
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
        setErrorMsg('Could not fetch live dashboard metrics. Showing fallback data.');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {errorMsg && (
        <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Staff Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Welcome back, {profile?.full_name || 'Staff'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/staff/new-customer" className="btn btn-primary" style={{ minHeight: '40px', textDecoration: 'none' }}>
            + New Customer
          </Link>
          <Link to="/staff/billing" className="btn btn-outline" style={{ minHeight: '40px', textDecoration: 'none' }}>
            Open Billing
          </Link>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon={<Users size={24}/>} title="Today's Customers" value={stats.totalCustomers} sub={<span>{stats.restaurantOnly} Restaurant Walk-ins</span>} color="#3b82f6" />
        <StatCard icon={<BedDouble size={24}/>} title="Room Occupancy" value={`${stats.totalRooms - stats.availableRooms} / ${stats.totalRooms} Rooms`} sub={<span style={{color: '#10b981', fontWeight: 600}}>{stats.availableRooms} Rooms Available</span>} color="#8b5cf6" />
        <StatCard icon={<Receipt size={24}/>} title="Today's Bills" value={stats.totalBills} color="#f59e0b" />
        <StatCard icon={<DollarSign size={24}/>} title="Today's Sales" value={`₹${Number(stats.totalSales || 0).toFixed(2)}`} sub={<span style={{color: '#ef4444'}}>{stats.pendingPayments} Pending Payments</span>} color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} style={{ color: 'var(--text-muted)' }}/> Revenue Split
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <RevenueRow label="Room Revenue" amount={stats.revenue.room} color="#8b5cf6" />
            <RevenueRow label="Food Revenue" amount={stats.revenue.food} color="#f97316" />
            <RevenueRow label="Drink Revenue" amount={stats.revenue.drink} color="#3b82f6" />
            <RevenueRow label="Service Revenue" amount={stats.revenue.service} color="#14b8a6" />
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} style={{ color: 'var(--text-muted)' }}/> Recent Activity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recentActivity.length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>No recent activity.</div>
            ) : (
              stats.recentActivity.map((act, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 500 }}>{act.text}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, sub, color }) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
      <div style={{ background: `${color}20`, color: color, padding: '1rem', borderRadius: '12px' }}>
        {icon}
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function RevenueRow({ label, amount, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color }}></div>
        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{label}</span>
      </div>
      <span style={{ fontWeight: 600 }}>₹{amount.toFixed(2)}</span>
    </div>
  );
}
