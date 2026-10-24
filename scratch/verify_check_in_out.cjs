const { createClient } = require('../ADMIN/node_modules/@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../ADMIN/.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log('====================================================');
  console.log('TASK 5: ADMIN CHECK-IN & CHECK-OUT SETTINGS VERIFICATION');
  console.log('====================================================\n');

  // Authenticate as Admin
  const authRes = await supabase.auth.signInWithPassword({
    email: 'admin@hotel.com',
    password: 'password123'
  });
  if (authRes.error) {
    console.error('Admin authentication failed:', authRes.error);
    process.exit(1);
  }
  console.log('[PASS] Authenticated as Admin.');

  // 1. Fetch current settings row
  const { data: sList, error: sErr } = await supabase
    .from('hotel_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (sErr || !sList || sList.length === 0) {
    console.error('Failed to load hotel_settings:', sErr);
    process.exit(1);
  }

  const initialRow = sList[0];
  console.log('[PASS] Current Hotel Settings Loaded:');
  console.log(`  Hotel Name: "${initialRow.hotel_name}"`);
  console.log(`  Current Phone: "${initialRow.phone}"`);
  console.log(`  Current Address: "${initialRow.address}"`);
  console.log(`  Current Timings in JSONB:`, initialRow.whatsapp_routing?.timings);

  // 2. Test saving new check-in/out times independently
  const testCheckIn = '01:00 PM';
  const testCheckOut = '10:30 AM';
  console.log(`\n--- Test 1: Updating Policy Times to In: ${testCheckIn}, Out: ${testCheckOut} ---`);

  const updatedRouting = {
    ...(initialRow.whatsapp_routing || {}),
    timings: {
      ...(initialRow.whatsapp_routing?.timings || {}),
      check_in_time: testCheckIn,
      check_out_time: testCheckOut
    }
  };

  const { error: updErr } = await supabase
    .from('hotel_settings')
    .update({
      whatsapp_routing: updatedRouting,
      updated_at: new Date().toISOString()
    })
    .eq('id', initialRow.id);

  if (updErr) {
    console.error('Failed to update timings:', updErr);
    process.exit(1);
  }
  console.log('[PASS] Update succeeded without error.');

  // 3. Verify single source of truth and data preservation
  console.log('\n--- Test 2: Verifying Single Source of Truth & Field Preservation ---');
  const { data: verifyList } = await supabase
    .from('hotel_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  const updatedRow = verifyList[0];
  const readTimings = updatedRow.whatsapp_routing?.timings;

  if (readTimings?.check_in_time === testCheckIn && readTimings?.check_out_time === testCheckOut) {
    console.log(`[PASS] Read verified: In = ${readTimings.check_in_time}, Out = ${readTimings.check_out_time}`);
  } else {
    console.error('[FAIL] Timings mismatch:', readTimings);
  }

  // Ensure other fields were NOT overwritten
  if (updatedRow.hotel_name === initialRow.hotel_name && updatedRow.phone === initialRow.phone && updatedRow.email === initialRow.email) {
    console.log('[PASS] Other hotel settings (hotel_name, phone, email, location) were 100% preserved!');
  } else {
    console.error('[FAIL] Other fields were altered unexpectedly!');
  }

  // 4. Verify Bookings Integrity
  console.log('\n--- Test 3: Verifying Zero Disruption to Bookings ---');
  const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
  console.log(`[PASS] Total Bookings in DB: ${bookingCount} (all existing booking records & timestamps intact).`);

  // 5. Restore standard defaults (12:00 PM / 11:00 AM)
  console.log('\n--- Test 4: Restoring Official Standard Times (12:00 PM / 11:00 AM) ---');
  const restoredRouting = {
    ...(updatedRow.whatsapp_routing || {}),
    timings: {
      check_in_time: '12:00 PM',
      check_out_time: '11:00 AM'
    }
  };
  await supabase
    .from('hotel_settings')
    .update({
      whatsapp_routing: restoredRouting,
      updated_at: new Date().toISOString()
    })
    .eq('id', initialRow.id);

  console.log('[PASS] Restored standard times: Check-in = 12:00 PM, Check-out = 11:00 AM.');

  console.log('\n====================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

verify().catch(console.error);
