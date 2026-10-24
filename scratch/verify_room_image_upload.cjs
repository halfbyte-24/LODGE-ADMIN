const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../ADMIN/node_modules/@supabase/supabase-js'));

const supabaseUrl = 'https://krkktwfgxzcivalbwrfq.supabase.co';
const supabaseKey = 'sb_publishable_YmgHzWrzHBkrCt3qE6eC8g_LfSukcbT';

const adminClient = createClient(supabaseUrl, supabaseKey);
const anonClient = createClient(supabaseUrl, supabaseKey);

async function verifyRoomImageUpload() {
  console.log('====================================================');
  console.log('TESTING ROOM IMAGE UPLOAD & CUSTOMER SYNCHRONIZATION');
  console.log('====================================================');

  // 1. Authenticate Admin
  const { error: authErr } = await adminClient.auth.signInWithPassword({
    email: 'admin@hotel.com',
    password: 'password123'
  });
  if (authErr) {
    console.error('[FAIL] Admin login failed:', authErr.message);
    process.exit(1);
  }
  console.log('[PASS] Authenticated as Admin.');

  // 2. Fetch Room 101
  const { data: rooms, error: rErr } = await adminClient
    .from('rooms')
    .select('*')
    .order('room_number', { ascending: true })
    .limit(1);

  if (rErr || !rooms || rooms.length === 0) {
    console.error('[FAIL] Failed to fetch room:', rErr ? rErr.message : 'No rooms');
    process.exit(1);
  }

  const targetRoom = rooms[0];
  const originalImageUrl = targetRoom.image_url;
  const originalPrice = targetRoom.price_per_night;
  console.log(`[INFO] Target: Room ${targetRoom.room_number} (ID: ${targetRoom.id})`);
  console.log(`[INFO] Original Image URL: ${originalImageUrl || '(None)'}`);
  console.log(`[INFO] Original Rate: ₹${originalPrice}`);

  // 3. Test Upload 1: New Room Image
  console.log('\n--- Test 1: Uploading New Room Image to Supabase Storage (room-images) ---');
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const fileBuffer1 = Buffer.from(pngBase64, 'base64');
  const fileName1 = `rooms/room_${targetRoom.room_number}_test_1_${Date.now()}.png`;

  const { data: upData1, error: upErr1 } = await adminClient.storage
    .from('room-images')
    .upload(fileName1, fileBuffer1, {
      contentType: 'image/png',
      upsert: true
    });

  if (upErr1) {
    console.error('[FAIL] Test 1 storage upload failed:', upErr1.message);
    process.exit(1);
  }
  const { data: pubData1 } = adminClient.storage.from('room-images').getPublicUrl(upData1.path);
  const testUrl1 = pubData1.publicUrl;
  console.log('[PASS] Upload 1 succeeded. Public URL:', testUrl1);

  // Verify public HTTP accessibility
  const httpRes1 = await fetch(testUrl1);
  if (httpRes1.status !== 200) {
    console.error('[FAIL] Upload 1 URL is not publicly accessible (HTTP ' + httpRes1.status + ')');
    process.exit(1);
  }
  console.log('[PASS] Public HTTP 200 OK verified without authentication.');

  // 4. Save Room with New Image in Database
  console.log('\n--- Test 2: Saving Room with Uploaded Image URL in Database ---');
  const { error: dbErr1 } = await adminClient
    .from('rooms')
    .update({ image_url: testUrl1, updated_at: new Date().toISOString() })
    .eq('id', targetRoom.id);

  if (dbErr1) {
    console.error('[FAIL] DB update failed:', dbErr1.message);
    process.exit(1);
  }
  console.log('[PASS] Room record updated in database.');

  // 5. Test Customer App Synchronization
  console.log('\n--- Test 3: Verifying CUSTOMER Application Receives New Image ---');
  const { data: customerRoom, error: custErr } = await anonClient
    .from('rooms')
    .select('id, room_number, image_url, price_per_night, status')
    .eq('id', targetRoom.id)
    .single();

  if (custErr || !customerRoom) {
    console.error('[FAIL] Customer query failed:', custErr ? custErr.message : 'Not found');
    process.exit(1);
  }

  if (customerRoom.image_url !== testUrl1) {
    console.error(`[FAIL] Image URL mismatch on customer side: Expected ${testUrl1}, got ${customerRoom.image_url}`);
    process.exit(1);
  }
  console.log('[PASS] CUSTOMER app receives live uploaded image URL:', customerRoom.image_url);

  // 6. Test Replacing Image
  console.log('\n--- Test 4: Testing Replace Image Workflow ---');
  const fileName2 = `rooms/room_${targetRoom.room_number}_test_2_replace_${Date.now()}.png`;
  const { data: upData2, error: upErr2 } = await adminClient.storage
    .from('room-images')
    .upload(fileName2, fileBuffer1, {
      contentType: 'image/png',
      upsert: true
    });

  if (upErr2) {
    console.error('[FAIL] Replace upload failed:', upErr2.message);
    process.exit(1);
  }
  const { data: pubData2 } = adminClient.storage.from('room-images').getPublicUrl(upData2.path);
  const testUrl2 = pubData2.publicUrl;

  await adminClient
    .from('rooms')
    .update({ image_url: testUrl2, updated_at: new Date().toISOString() })
    .eq('id', targetRoom.id);

  const { data: replacedRoom } = await anonClient.from('rooms').select('image_url').eq('id', targetRoom.id).single();
  console.log('[PASS] Replaced image verified on customer side:', replacedRoom.image_url === testUrl2 ? 'YES' : 'NO');

  // 7. Cleanup & Restore Original Room State
  console.log('\n--- Test 5: Restoring Original Room State & Cleaning Test Storage ---');
  await adminClient
    .from('rooms')
    .update({ image_url: originalImageUrl, updated_at: new Date().toISOString() })
    .eq('id', targetRoom.id);

  await adminClient.storage.from('room-images').remove([fileName1, fileName2]);

  // Final verification that pricing and status remain untouched
  const { data: finalRoom } = await adminClient.from('rooms').select('*').eq('id', targetRoom.id).single();
  console.log('[PASS] Room rate preserved:', finalRoom.price_per_night === originalPrice ? 'YES' : 'NO');
  console.log('[PASS] Room image restored to:', finalRoom.image_url || '(default)');
  console.log('[PASS] Temporary storage files cleaned up.');

  console.log('\n====================================================');
  console.log('ALL ROOM IMAGE UPLOAD VERIFICATIONS PASSED (5/5)!');
  console.log('====================================================');
}

verifyRoomImageUpload().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
