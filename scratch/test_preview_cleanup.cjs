const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../ADMIN/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://krkktwfgxzcivalbwrfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YmgHzWrzHBkrCt3qE6eC8g_LfSukcbT';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testPatterns = ['tg', 'test', 'dummy', 'dsdshgf'];
function isTestString(str) {
  if (!str) return false;
  const lower = str.toLowerCase().trim();
  return testPatterns.some(p => lower.includes(p)) || lower.startsWith('req_');
}

async function previewTestDataCleanup() {
  await supabase.auth.signInWithPassword({ email: 'admin@hotel.com', password: 'password123' });

  const [
    { data: customers },
    { data: bookings },
    { data: bills },
    { data: payments },
    { data: expenses }
  ] = await Promise.all([
    supabase.from('customers').select('*').order('created_at', { ascending: false }),
    supabase.from('bookings').select('*, customers(full_name), rooms(room_number)').order('created_at', { ascending: false }),
    supabase.from('bills').select('*, customers(full_name), payments(*)').order('created_at', { ascending: false }),
    supabase.from('payments').select('*, bills(invoice_number, customer_id)').order('paid_at', { ascending: false }),
    supabase.from('expenses').select('*').order('expense_date', { ascending: false })
  ]);

  const allCust = customers || [];
  const allBkg = bookings || [];
  const allBills = bills || [];
  const allPmts = payments || [];
  const allExp = expenses || [];

  const eligibleCustomers = [];
  const protectedRecords = [];

  for (const c of allCust) {
    const linkedB = allBkg.filter(b => b.customer_id === c.id);
    const linkedBl = allBills.filter(bl => bl.customer_id === c.id);
    const linkedP = allPmts.filter(p => p.bills?.customer_id === c.id);

    const isTest = c.is_test_data || isTestString(c.full_name) || isTestString(c.email) || linkedB.some(b => isTestString(b.booking_number));
    if (!isTest) continue;

    const totalPaid = linkedP.reduce((s, p) => s + Number(p.amount || 0), 0);

    if (linkedP.length > 0) {
      protectedRecords.push({
        type: 'customer',
        id: c.id,
        name: c.full_name,
        details: `${linkedP.length} payment(s) totaling ₹${totalPaid.toFixed(2)}`,
        reason: 'Contains payment receipts. Permanent deletion disabled to protect financial audit history.'
      });
    } else {
      eligibleCustomers.push({
        id: c.id,
        full_name: c.full_name,
        phone: c.phone || 'None',
        linkedBookings: linkedB.map(b => ({ id: b.id, booking_number: b.booking_number, room: b.rooms?.room_number, status: b.booking_status })),
        linkedBills: linkedBl.map(bl => ({ id: bl.id, invoice_number: bl.invoice_number, amount: bl.total_amount, status: bl.bill_status }))
      });
    }
  }

  // Standalone test bookings
  const eligibleStandaloneBookings = allBkg.filter(b => {
    const isUnderEligibleCust = eligibleCustomers.some(ec => ec.id === b.customer_id);
    if (isUnderEligibleCust) return false;
    const isTest = b.is_test_data || isTestString(b.booking_number);
    if (!isTest) return false;
    const linkedBl = allBills.filter(bl => bl.booking_id === b.id);
    const hasP = linkedBl.some(bl => (bl.payments || []).length > 0);
    return !hasP;
  }).map(b => ({
    id: b.id,
    booking_number: b.booking_number,
    guest: b.customers?.full_name || 'Guest',
    room: b.rooms?.room_number || 'N/A'
  }));

  // Standalone unpaid test bills
  const eligibleBills = allBills.filter(bl => {
    const isUnderEligibleCust = eligibleCustomers.some(ec => ec.id === bl.customer_id);
    if (isUnderEligibleCust) return false;
    const isTest = bl.is_test_data || isTestString(bl.invoice_number);
    const hasP = (bl.payments || []).length > 0;
    return isTest && !hasP;
  }).map(bl => ({
    id: bl.id,
    invoice_number: bl.invoice_number,
    guest: bl.customers?.full_name || 'Guest',
    amount: bl.total_amount
  }));

  // Test expenses
  const eligibleExpenses = allExp.filter(e => e.is_test_data || isTestString(e.title)).map(e => ({
    id: e.id,
    title: e.title,
    amount: e.amount,
    date: e.expense_date
  }));

  return {
    eligibleCustomers,
    eligibleStandaloneBookings,
    eligibleBills,
    eligibleExpenses,
    protectedRecords,
    totalEligibleCount: eligibleCustomers.length + eligibleStandaloneBookings.length + eligibleBills.length + eligibleExpenses.length
  };
}

previewTestDataCleanup().then(res => {
  console.log('Preview Result:');
  console.log('Eligible Customers:', res.eligibleCustomers);
  console.log('Protected Records:', res.protectedRecords);
  console.log('Total eligible count:', res.totalEligibleCount);
}).catch(console.error);
