import { supabase } from '../lib/supabase';

export const roomService = {
  async getRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number', { ascending: true });
      
    if (error) throw error;
    return data;
  },

  async bookRoom(bookingData) {
    // 1. Create booking
    const bookingNumber = 'BKG-' + Date.now().toString().slice(-6);
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        customer_id: bookingData.customerId,
        room_id: bookingData.roomId,
        check_in: bookingData.checkIn,
        check_out: bookingData.checkOut,
        number_of_nights: bookingData.nights,
        number_of_guests: bookingData.guests,
        room_rate: bookingData.roomRate,
        room_total: bookingData.roomTotal,
        booking_status: 'reserved',
        created_by: bookingData.staffId
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 2. Update room status to occupied
    const { error: roomError } = await supabase
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', bookingData.roomId);

    if (roomError) throw roomError;

    // 3. Automatically create an initial Draft Bill for this booking
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: bookingData.customerId,
        booking_id: booking.id,
        staff_id: bookingData.staffId,
        bill_status: 'draft',
        payment_status: 'pending',
        subtotal: bookingData.roomTotal,
        total_amount: bookingData.roomTotal
      })
      .select()
      .single();

    if (billError) throw billError;

    // 4. Insert the room charge into the bill items
    const { error: itemError } = await supabase
      .from('bill_items')
      .insert({
        bill_id: bill.id,
        item_type: 'room',
        reference_id: bookingData.roomId,
        item_name: `Room ${bookingData.roomNumber} (${bookingData.nights} Nights)`,
        quantity: 1,
        unit_price: bookingData.roomTotal,
        total_price: bookingData.roomTotal
      });

    if (itemError) throw itemError;

    return { booking, bill };
  }
};
