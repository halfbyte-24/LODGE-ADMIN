import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome back, {profile?.full_name}</p>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="card-title">Business Analytics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px' }}>
            <div style={{ color: '#3b82f6', fontSize: '0.875rem' }}>Total Sales (Today)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹0.00</div>
          </div>
          <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '8px' }}>
            <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>Total Expenses (Today)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹0.00</div>
          </div>
          <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ color: '#22c55e', fontSize: '0.875rem' }}>Net Revenue (Today)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹0.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
