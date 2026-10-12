// AMONTRON HOTEL & RESTAURANT - Configuration
// Single source of truth for hotel contact, location, and operational parameters

export const HOTEL_INFO = {
  name: "AMONTRON",
  fullName: "AMONTRON HOTEL & RESTAURANT",
  tagline: "Comfort, hospitality and memorable moments",
  subTagline: "Experience refined hospitality, luxurious comfort, and authentic culinary excellence.",
  
  // Contact details
  phone: "+91 98765 43210",
  phoneDisplay: "+91 98765 43210",
  whatsapp: "+919876543210",
  whatsappDisplay: "+91 98765 43210",
  email: "reservations@amontronhotel.com",
  frontDeskEmail: "info@amontronhotel.com",

  // Location details
  address: {
    line1: "Station Road, Near Central Plaza",
    city: "Midnapore",
    state: "West Bengal",
    pincode: "721101",
    country: "India",
    full: "Station Road, Near Central Plaza, Midnapore, West Bengal 721101, India"
  },
  
  // Coordinates for maps & directions
  coordinates: {
    latitude: 22.4257,
    longitude: 87.3199,
    googleMapsUrl: "https://maps.google.com/?q=22.4257,87.3199"
  },

  // Operational Timings
  timings: {
    checkIn: "12:00 PM (Noon)",
    checkOut: "11:00 AM",
    frontDesk: "24 Hours / 7 Days",
    roomService: "06:00 AM – 11:30 PM",
    restaurantBreakfast: "07:30 AM – 10:30 AM",
    restaurantLunch: "12:30 PM – 03:30 PM",
    restaurantDinner: "07:30 PM – 11:00 PM"
  },

  // Social Links
  socialLinks: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    tripadvisor: "https://tripadvisor.com"
  }
};
