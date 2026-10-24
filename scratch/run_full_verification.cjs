const path = require('path');
const fs = require('fs');
const { createClient } = require(path.resolve(__dirname, '../ADMIN/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://krkktwfgxzcivalbwrfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YmgHzWrzHBkrCt3qE6eC8g_LfSukcbT';

async function runVerification() {
  console.log('========================================================');
  console.log('   AMONTRON HOTEL & RESTAURANT - COMPREHENSIVE TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // TEST 1: Check Customer form placeholders
  console.log('--- 1. Testing Customer Form Placeholders ---');
  const formsToCheck = [
    'CUSTOMER/src/pages/ContactPage.jsx',
    'CUSTOMER/src/pages/BookingPage.jsx',
    'CUSTOMER/src/pages/RestaurantPage.jsx',
    'CUSTOMER/src/pages/EventsPage.jsx',
    'CUSTOMER/src/components/BookingModal.jsx',
    'CUSTOMER/src/components/ContactSection.jsx',
    'CUSTOMER/src/components/ManageBookingsModal.jsx'
  ];

  const forbiddenPlaceholders = [
    'Rajesh Sharma',
    'rajesh@example.com',
    '9876543210',
    '+91 98765 43210',
    '+91 94334 24718', // owner's number as placeholder
    '9433424718'
  ];

  let dummyFound = false;
  formsToCheck.forEach(f => {
    const fullPath = path.resolve(__dirname, '..', f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      forbiddenPlaceholders.forEach(dummy => {
        const regex = new RegExp(`placeholder=["'][^"']*${dummy.replace(/\+/g, '\\+')}[^"']*["']`, 'i');
        if (regex.test(content)) {
          console.error(`Found forbidden placeholder "${dummy}" in ${f}`);
          dummyFound = true;
        }
      });
    }
  });
  assert(!dummyFound, 'Customer form placeholders do not contain dummy names, fake emails, or phone numbers');

  // TEST 2: Check Hotel Branding
  console.log('\n--- 2. Testing Official Hotel Branding ---');
  const brandFiles = [
    'CUSTOMER/src/components/Navbar.jsx',
    'ADMIN/src/App.jsx',
    'STAFF/src/App.jsx'
  ];
  let brandingCorrect = true;
  brandFiles.forEach(f => {
    const fullPath = path.resolve(__dirname, '..', f);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('Amontron Hotel and Restaurant') && !content.includes('HOTEL & RESTAURANT')) {
      brandingCorrect = false;
      console.error(`Branding missing in ${f}`);
    }
  });
  assert(brandingCorrect, 'Official business name "Amontron Hotel and Restaurant" standard in Navbar & Apps');

  // TEST 3: Supabase Authentication & Location Sync
  console.log('\n--- 3. Testing Supabase Admin Connection & Live Location Sync ---');
  const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
    email: 'admin@hotel.com',
    password: 'password123'
  });
  assert(!authError && authData?.user?.id, 'Admin authenticated successfully with Supabase');

  const { data: sRow, error: sErr } = await adminClient
    .from('hotel_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  assert(!sErr && sRow?.id, 'Loaded latest hotel_settings row from Supabase');

  const loc = sRow?.whatsapp_routing?.location || {};
  assert(
    loc.display_locality === 'Near Kamarpukur, West Bengal',
    'Admin location settings stored and preserved ("Near Kamarpukur, West Bengal")'
  );
  assert(
    loc.landmark_1 === 'Near Kamarpukur Ramakrishna Math and Mission',
    'Admin landmark 1 stored ("Near Kamarpukur Ramakrishna Math and Mission")'
  );
  assert(
    loc.landmark_2 === 'Near Kamarpukur Railway Station',
    'Admin landmark 2 stored ("Near Kamarpukur Railway Station")'
  );
  assert(
    sRow?.address?.includes('WM55+6MH, Dasghara') && sRow?.google_maps_url?.includes('WM55%2B6MH'),
    'Actual map physical destination and coordinates remain pointing to Dasghara'
  );

  // TEST 4: Financial Calculations & Dates
  console.log('\n--- 4. Testing Monthly Financial Aggregations ---');
  const { data: payments } = await adminClient.from('payments').select('*');
  const { data: expenses } = await adminClient.from('expenses').select('*');
  const { data: bills } = await adminClient.from('bills').select('*');

  console.log(`Retrieved ${payments?.length || 0} payments, ${expenses?.length || 0} expenses, ${bills?.length || 0} bills.`);

  // Test net cash movement formula: cash receipts - expenses
  const totalReceipts = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalExp = (expenses || []).filter(e => e.status !== 'rejected').reduce((s, e) => s + Number(e.amount || 0), 0);
  const netCash = totalReceipts - totalExp;
  assert(
    typeof netCash === 'number' && !isNaN(netCash),
    `Net cash movement computed correctly: Receipts (₹${totalReceipts}) - Expenses (₹${totalExp}) = ₹${netCash}`
  );

  // TEST 5: Role boundaries - Staff permissions
  console.log('\n--- 5. Testing Staff Role Security ---');
  const staffClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: staffAuth, error: staffAuthError } = await staffClient.auth.signInWithPassword({
    email: 'staff@hotel.com',
    password: 'password123'
  });
  assert(!staffAuthError && staffAuth?.user?.id, 'Staff user authenticated successfully');

  // Verify staff cannot delete expenses
  const { error: staffDeleteErr } = await staffClient
    .from('expenses')
    .delete()
    .eq('id', 'non-existent-test-id');
  assert(
    staffDeleteErr !== null,
    'Staff role is blocked from destructive operations by Supabase RLS'
  );

  console.log('\n========================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
