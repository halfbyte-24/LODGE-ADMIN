import { supabase } from '../lib/supabase';

export const authService = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    if (!data.user) throw new Error('Login failed: No user returned');

    // Fetch profile to get role using maybeSingle to handle 0 rows gracefully
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error('Database error while fetching profile. See console for details.');
    }

    if (!profileData) {
      console.error(`No profile found for user ID: ${data.user.id}`);
      throw new Error('Profile not configured. Please contact the administrator.');
    }
    
    return { user: data.user, profile: profileData };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error in getCurrentUser:', profileError);
    }
    
    // Return what we have, even if profile is missing (let the router handle it)
    return { user: session.user, profile: profileData };
  }
};
