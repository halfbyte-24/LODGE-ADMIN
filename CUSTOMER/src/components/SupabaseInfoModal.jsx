import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Code,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import './SupabaseInfoModal.css';

export default function SupabaseInfoModal({ isOpen, onClose }) {

  const [copied, setCopied] = useState(false);

  const sampleEnv = `# In root directory create .env file:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-api-key`;

  const copyEnv = () => {
    navigator.clipboard.writeText(sampleEnv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content supabase-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="supabase-modal-header">
          <div className="supa-badge-status">
            <Database size={16} className={isSupabaseConfigured ? 'text-success' : 'text-gold'} />
            <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Demo LocalStorage Mode Active'}</span>
          </div>
          <h2 className="supa-title">Supabase Database Integration</h2>
          <p className="supa-desc">
            AMONTRON HOTEL & RESTAURANT is built with full Supabase integration ready for production. 
            Currently operating in {isSupabaseConfigured ? 'LIVE Supabase cloud mode' : 'fault-tolerant local demonstration mode with persistent browser storage'}.
          </p>
        </div>

        <div className="supabase-modal-body">
          
          {/* Status Box */}
          <div className={`supa-status-box ${isSupabaseConfigured ? 'status-connected' : 'status-local'}`}>
            <div className="status-indicator-icon">
              {isSupabaseConfigured ? (
                <CheckCircle2 size={24} className="text-success" />
              ) : (
                <ShieldCheck size={24} className="text-gold" />
              )}
            </div>
            <div>
              <strong>{isSupabaseConfigured ? 'Connected to Cloud PostgreSQL' : 'Local Persistence Active (Ready for Supabase)'}</strong>
              <p>
                {isSupabaseConfigured
                  ? 'All room bookings, table reservations, and messages are synchronizing in real time to your Supabase tables.'
                  : 'All booking operations, table reservations, and guest portal searches work out of the box with zero configuration! To connect your real cloud database, follow the two steps below.'}
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="supa-steps-list">
            <h4>How to Connect Your Own Supabase Project:</h4>
            
            <div className="supa-step-item">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>Create `.env` file in the project root:</strong>
                <p>Add your project URL and public Anon key:</p>
                <div className="code-snippet-box">
                  <pre>{sampleEnv}</pre>
                  <button className="copy-btn" onClick={copyEnv}>
                    <Copy size={13} />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="supa-step-item">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Execute `supabase-schema.sql` in your SQL Editor:</strong>
                <p>
                  A complete database schema script has already been generated at 
                  <code>supabase-schema.sql</code> in the project directory. 
                  It creates the <code>bookings</code>, <code>dining_reservations</code>, <code>messages</code>, 
                  and <code>newsletter</code> tables with Row Level Security (RLS) policies.
                </p>
              </div>
            </div>
          </div>

          {/* Tables Summary */}
          <div className="supa-tables-grid">
            <div className="table-chip">
              <Code size={13} className="text-gold" />
              <span>bookings (Room reservations & VIP add-ons)</span>
            </div>
            <div className="table-chip">
              <Code size={13} className="text-gold" />
              <span>dining_reservations (Restaurant tables)</span>
            </div>
            <div className="table-chip">
              <Code size={13} className="text-gold" />
              <span>messages (Concierge inquiries)</span>
            </div>
            <div className="table-chip">
              <Code size={13} className="text-gold" />
              <span>newsletter (Subscriber emails)</span>
            </div>
          </div>

          <div className="modal-action-footer mt-4">
            <button className="btn-primary w-100" onClick={onClose}>
              Got It
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
