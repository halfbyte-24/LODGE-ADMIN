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
    line1: "Near Kamarpukur Ramakrishna Math",
    city: "Kamarpukur",
    state: "West Bengal",
    pincode: "712612",
    country: "India",
    full: "Near Kamarpukur Ramakrishna Math, Kamarpukur, West Bengal 712612, India"
  },
  
  // Coordinates for maps & directions (Kamarpukur: ~22.8988, 87.6534)
  coordinates: {
    latitude: 22.8988,
    longitude: 87.6534,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kamarpukur,+West+Bengal,+India"
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
