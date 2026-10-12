// ============================================================
// AMONTRON HOTEL & RESTAURANT — Site Data
// ============================================================

export const HOTEL_INFO = {
  name: "AMONTRON HOTEL & RESTAURANT",
  shortName: "AMONTRON",
  tagline: "Comfort. Hospitality. Convenience.",
  description:
    "Experience warm hospitality and modern comfort at AMONTRON HOTEL & RESTAURANT. Ideally located with thoughtfully designed rooms, excellent dining, and attentive service — we make every stay memorable.",
  address: "AMONTRON HOTEL & RESTAURANT, Main Road, City Center",
  city: "Your City",
  state: "State",
  pincode: "000000",
  phone: "+91 00000 00000",
  whatsapp: "+91 00000 00000",
  email: "info@amontronhotel.com",
  reservationsEmail: "reservations@amontronhotel.com",
  checkInTime: "12:00 PM",
  checkOutTime: "11:00 AM",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d80.0!3d22.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjLCsDA!5e0!3m2!1sen!2sin!4v1699999999999!5m2!1sen!2sin",
  socialMedia: {
    facebook: "#",
    instagram: "#",
    twitter: "#",
  },
};

// Backwards-compatible alias
export const RESORT_INFO = HOTEL_INFO;

// ============================================================
// HERO SLIDES
// ============================================================
export const HERO_SLIDES = [
  {
    id: 1,
    tag: "WELCOME TO AMONTRON",
    title: "Experience Comfort & Warm Hospitality",
    subtitle:
      "AMONTRON HOTEL & RESTAURANT offers modern amenities, delicious cuisine, and attentive service for an unforgettable stay.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85",
    ctaPrimary: "View Rooms",
    ctaSecondary: "Book Now",
  },
  {
    id: 2,
    tag: "COMFORTABLE ACCOMMODATION",
    title: "Rooms Designed for Rest & Relaxation",
    subtitle:
      "Each room at AMONTRON is thoughtfully furnished with modern amenities to ensure you feel at home during your stay.",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=2000&q=85",
    ctaPrimary: "Explore Rooms",
    ctaSecondary: "Reserve Now",
  },
  {
    id: 3,
    tag: "DINING EXPERIENCE",
    title: "Savour Exceptional Food & Beverages",
    subtitle:
      "Our restaurant serves a rich selection of cuisine prepared fresh daily — from hearty breakfasts to elegant dinners.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=85",
    ctaPrimary: "View Menu",
    ctaSecondary: "Book a Table",
  },
  {
    id: 4,
    tag: "EVENTS & CELEBRATIONS",
    title: "Perfect Venue for Every Occasion",
    subtitle:
      "From corporate meetings to family celebrations — AMONTRON provides the ideal setting and professional event services.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=2000&q=85",
    ctaPrimary: "Event Enquiry",
    ctaSecondary: "Contact Us",
  },
];

// ============================================================
// ROOMS & PHYSICAL INVENTORY (Imported from authoritative hotelData)
// ============================================================
export { ROOMS, ROOM_TYPES, ROOM_CATEGORIES, PHYSICAL_ROOMS } from './hotelData';

// ============================================================
// FACILITIES / SERVICE & AMENITIES
// ============================================================
export const FACILITIES = [
  {
    id: "ac-rooms",
    icon: "Snowflake",
    title: "AC Rooms",
    description: "All rooms equipped with individual air conditioning for your comfort.",
  },
  {
    id: "restaurant",
    icon: "UtensilsCrossed",
    title: "Restaurant",
    description: "Multi-cuisine restaurant serving breakfast, lunch, and dinner daily.",
  },
  {
    id: "wifi",
    icon: "Wifi",
    title: "Free Wi-Fi",
    description: "High-speed internet access available throughout the property.",
  },
  {
    id: "parking",
    icon: "ParkingCircle",
    title: "Free Parking",
    description: "Secure on-premises parking available for all guests.",
  },
  {
    id: "room-service",
    icon: "BellRing",
    title: "24/7 Room Service",
    description: "Round-the-clock room service for food, beverages and assistance.",
  },
  {
    id: "housekeeping",
    icon: "Sparkles",
    title: "Daily Housekeeping",
    description: "Professional housekeeping service every day for a clean room.",
  },
  {
    id: "hot-water",
    icon: "Droplets",
    title: "24/7 Hot Water",
    description: "Constant hot water supply available round the clock in all rooms.",
  },
  {
    id: "power-backup",
    icon: "Zap",
    title: "Power Backup",
    description: "Full power backup ensures uninterrupted electricity during your stay.",
  },
  {
    id: "laundry",
    icon: "WashingMachine",
    title: "Laundry Service",
    description: "Professional laundry and dry-cleaning service available on request.",
  },
  {
    id: "front-desk",
    icon: "ConciergeBell",
    title: "24/7 Front Desk",
    description: "Our reception team is available 24 hours to assist with all your needs.",
  },
  {
    id: "events",
    icon: "CalendarDays",
    title: "Event Facilities",
    description: "Well-equipped banquet and conference halls for meetings and events.",
  },
  {
    id: "travel-desk",
    icon: "MapPin",
    title: "Travel Desk",
    description: "Assistance with local sightseeing, transfers and tour arrangements.",
  },
];

// ============================================================
// DINING / RESTAURANT
// ============================================================
export const DINING_CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "breakfast", label: "Breakfast" },
  { id: "starters", label: "Starters" },
  { id: "main-course", label: "Main Course" },
  { id: "desserts", label: "Desserts" },
  { id: "beverages", label: "Beverages" },
];

export const MENU_ITEMS = [
  // Breakfast
  {
    id: "continental-breakfast",
    category: "breakfast",
    name: "Continental Breakfast",
    description: "Fresh juice, toast, butter, jam, eggs, and tea or coffee.",
    price: 350,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "full-indian-breakfast",
    category: "breakfast",
    name: "Full Indian Breakfast",
    description: "Paratha / idli / poha with dal, sabzi, pickle and chai.",
    price: 280,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80",
  },
  // Starters
  {
    id: "veg-spring-rolls",
    category: "starters",
    name: "Veg Spring Rolls",
    description: "Crispy fried rolls filled with seasoned vegetables served with dipping sauce.",
    price: 220,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "chicken-tikka",
    category: "starters",
    name: "Chicken Tikka",
    description: "Tender chicken marinated in spiced yoghurt, grilled in tandoor.",
    price: 380,
    isVeg: false,
    available: true,
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80",
  },
  // Main Course
  {
    id: "paneer-butter-masala",
    category: "main-course",
    name: "Paneer Butter Masala",
    description: "Cottage cheese cubes in rich creamy tomato-based gravy. Best paired with naan or rice.",
    price: 320,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "chicken-biryani",
    category: "main-course",
    name: "Chicken Biryani",
    description: "Aromatic basmati rice cooked with tender chicken, spices, and saffron. Served with raita.",
    price: 420,
    isVeg: false,
    available: true,
    image: "https://images.unsplash.com/photo-1563379091339-03246963d651?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "dal-tadka",
    category: "main-course",
    name: "Dal Tadka",
    description: "Yellow lentils tempered with cumin, garlic and spices. Comfort food at its best.",
    price: 240,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=600&q=80",
  },
  // Desserts
  {
    id: "gulab-jamun",
    category: "desserts",
    name: "Gulab Jamun",
    description: "Soft milk-solid dumplings soaked in rose-flavoured sugar syrup. Served warm.",
    price: 160,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "ice-cream",
    category: "desserts",
    name: "Ice Cream (2 Scoops)",
    description: "Choose from Vanilla, Chocolate, or Strawberry. Served with wafer.",
    price: 180,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80",
  },
  // Beverages
  {
    id: "masala-chai",
    category: "beverages",
    name: "Masala Chai",
    description: "Freshly brewed spiced Indian tea with ginger and cardamom.",
    price: 60,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "fresh-lime-soda",
    category: "beverages",
    name: "Fresh Lime Soda",
    description: "Refreshing fresh-squeezed lime with sparkling soda. Sweet or salted.",
    price: 80,
    isVeg: true,
    available: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
  },
];

// Backwards-compat alias
export const DINING_VENUES = [];
export const EXPERIENCES = [];

// ============================================================
// EVENTS & OFFERS
// ============================================================
export const EVENTS_OFFERS = [
  {
    id: "weekend-special",
    type: "offer",
    title: "Weekend Special Package",
    description:
      "Book any Deluxe room for the weekend and get complimentary breakfast for two, free parking, and late checkout until 2 PM.",
    validUntil: "2026-12-31",
    tag: "OFFER",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c4eacf6b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "corporate-package",
    type: "offer",
    title: "Corporate Stay Package",
    description:
      "Special rates for corporate bookings of 3 nights or more. Includes meeting room access, Wi-Fi, and airport transfers on request.",
    validUntil: "2026-12-31",
    tag: "CORPORATE",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "wedding-event",
    type: "event",
    title: "Wedding & Reception Venue",
    description:
      "AMONTRON offers a beautiful banquet hall for weddings, receptions, and social gatherings. Contact our events team for custom packages and availability.",
    tag: "EVENT",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "conference-facility",
    type: "event",
    title: "Conference & Business Events",
    description:
      "Host your next corporate conference, team meeting, or product launch at AMONTRON. Equipped hall with AV setup, projector, and catering support.",
    tag: "CONFERENCE",
    image:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
  },
];

// ============================================================
// GALLERY
// ============================================================
export const GALLERY_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "rooms", label: "Rooms" },
  { id: "restaurant", label: "Restaurant" },
  { id: "facilities", label: "Facilities" },
  { id: "events", label: "Events" },
];

export const GALLERY_IMAGES = [
  {
    id: "g1",
    category: "rooms",
    src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
    alt: "Standard AC Room at AMONTRON",
    caption: "Standard AC Room",
  },
  {
    id: "g2",
    category: "rooms",
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    alt: "Deluxe Room at AMONTRON",
    caption: "Deluxe AC Room",
  },
  {
    id: "g3",
    category: "rooms",
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    alt: "Executive Suite at AMONTRON",
    caption: "Executive Suite",
  },
  {
    id: "g4",
    category: "restaurant",
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    alt: "Restaurant at AMONTRON",
    caption: "AMONTRON Restaurant",
  },
  {
    id: "g5",
    category: "restaurant",
    src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
    alt: "Dining at AMONTRON",
    caption: "Fresh Indian Cuisine",
  },
  {
    id: "g6",
    category: "facilities",
    src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    alt: "Conference room at AMONTRON",
    caption: "Conference Facilities",
  },
  {
    id: "g7",
    category: "facilities",
    src: "https://images.unsplash.com/photo-1551882547-ff40c4eacf6b?auto=format&fit=crop&w=800&q=80",
    alt: "Hotel lobby at AMONTRON",
    caption: "Hotel Lobby",
  },
  {
    id: "g8",
    category: "events",
    src: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",
    alt: "Wedding event at AMONTRON",
    caption: "Wedding & Reception",
  },
  {
    id: "g9",
    category: "events",
    src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    alt: "Corporate event at AMONTRON",
    caption: "Corporate Conference",
  },
  {
    id: "g10",
    category: "rooms",
    src: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    alt: "Twin room at AMONTRON",
    caption: "Deluxe Twin Room",
  },
  {
    id: "g11",
    category: "restaurant",
    src: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=80",
    alt: "Breakfast at AMONTRON restaurant",
    caption: "Continental Breakfast",
  },
  {
    id: "g12",
    category: "facilities",
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    alt: "Hotel exterior AMONTRON",
    caption: "Hotel Exterior",
  },
];

// ============================================================
// REVIEWS / TESTIMONIALS
// ============================================================
export const REVIEWS = [
  {
    id: "r1",
    name: "Rajesh Sharma",
    location: "Mumbai",
    rating: 5,
    text: "Excellent stay at AMONTRON! The rooms were clean and comfortable, the food was delicious, and the staff were very helpful. Will definitely stay again.",
    date: "September 2026",
  },
  {
    id: "r2",
    name: "Priya Mehta",
    location: "Delhi",
    rating: 5,
    text: "Great value for money. The hotel is well-maintained, conveniently located, and the restaurant serves really good food. Highly recommended.",
    date: "August 2026",
  },
  {
    id: "r3",
    name: "Suresh Kumar",
    location: "Bangalore",
    rating: 4,
    text: "We hosted our company's annual conference at AMONTRON. The event facilities were excellent and the catering was superb. Our team loved the experience.",
    date: "October 2026",
  },
  {
    id: "r4",
    name: "Anita Verma",
    location: "Kolkata",
    rating: 5,
    text: "Beautiful hotel with warm hospitality. The Executive Suite was spacious and comfortable. The breakfast was fresh and filling. A truly memorable stay.",
    date: "July 2026",
  },
];

// ============================================================
// FAQS
// ============================================================
export const FAQS = [
  {
    q: "What are the check-in and check-out timings?",
    a: "Check-in is at 12:00 PM noon and check-out is at 11:00 AM. Early check-in and late check-out can be arranged subject to availability.",
  },
  {
    q: "Is breakfast included in the room rate?",
    a: "Complimentary breakfast is included with Deluxe AC Rooms and Executive Suites. Standard rooms do not include breakfast by default but it can be added.",
  },
  {
    q: "Is there free parking available?",
    a: "Yes, AMONTRON provides secure free parking for all registered guests.",
  },
  {
    q: "Do you accommodate large groups or events?",
    a: "Yes. We have banquet halls and conference rooms suitable for weddings, corporate meetings, and social events. Please contact us for group booking enquiries.",
  },
  {
    q: "How do I make a reservation?",
    a: "You can book directly through our website's online reservation form, or call / WhatsApp us directly. Our team will confirm your booking within a few hours.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Cancellations made more than 48 hours prior to check-in are fully refunded. Cancellations within 48 hours may be subject to a one-night charge. Please contact us for specific situations.",
  },
];

// ============================================================
// VIP ENHANCEMENTS (kept for BookingModal compatibility)
// ============================================================
export const VIP_ENHANCEMENTS = [
  { id: "early-checkin", name: "Early Check-In (10 AM)", price: 500 },
  { id: "late-checkout", name: "Late Check-Out (2 PM)", price: 500 },
  { id: "airport-transfer", name: "Airport / Station Transfer", price: 800 },
  { id: "bouquet", name: "Welcome Bouquet & Sweets", price: 600 },
  { id: "birthday-decoration", name: "Room Birthday Decoration", price: 1200 },
];
