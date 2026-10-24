const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../ADMIN/node_modules/@supabase/supabase-js'));

const SUPABASE_URL = 'https://krkktwfgxzcivalbwrfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YmgHzWrzHBkrCt3qE6eC8g_LfSukcbT';

async function analyzeDependencies() {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await client.auth.signInWithPassword({ email: 'admin@hotel.com', password: 'password123' });

  const [
    { data: customers },
    { data: bookings },
    { data: bills },
    { data: payments },
    { data: expenses }
  ] = await Promise.all([
    client.from('customers').select('*').order('created_at', { ascending: false }),
    client.from('bookings').select('*, customers(full_name), rooms(room_number)').order('created_at', { ascending: false }),
    client.from('bills').select('*, customers(full_name), payments(*)').order('created_at', { ascending: false }),
    client.from('payments').select('*, bills(invoice_number, customer_id)').order('paid_at', { ascending: false }),
    client.from('expenses').select('*').order('expense_date', { ascending: false })
  ]);

  console.log('=== DEPENDENCY & SAFETY ANALYSIS ===\n');

  // 1. Analyze Customers
  console.log('--- CUSTOMERS ANALYSIS ---');
  customers?.forEach(c => {
    const linkedBookings = (bookings || []).filter(b => b.customer_id === c.id);
    const linkedBills = (bills || []).filter(b => b.customer_id === c.id);
    const totalPayments = (payments || []).filter(p => p.bills?.customer_id === c.id);

    const hasDeps = linkedBookings.length > 0 || linkedBills.length > 0;
    const isUnlinked = !hasDeps;

    console.log(`Customer: "${c.full_name}" [${c.id.slice(0, 8)}]`);
    console.log(`  - Type: ${c.customer_type} | Phone: ${c.phone || 'none'} | Created: ${c.created_at?.slice(0, 10)}`);
    console.log(`  - Linked Bookings: ${linkedBookings.length}, Linked Bills: ${linkedBills.length}, Total Payments: ${totalPayments.length}`);
    console.log(`  - Safety Status: ${isUnlinked ? 'SAFE FOR PERMANENT DELETION (Unlinked)' : 'MUST RETAIN OR FLAG AS TEST DATA (Has Dependencies)'}`);
    console.log('');
  });

  // 2. Analyze Bookings
  console.log('\n--- BOOKINGS ANALYSIS ---');
  bookings?.forEach(b => {
    const linkedBills = (bills || []).filter(bill => bill.booking_id === b.id);
    const hasPaidBills = linkedBills.some(bill => (bill.payments || []).length > 0);
    const isUnlinked = linkedBills.length === 0;

    console.log(`Booking: #${b.booking_number} [${b.id.slice(0, 8)}] | Guest: "${b.customers?.full_name}" | Room: ${b.rooms?.room_number || 'N/A'}`);
    console.log(`  - Status: ${b.booking_status} | Total: ₹${b.room_total} | Linked Bills: ${linkedBills.length}`);
    console.log(`  - Safety Status: ${isUnlinked ? 'SAFE FOR PERMANENT DELETION (Unlinked to bills)' : (hasPaidBills ? 'FINANCIAL EVIDENCE: MUST RETAIN OR FLAG ONLY' : 'LINKED TO BILL: CANCEL/FLAG')}`);
    console.log('');
  });

  // 3. Analyze Bills
  console.log('\n--- BILLS ANALYSIS ---');
  bills?.forEach(b => {
    const pmts = b.payments || [];
    const isPaid = pmts.length > 0;
    console.log(`Bill: Invoice #${b.invoice_number} [${b.id.slice(0, 8)}] | Guest: "${b.customers?.full_name}" | Status: ${b.bill_status}`);
    console.log(`  - Total: ₹${b.total_amount} | Payments Count: ${pmts.length}`);
    console.log(`  - Safety Status: ${isPaid ? 'CONTAINS PAYMENTS: PERMANENT DELETION FORBIDDEN (Flag/Correction Only)' : 'UNPAID/DRAFT: SAFE FOR ADMIN CLEANUP IF CONFIRMED TEST'}`);
    console.log('');
  });

  // 4. Analyze Expenses
  console.log('\n--- EXPENSES ANALYSIS ---');
  expenses?.forEach(e => {
    const isSandboxTest = e.title.toLowerCase().startsWith('cat test') || e.title.includes('Schema Test');
    console.log(`Expense: "${e.title}" [${e.id.slice(0, 8)}] | Amount: ₹${e.amount} | Cat: ${e.category} | Status: ${e.status}`);
    console.log(`  - Safety Status: ${isSandboxTest ? 'VERIFIED SANDBOX TEST: SAFE TO DELETE OR FLAG' : 'GENUINE/OPERATIONAL: PRESERVE IN FINANCIAL REPORTS'}`);
    console.log('');
  });
}

analyzeDependencies().catch(console.error);
