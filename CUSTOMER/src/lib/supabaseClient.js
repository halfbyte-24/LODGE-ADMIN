import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

const supabaseUrl = env.VITE_SUPABASE_URL;
// Support both the new publishable key name and the legacy anon key name
const supabaseAnonKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project-id')
);

// Customer-safe Supabase client (using ONLY public anon key, never service_role)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local persistent storage keys for graceful offline/demo fallback
const STORAGE_KEYS = {
  BOOKINGS: 'amontron_customer_bookings',
  ENQUIRIES: 'amontron_customer_enquiries'
};

const getLocal = (key, fallback = []) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    }
    return fallback;
  } catch (e) {
    console.warn(`Error reading storage for ${key}:`, e);
    return fallback;
  }
};

const setLocal = (key, value) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`Error writing storage for ${key}:`, e);
  }
};

/**
 * Submit Customer Booking Request
 * Customer CANNOT control internal status or payment fields.
 * Sets status: 'pending', source: 'website'
 */
export async function submitBookingRequest(bookingData) {
  let customerId = null;

  if (isSupabaseConfigured && supabase) {
    // 1. Create Customer
    const guestPhone = (bookingData.guest_phone || bookingData.phone || '').trim();
    const guestName = (bookingData.guest_name || bookingData.name || '').trim();
    const guestEmail = (bookingData.guest_email || bookingData.email || '').trim();
    const guestCount = parseInt(bookingData.guests_count || bookingData.guests || bookingData.adults || 1, 10);

    customerId = crypto.randomUUID(); // Securely generate UUID

    if (guestName || guestPhone) {
      const { error: customerError } = await supabase
        .from('customers')
        .insert([{ 
          id: customerId, 
          full_name: guestName || 'Guest', 
          phone: guestPhone,
          email: guestEmail || null,
          customer_type: 'room_guest',
          number_of_guests: guestCount
        }]);
      
      if (customerError) {
        return { success: false, error: 'Customer creation failed: ' + customerError.message };
      }
    }

    // 2. Calculate nights
    let nights = Math.max(1, parseInt(bookingData.nights || 1, 10));
    if (bookingData.check_in && bookingData.check_out) {
      const d1 = new Date(bookingData.check_in);
      const d2 = new Date(bookingData.check_out);
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) nights = diffDays;
    }

    // Determine rooms to book (array of rooms or single room)
    const roomsToBook = Array.isArray(bookingData.rooms) && bookingData.rooms.length > 0
      ? bookingData.rooms
      : [{
          room_id: bookingData.room_uuid || bookingData.room_id || null,
          room_number: bookingData.room_number || '',
          room_rate: Number(bookingData.room_rate) || (nights > 0 ? Number(bookingData.total_price || 0) / nights : Number(bookingData.total_price || 0)),
          price_per_night: Number(bookingData.room_rate) || (nights > 0 ? Number(bookingData.total_price || 0) / nights : Number(bookingData.total_price || 0))
        }];

    // 3. Overlap check for all specified physical rooms
    const physicalRoomIds = roomsToBook.map(r => r.room_id || r.id).filter(Boolean);
    if (physicalRoomIds.length > 0) {
      const { data: conflicts, error: conflictErr } = await supabase
        .from('bookings')
        .select('id, room_id, check_in, check_out, booking_status')
        .in('room_id', physicalRoomIds)
        .not('booking_status', 'in', '("cancelled","checked_out")')
        .lt('check_in', bookingData.check_out)
        .gt('check_out', bookingData.check_in);

      if (conflictErr) {
        console.warn('Conflict check query error:', conflictErr);
      } else if (conflicts && conflicts.length > 0) {
        return { 
          success: false, 
          error: 'One or more of the selected rooms are already booked for the selected dates. Please choose different rooms.' 
        };
      }
    }

    // 4. Create Booking records
    const masterReference = 'AMN-' + Math.floor(10000 + Math.random() * 90000);
    const bookingRows = [];

    roomsToBook.forEach((roomItem, idx) => {
      const roomFkId = roomItem.room_id || roomItem.id || null;
      const roomRate = Number(roomItem.price_per_night || roomItem.price || roomItem.room_rate || 0);
      const roomTotal = roomRate * nights;
      const bkgNumber = roomsToBook.length > 1
        ? `${masterReference}-${idx + 1}`
        : 'req_' + Math.random().toString(36).substring(2, 9);

      bookingRows.push({
        booking_number: bkgNumber,
        customer_id: customerId,
        room_id: roomFkId,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        number_of_nights: nights,
        number_of_guests: Math.max(1, Math.ceil(guestCount / roomsToBook.length)),
        room_rate: roomRate,
        room_total: roomTotal,
        booking_status: 'pending',
        created_by: null
      });
    });

    const { data: insertedData, error: bookingErr } = await supabase
      .from('bookings')
      .insert(bookingRows)
      .select();

    if (bookingErr) {
      return { success: false, error: 'Booking insertion failed: ' + bookingErr.message };
    }

    return { 
      success: true, 
      data: insertedData && insertedData.length === 1 ? insertedData[0] : insertedData,
      reference_no: masterReference,
      source: 'supabase' 
    };
  }

  return { success: false, error: 'Supabase is not configured' };
}



/**
 * Submit Customer Contact / Enquiry Form
 * Also exported as sendContactMessage for component compatibility
 */
export async function submitCustomerEnquiry(enquiryData) {
  const sanitizedEnquiry = {
    id: 'enq_' + Math.random().toString(36).substring(2, 9),
    name: (enquiryData.name || '').trim(),
    phone: (enquiryData.phone || '').trim(),
    email: (enquiryData.email || '').trim(),
    message: (enquiryData.message || '').trim(),
    created_at: new Date().toISOString(),
    source: 'website'
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('enquiries')
      .insert([sanitizedEnquiry])
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Enquiry insertion failed: ' + error.message };
    }
    return { success: true, data, source: 'supabase' };
  }

  return { success: false, error: 'Supabase is not configured' };
}

// ---------------------------------------------------------------------------
// ALIASES & ADDITIONAL EXPORTS (for component compatibility)
// ---------------------------------------------------------------------------

/**
 * Alias for submitBookingRequest — used by BookingModal.jsx
 */
export const createBooking = submitBookingRequest;

/**
 * Alias for submitCustomerEnquiry — used by ContactSection.jsx, ExperienceSection.jsx
 */
export const sendContactMessage = submitCustomerEnquiry;

/**
 * Fetch bookings by optional email/reference query — used by ManageBookingsModal.jsx
 */
export async function getBookings(searchQuery = '') {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(
          `guest_email.ilike.%${searchQuery}%,reference_no.ilike.%${searchQuery}%,guest_name.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (!error && data) {
        return { success: true, data, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase getBookings error:', err);
    }
  }

  // Local fallback
  let bookings = getLocal(STORAGE_KEYS.BOOKINGS, []);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    bookings = bookings.filter(
      (b) =>
        (b.guest_email || '').toLowerCase().includes(q) ||
        (b.reference_no || '').toLowerCase().includes(q) ||
        (b.guest_name || '').toLowerCase().includes(q)
    );
  }
  return { success: true, data: bookings, source: 'local' };
}

/**
 * Cancel a booking by id — used by ManageBookingsModal.jsx
 */
export async function cancelBooking(bookingId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single();

      if (!error && data) {
        return { success: true, data, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase cancelBooking error:', err);
    }
  }

  // Local fallback
  const bookings = getLocal(STORAGE_KEYS.BOOKINGS, []);
  const updated = bookings.map((b) =>
    b.id === bookingId ? { ...b, status: 'cancelled' } : b
  );
  setLocal(STORAGE_KEYS.BOOKINGS, updated);
  return { success: true, source: 'local' };
}

/**
 * Newsletter subscription — used by Footer.jsx
 */
export async function subscribeNewsletter(email) {
  const entry = {
    id: 'nl_' + Math.random().toString(36).substring(2, 9),
    email: (email || '').trim().toLowerCase(),
    subscribed_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .insert([entry])
        .select()
        .single();

      if (!error && data) {
        return { success: true, data, source: 'supabase' };
      }
    } catch (err) {
      console.warn('Supabase newsletter error:', err);
    }
  }

  const current = getLocal('amontron_newsletter', []);
  setLocal('amontron_newsletter', [entry, ...current]);
  return { success: true, data: entry, source: 'local' };
}
