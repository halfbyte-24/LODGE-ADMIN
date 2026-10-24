// AMONTRON HOTEL & RESTAURANT - Dynamic Live Hotel Settings Service
// Single source of truth connecting customer-facing components to Supabase hotel_settings

import { supabase } from '../lib/supabaseClient';

export const DEFAULT_HOTEL_SETTINGS = {
  hotel_name: 'Amontron Hotel and Restaurant',
  fullName: 'Amontron Hotel and Restaurant',
  shortName: 'Amontron',
  phone: '+91 94334 24718',
  phoneDisplay: '+91 94334 24718',
  email: 'amontronhotelandrestaurant@gmail.com',
  address: 'WM55+6MH, Dasghara',
  city: 'Dasghara',
  state: 'West Bengal',
  pin_code: '722161',
  pincode: '722161',
  country: 'India',
  display_locality: 'Near Kamarpukur, West Bengal',
  landmark_1: 'Near Kamarpukur Ramakrishna Math and Mission',
  landmark_2: 'Near Kamarpukur Railway Station',
  travel_time_description: 'Conveniently located near Kamarpukur’s key landmarks.',
  google_maps_url: 'https://www.google.com/maps/search/?api=1&query=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161',
  google_maps_embed_url: 'https://maps.google.com/maps?q=WM55%2B6MH%2C+Dasghara%2C+West+Bengal+722161&hl=en&z=15&output=embed',
  description: 'Experience refined hospitality, luxurious comfort, and authentic culinary excellence near Kamarpukur.',
  tagline: 'Comfort, hospitality and memorable moments',
  timings: {
    checkIn: '12:00 PM (Noon)',
    checkOut: '11:00 AM',
    frontDesk: '24 Hours / 7 Days',
    roomService: '06:00 AM – 11:30 PM',
    restaurantBreakfast: '07:30 AM – 10:30 AM',
    restaurantLunch: '12:30 PM – 03:30 PM',
    restaurantDinner: '07:30 PM – 11:00 PM'
  }
};

let cachedSettings = null;
const listeners = new Set();

function normalizeSettings(dbRow) {
  if (!dbRow) return { ...DEFAULT_HOTEL_SETTINGS };

  const loc = dbRow.whatsapp_routing?.location || {};
  const routingTimings = dbRow.whatsapp_routing?.timings || {};

  const check_in_time = dbRow.check_in_time || routingTimings.check_in_time || DEFAULT_HOTEL_SETTINGS.timings.checkIn;
  const check_out_time = dbRow.check_out_time || routingTimings.check_out_time || DEFAULT_HOTEL_SETTINGS.timings.checkOut;

  const display_locality = dbRow.display_locality || loc.display_locality || DEFAULT_HOTEL_SETTINGS.display_locality;
  const landmark_1 = dbRow.landmark_1 || loc.landmark_1 || DEFAULT_HOTEL_SETTINGS.landmark_1;
  const landmark_2 = dbRow.landmark_2 !== undefined ? (dbRow.landmark_2 || '') : (loc.landmark_2 !== undefined ? loc.landmark_2 : DEFAULT_HOTEL_SETTINGS.landmark_2);
  const travel_time_description = dbRow.travel_time_description !== undefined ? (dbRow.travel_time_description || '') : (loc.travel_time_description !== undefined ? loc.travel_time_description : DEFAULT_HOTEL_SETTINGS.travel_time_description);
  const google_maps_embed_url = dbRow.google_maps_embed_url || loc.google_maps_embed_url || DEFAULT_HOTEL_SETTINGS.google_maps_embed_url;
  const google_maps_url = dbRow.google_maps_url || DEFAULT_HOTEL_SETTINGS.google_maps_url;
  const phone = dbRow.phone || DEFAULT_HOTEL_SETTINGS.phone;
  const email = dbRow.email || DEFAULT_HOTEL_SETTINGS.email;
  const hotel_name = dbRow.hotel_name || DEFAULT_HOTEL_SETTINGS.hotel_name;
  const address = dbRow.address || DEFAULT_HOTEL_SETTINGS.address;
  const city = dbRow.city || DEFAULT_HOTEL_SETTINGS.city;
  const state = dbRow.state || DEFAULT_HOTEL_SETTINGS.state;
  const pin_code = dbRow.pin_code || DEFAULT_HOTEL_SETTINGS.pin_code;
  const description = dbRow.description || DEFAULT_HOTEL_SETTINGS.description;

  return {
    ...DEFAULT_HOTEL_SETTINGS,
    id: dbRow.id,
    hotel_name,
    fullName: hotel_name,
    shortName: 'Amontron',
    phone,
    phoneDisplay: phone,
    email,
    address,
    city,
    state,
    pin_code,
    pincode: pin_code,
    display_locality,
    landmark_1,
    landmark_2,
    travel_time_description,
    google_maps_url,
    google_maps_embed_url,
    description,
    check_in_time,
    check_out_time,
    checkInTime: check_in_time,
    checkOutTime: check_out_time,
    timings: {
      ...DEFAULT_HOTEL_SETTINGS.timings,
      ...routingTimings,
      checkIn: check_in_time,
      checkOut: check_out_time
    },
    coordinates: {
      latitude: 22.9868,
      longitude: 87.9796,
      googleMapsUrl: google_maps_url,
      googleMapsEmbedUrl: google_maps_embed_url
    }
  };
}

export const hotelSettingsService = {
  /**
   * Fetch current live settings from Supabase
   */
  async getSettings(forceRefresh = false) {
    if (cachedSettings && !forceRefresh) {
      return cachedSettings;
    }

    try {
      const { data, error } = await supabase
        .from('hotel_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('[hotelSettingsService] Error reading hotel_settings:', error.message);
        if (!cachedSettings) cachedSettings = { ...DEFAULT_HOTEL_SETTINGS };
        return cachedSettings;
      }

      cachedSettings = normalizeSettings(data && data.length > 0 ? data[0] : null);
      this._notify();
      return cachedSettings;
    } catch (err) {
      console.warn('[hotelSettingsService] Failed to load settings:', err);
      if (!cachedSettings) cachedSettings = { ...DEFAULT_HOTEL_SETTINGS };
      return cachedSettings;
    }
  },

  /**
   * Subscribe to live real-time updates when Admin updates Hotel Settings
   */
  subscribe(callback) {
    listeners.add(callback);
    // Initial emission if cached
    if (cachedSettings) {
      callback(cachedSettings);
    } else {
      this.getSettings().then(callback);
    }

    return () => {
      listeners.delete(callback);
    };
  },

  _notify() {
    for (const cb of listeners) {
      try {
        cb(cachedSettings);
      } catch (e) {
        console.error('[hotelSettingsService] Listener error:', e);
      }
    }
  }
};

// Setup Supabase Realtime channel for instant live synchronization
try {
  supabase
    .channel('public:hotel_settings_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hotel_settings' }, async (payload) => {
      console.log('[hotelSettingsService] Realtime update detected on hotel_settings:', payload);
      await hotelSettingsService.getSettings(true);
    })
    .subscribe();
} catch (e) {
  console.warn('[hotelSettingsService] Realtime subscription failed:', e);
}
