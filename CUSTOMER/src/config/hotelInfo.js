// AMONTRON HOTEL & RESTAURANT - Official Business Configuration
// Single source of truth for hotel contact, location, and operational parameters

export const HOTEL_INFO = {
  name: "Amontron",
  fullName: "Amontron Hotel and Restaurant",
  tagline: "Comfort, hospitality and memorable moments",
  subTagline: "Experience refined hospitality, luxurious comfort, and authentic culinary excellence near Kamarpukur.",
  
  // Official Business Contact Details
  // Note: Owner phone number is official contact and separate from dynamic WhatsApp staff routing.
  phone: "+91 94334 24718",
  phoneDisplay: "+91 94334 24718",
  email: "amontronhotelandrestaurant@gmail.com",
  frontDeskEmail: "amontronhotelandrestaurant@gmail.com",

  // Location details — Customer-facing display near Kamarpukur
  address: {
    line1: "Near Kamarpukur",
    city: "Near Kamarpukur",
    locality: "Near Kamarpukur, West Bengal",
    display: "Near Kamarpukur, West Bengal",
    state: "West Bengal",
    pincode: "722161",
    country: "India",
    full: "Near Kamarpukur, West Bengal",
    // Official navigation & physical address (preserved for accurate navigation)
    physicalAddress: "WM55+6MH, Dasghara, West Bengal 722161"
  },
  
  // Coordinates & Maps links
  coordinates: {
    latitude: 22.9868,
    longitude: 87.9796,
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161",
    googleMapsEmbedUrl: "https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed"
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
