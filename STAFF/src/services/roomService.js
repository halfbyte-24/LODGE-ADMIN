import { supabase } from '../lib/supabase';

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const roomService = {
  async getRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number', { ascending: true });
      
    if (error) throw error;
    return data;
  },

  async getActiveBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, room_id, check_in, check_out, booking_status, booking_number')
      .in('booking_status', ['reserved', 'checked_in']);
    
    if (error) throw error;
    return data || [];
  },

  async bookRoom(bookingData) {
    if (!bookingData.roomId) throw new Error('A room must be selected.');
    if (!bookingData.checkIn || !bookingData.checkOut) throw new Error('Check-in and check-out dates are required.');

    // 1. Fetch room directly from database to preserve admin-only pricing and real configuration
    const { data: dbRoom, error: roomFetchErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', bookingData.roomId)
      .single();

    if (roomFetchErr) throw roomFetchErr;
    if (!dbRoom) throw new Error(`Room with ID ${bookingData.roomId} not found.`);

    if (dbRoom.status === 'maintenance') {
      throw new Error(`Room ${dbRoom.room_number} is currently under maintenance and cannot be booked.`);
    }

    // 2. Critical race-condition protection: re-check overlapping bookings for this room
    const { data: conflicts, error: conflictErr } = await supabase
      .from('bookings')
      .select('id, booking_number, check_in, check_out')
      .eq('room_id', bookingData.roomId)
      .in('booking_status', ['reserved', 'checked_in'])
      .lt('check_in', bookingData.checkOut)
      .gt('check_out', bookingData.checkIn);

    if (conflictErr) throw conflictErr;
    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0];
      throw new Error(
        `Room ${dbRoom.room_number} is already booked (${conflict.check_in} to ${conflict.check_out}, Booking #${conflict.booking_number}). Please select different dates or another room.`
      );
    }

    // 3. Compute accurate dates, nights, and DB-sourced pricing
    const startDate = new Date(bookingData.checkIn);
    const endDate = new Date(bookingData.checkOut);
    const calculatedNights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const actualRoomRate = Number(dbRoom.price_per_night);
    const actualRoomTotal = calculatedNights * actualRoomRate;

    // 4. Create booking
    const bookingNumber = 'BKG-' + Date.now().toString().slice(-6);
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        customer_id: bookingData.customerId,
        room_id: bookingData.roomId,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        number_of_nights: calculatedNights,
        number_of_guests: bookingData.guests || 1,
        room_rate: actualRoomRate,
        room_total: actualRoomTotal,
        booking_status: 'reserved',
        created_by: bookingData.staffId || null
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 5. Update room status: if check-in is today, mark occupied/reserved; otherwise keep available for today
    const todayStr = formatLocalDate(new Date());
    if (bookingData.checkIn <= todayStr) {
      await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', bookingData.roomId);
    }

    // 6. Automatically create or initialize Draft Bill for this booking
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: bookingData.customerId,
        booking_id: booking.id,
        staff_id: bookingData.staffId || null,
        bill_status: 'draft',
        payment_status: 'pending',
        subtotal: actualRoomTotal,
        total_amount: actualRoomTotal
      })
      .select()
      .single();

    if (billError) throw billError;

    // 7. Insert the room charge into bill items
    const { error: itemError } = await supabase
      .from('bill_items')
      .insert({
        bill_id: bill.id,
        item_type: 'room',
        reference_id: bookingData.roomId,
        item_name: `Room ${dbRoom.room_number} (${calculatedNights} Night${calculatedNights > 1 ? 's' : ''})`,
        quantity: 1,
        unit_price: actualRoomTotal,
        total_price: actualRoomTotal
      });

    if (itemError) throw itemError;

    return { booking, bill };
  }
};
