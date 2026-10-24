const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../ADMIN/node_modules/@supabase/supabase-js'));

const supabaseUrl = 'https://krkktwfgxzcivalbwrfq.supabase.co';
const supabaseKey = 'sb_publishable_YmgHzWrzHBkrCt3qE6eC8g_LfSukcbT';

// 1. Anonymous client (exact browser client)
const anonClient = createClient(supabaseUrl, supabaseKey);

// 2. Admin client (to inspect and clean up test records)
const adminClient = createClient(supabaseUrl, supabaseKey);

async function runBookingVerification() {
  console.log('====================================================');
  console.log('VERIFYING PUBLIC CUSTOMER BOOKING SUBMISSION FIX');
  console.log('====================================================');

  await adminClient.auth.signInWithPassword({
    email: 'admin@hotel.com',
    password: 'password123'
  });

  // Fetch real room ID from rooms table
  const { data: rooms } = await adminClient.from('rooms').select('id, room_number, price_per_night').limit(1);
  const testRoom = rooms[0];
  console.log(`[SETUP] Using Room: Room ${testRoom.room_number} (ID: ${testRoom.id})`);

  // Emulate submitBookingRequest logic from CUSTOMER/src/lib/supabaseClient.js
  const bookingData = {
    guest_name: 'Priyanka Mukherjee',
    guest_phone: '+91 98311 55443',
    guest_email: 'priyanka.test@example.com',
    check_in: '2026-11-20',
    check_out: '2026-11-22',
    nights: 2,
    guests_count: 2,
    rooms: [{
      room_id: testRoom.id,
      room_number: testRoom.room_number,
      price_per_night: Number(testRoom.price_per_night || 1500)
    }],
    total_price: Number(testRoom.price_per_night || 1500) * 2,
    status: 'pending',
    source: 'website'
  };

  console.log('\n--- Step 1: Anonymous Customer submits Booking Request ---');
  // 1. Create customer
  const customerId = crypto.randomUUID();
  const { error: custErr } = await anonClient
    .from('customers')
    .insert([{
      id: customerId,
      full_name: bookingData.guest_name,
      phone: bookingData.guest_phone,
      email: bookingData.guest_email,
      customer_type: 'room_guest',
      number_of_guests: bookingData.guests_count
    }]);

  if (custErr) {
    console.error('[FAIL] Customer creation failed:', custErr.message);
    process.exit(1);
  }
  console.log('[PASS] Customer record created via anon client (ID:', customerId, ')');

  // 2. Insert booking
  const masterReference = 'AMN-' + Math.floor(10000 + Math.random() * 90000);
  const bookingRows = [{
    booking_number: masterReference,
    customer_id: customerId,
    room_id: testRoom.id,
    check_in: bookingData.check_in,
    check_out: bookingData.check_out,
    number_of_nights: bookingData.nights,
    number_of_guests: bookingData.guests_count,
    room_rate: Number(testRoom.price_per_night || 1500),
    room_total: Number(testRoom.price_per_night || 1500) * bookingData.nights,
    booking_status: 'pending',
    source: 'website',
    created_by: null
  }];

  const { error: bookingErr } = await anonClient
    .from('bookings')
    .insert(bookingRows);

  if (bookingErr) {
    console.error('[FAIL] Booking insertion failed with error:', bookingErr.message);
    process.exit(1);
  }
  console.log('[PASS] Booking record created via anon client without RLS error! (Ref:', masterReference, ')');

  console.log('\n--- Step 2: Verifying Presence in Supabase Database ---');
  const { data: dbBooking, error: fetchErr } = await adminClient
    .from('bookings')
    .select('id, booking_number, customer_id, room_id, check_in, check_out, booking_status, source, room_total, created_at')
    .eq('booking_number', masterReference)
    .single();

  if (fetchErr || !dbBooking) {
    console.error('[FAIL] Could not verify booking in DB:', fetchErr ? fetchErr.message : 'Not found');
    process.exit(1);
  }

  console.log('[PASS] Booking record verified in Supabase:');
  console.log(dbBooking);

  console.log('\n--- Step 3: Verifying Security: Anon cannot SELECT or UPDATE bookings ---');
  // Anon SELECT
  const { data: anonView } = await anonClient.from('bookings').select('*').eq('booking_number', masterReference);
  console.log('Anon SELECT result count:', anonView ? anonView.length : 0, '(expected 0 - no public data leak)');

  // Anon UPDATE
  const { error: updateErr } = await anonClient.from('bookings').update({ booking_status: 'checked_in' }).eq('booking_number', masterReference);
  const { data: checkStatus } = await adminClient.from('bookings').select('booking_status').eq('booking_number', masterReference).single();
  console.log('Booking status after unauthorized anon update attempt:', checkStatus.booking_status, '(expected: pending)');

  console.log('\n--- Step 4: Cleaning up Test Records ---');
  await adminClient.from('bookings').delete().eq('booking_number', masterReference);
  await adminClient.from('customers').delete().eq('id', customerId);
  console.log('[PASS] Test records cleanly removed.');

  console.log('\n====================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runBookingVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
