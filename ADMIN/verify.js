import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verify() {
  console.log('Verifying Supabase connection...');
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  } else {
    console.log('Profiles table exists. Count:', profiles.length);
    console.log('Profiles:', profiles);
  }
}

verify();
