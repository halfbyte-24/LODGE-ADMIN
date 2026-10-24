const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../ADMIN/node_modules/@supabase/supabase-js'));

const supabaseUrl = 'https://krkktwfgxzcivalbwrfq.supabase.co';
const supabaseKey = 'sb_publishable_YmgHzWrzHBkrCt3qE6eC8g_LfSukcbT';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectStorageAndDatabase() {
  await supabase.auth.signInWithPassword({
    email: 'admin@hotel.com',
    password: 'password123'
  });

  console.log('=== INSPECTING SUPABASE STORAGE USAGE ===');
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
      console.log('Storage buckets query error:', bErr.message);
    } else {
      console.log('Total Buckets found:', buckets ? buckets.length : 0);
      if (buckets && buckets.length > 0) {
        for (const b of buckets) {
          const { data: files, error: fErr } = await supabase.storage.from(b.name).list();
          console.log(`Bucket "${b.name}": ${files ? files.length : 0} objects`);
        }
      } else {
        console.log('Storage Buckets: NONE (Supabase Storage is currently empty / 0 bytes used)');
      }
    }
  } catch (e) {
    console.error('Storage error:', e.message);
  }

  console.log('\n=== INSPECTING DATABASE ROW COUNTS ===');
  const tables = ['customers', 'bookings', 'bills', 'bill_items', 'payments', 'expenses', 'rooms', 'menu_items', 'hotel_settings'];

  for (const t of tables) {
    try {
      const { data, count, error } = await supabase.from(t).select('*', { count: 'exact' });
      if (error) {
        console.log(`Table "${t}": Error (${error.message})`);
      } else {
        console.log(`Table "${t}": ${data ? data.length : 0} rows`);
      }
    } catch (e) {
      console.log(`Table "${t}": ${e.message}`);
    }
  }
}

inspectStorageAndDatabase();
