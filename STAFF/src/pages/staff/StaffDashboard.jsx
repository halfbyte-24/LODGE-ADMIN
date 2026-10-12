import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { Users, BedDouble, Receipt, DollarSign, Activity } from 'lucide-react';

export default function StaffDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await dashboardService.getStaffDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Staff Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {profile?.full_name}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard icon={<Users size={24}/>} title="Today's Customers" value={stats.totalCustomers} sub={<span>{stats.restaurantOnly} Restaurant Walk-ins</span>} color="#3b82f6" />
        <StatCard icon={<BedDouble size={24}/>} title="Room Occupancy" value={`${stats.totalRooms - stats.availableRooms} / ${stats.totalRooms} Rooms`} sub={<span style={{color: '#10b981', fontWeight: 600}}>{stats.availableRooms} Rooms Available</span>} color="#8b5cf6" />
        <StatCard icon={<Receipt size={24}/>} title="Today's Bills" value={stats.totalBills} color="#f59e0b" />
        <StatCard icon={<DollarSign size={24}/>} title="Today's Sales" value={`₹${stats.totalSales.toFixed(2)}`} sub={<span style={{color: '#ef4444'}}>{stats.pendingPayments} Pending Payments</span>} color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
