import { submitBookingRequest, createBooking, getBookings, cancelBooking } from '../lib/supabaseClient';

/**
 * Submit a room booking request.
 * Always sets status = 'pending' and source = 'website'.
 */
export async function submitRoomBooking(bookingData) {
  return submitBookingRequest(bookingData);
}

/**
 * Alias used by BookingModal
 */
export { createBooking };

/**
 * Fetch bookings by optional search query (email / reference / name)
 */
export async function fetchBookings(query = '') {
  return getBookings(query);
}

/**
 * Cancel a booking by ID
 */
export async function requestCancelBooking(bookingId) {
  return cancelBooking(bookingId);
}
