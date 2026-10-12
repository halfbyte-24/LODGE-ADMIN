import React from 'react';
import { 
  Snowflake,
  Wifi,
  Car,
  Zap,
  BellRing,
  Shield,
  Droplets,
  WashingMachine,
  ConciergeBell,
  ArrowRight,
  Check
} from 'lucide-react';
import './Wellness.css';

const FACILITY_GROUPS = [
  {
    id: 'stay',
    heading: 'Room Amenities',
    items: [
      { icon: Snowflake, label: 'Individual Split AC', desc: 'Whisper-quiet climate control in every room.' },
      { icon: Wifi, label: 'High-Speed Wi-Fi', desc: 'Complimentary broadband in all rooms & common areas.' },
      { icon: Droplets, label: '24/7 Hot Water', desc: 'Continuous hot water supply via electric geysers.' },
      { icon: Zap, label: 'Power Backup', desc: 'Uninterrupted electricity via full generator backup.' },
    ]
  },
  {
    id: 'service',
    heading: 'Guest Services',
    items: [
      { icon: BellRing, label: 'Round-the-Clock Room Service', desc: 'Order fresh meals any hour of the day or night.' },
      { icon: ConciergeBell, label: '24/7 Front Desk', desc: 'Courteous staff always available for assistance.' },
      { icon: WashingMachine, label: 'Laundry Service', desc: 'Same-day laundry and dry-cleaning on request.' },
      { icon: Shield, label: '24-Hour Security', desc: 'CCTV surveillance and in-house security team.' },
    ]
  },
  {
    id: 'property',
    heading: 'Property Facilities',
    items: [
      { icon: Car, label: 'Free Secure Parking', desc: 'Dedicated on-premises parking for all guests.' },
      { icon: ConciergeBell, label: 'Banquet & Conference', desc: 'Spacious halls for weddings, meetings, and events.' },
      { icon: BellRing, label: 'Travel Assistance', desc: 'Local sightseeing, transfers, and tour arrangements.' },
      { icon: Wifi, label: 'Business Support', desc: 'Printing, courier, and corporate stay packages.' },
    ]
  }
];

export default function WellnessSection({ onOpenBooking }) {
  return (
    <section id="facilities" className="wellness-section">
      <div className="section-wrapper">
        
        <div className="section-header">
          <span className="section-tag">SERVICES & FACILITIES</span>
          <h2 className="section-title">All-Inclusive Hotel Amenities</h2>
          <div className="gold-divider" />
          <p className="section-description">
            AMONTRON HOTEL &amp; RESTAURANT provides modern amenities and attentive services 
            to ensure a comfortable, safe, and fully equipped stay for every guest.
          </p>
        </div>

        {/* Facility Groups */}
        <div className="wellness-feature-grid">
          {FACILITY_GROUPS.map((group) => (
            <div key={group.id} className="wellness-highlight-card glass-card">
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{group.heading}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {group.items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <Icon size={18} className="text-gold" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.label}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.desc}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Box */}
        <div className="wellness-treatments-box glass-panel" style={{ marginTop: '2.5rem' }}>
          <div className="treatments-header">
            <div>
              <span className="badge-gold">BOOK YOUR STAY</span>
              <h3 className="treatments-title">Reserve a Room at AMONTRON</h3>
            </div>
            <button className="btn-primary" onClick={() => typeof onOpenBooking === 'function' && onOpenBooking()}>
              <ArrowRight size={15} />
              <span>Check Availability</span>
            </button>
          </div>

          <div className="treatments-list" style={{ paddingTop: '1rem' }}>
            {[
              { label: 'Check-In Time', value: '12:00 PM (Noon)' },
              { label: 'Check-Out Time', value: '11:00 AM' },
              { label: 'Cancellation Policy', value: 'Free cancellation 48 hours before check-in' },
              { label: 'Payment', value: 'Cash, UPI, Card — pay at property' },
            ].map((row, i) => (
              <div key={i} className="treatment-item">
                <div className="treatment-top">
                  <h4 className="treatment-name">{row.label}</h4>
                  <div className="treatment-dots" />
                  <div className="treatment-price-wrap">
                    <span className="t-price" style={{ fontSize: '0.9rem' }}>{row.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
