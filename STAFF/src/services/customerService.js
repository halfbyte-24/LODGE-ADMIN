import { supabase } from '../lib/supabase';

export const customerService = {
  async createCustomer(customerData) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        full_name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        number_of_guests: customerData.guests,
        customer_type: customerData.type,
        notes: customerData.notes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
