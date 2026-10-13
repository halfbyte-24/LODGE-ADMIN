import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      
      // Enforce strict staff role for STAFF panel
      if (!data.profile) {
        throw new Error('Profile configuration error: Your account is missing a profile. Please contact the administrator.');
      }
      
      if (data.profile.is_active === false) {
        throw new Error('Your staff account is currently inactive. Please contact the administrator.');
      }

      if (data.profile.role !== 'staff') {
        throw new Error('Access denied: Staff credentials required. Admin accounts cannot log into the Staff panel.');
      }

      navigate('/staff/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', padding: '1rem 0.75rem' }}>
      <div style={{ background: 'white', padding: '2rem 1.25rem', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.1)', width: '100%', maxWidth: '400px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary-color)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-main)', fontSize: '1.35rem', fontWeight: 800 }}>
            Amontron Hotel and Restaurant
          </h2>
          <div style={{ display: 'inline-block', background: '#eff6ff', color: 'var(--primary-color)', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Staff Login Portal
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1.25rem' }}>
            <label className="input-label" style={{ fontWeight: 600 }}>Staff Email Address</label>
            <input 
              type="email" 
              className="input" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@hotel.com"
              style={{ padding: '0.75rem', fontSize: '0.95rem' }}
            />
          </div>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label" style={{ fontWeight: 600 }}>Password</label>
            <input 
              type="password" 
              className="input" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ padding: '0.75rem', fontSize: '0.95rem' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700, borderRadius: '8px' }} 
            disabled={loading}
          >
            {loading ? 'Verifying Staff Access...' : 'Login to Staff Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
