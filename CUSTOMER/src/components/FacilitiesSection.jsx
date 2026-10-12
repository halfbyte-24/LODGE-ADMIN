import React from 'react';
import { BedDouble, Wifi, Droplets, Clock, Sparkles, Utensils, Car, HeartHandshake } from 'lucide-react';
import './FacilitiesSection.css';

const HOTEL_FACILITIES = [
  { id: 'rooms', name: 'Comfortable Rooms', description: 'Air-conditioned rooms with plush bedding and traditional warmth.', icon: BedDouble },
  { id: 'wifi', name: 'Free Wi-Fi', description: 'High-speed wireless connectivity throughout the property.', icon: Wifi },
  { id: 'water', name: '24 Hour Hot Water', description: 'Uninterrupted geyser hot and cold water in all bathrooms.', icon: Droplets },
  { id: 'room-service', name: 'Room Service', description: 'Prompt food and beverage delivery to your doorstep.', icon: Clock },
  { id: 'housekeeping', name: 'Housekeeping', description: 'Daily sanitization and fresh linens for a spotless stay.', icon: Sparkles },
  { id: 'restaurant', name: 'Restaurant', description: 'In-house multi-cuisine dining serving authentic Bengali dishes.', icon: Utensils },
  { id: 'parking', name: 'Parking', description: 'Secure on-premise parking for your vehicles.', icon: Car },
  { id: 'hospitality', name: 'Warm Hospitality', description: 'Attentive and cordial Bengali guest care 24/7.', icon: HeartHandshake }
];

export default function FacilitiesSection() {
  return (
    <section className="bengali-facilities-section" id="facilities">
      <div className="section-wrapper">
        
        <div className="facilities-header">
          <span className="section-eyebrow">OUR FACILITIES</span>
          <h2 className="section-title">Comfort & Convenience</h2>
          <div className="section-title-line" />
          <p className="facilities-description">
            Thoughtfully planned services ensuring every comfort during your stay. We blend 
            modern amenities with our traditional warmth.
          </p>
        </div>

        <div className="facilities-grid">
          {HOTEL_FACILITIES.map((facility) => {
            const Icon = facility.icon;
            return (
              <div key={facility.id} className="bengali-facility-card">
                <div className="facility-icon">
                  <Icon size={28} />
                </div>
                <h3 className="facility-name">{facility.name}</h3>
                <p className="facility-desc">{facility.description}</p>
              </div>
            );
          })}
        </div>

        {/* Decorative elements */}
        <div className="facilities-decoration">
          <img 
            src="/images/art4.jpg" 
            alt="Folk art dancer" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

      </div>
    </section>
  );
}
