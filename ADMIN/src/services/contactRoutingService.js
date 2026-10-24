/**
 * Contact & WhatsApp Routing Service
 * Handles persistence and retrieval of admin-managed WhatsApp routing contacts
 * connected to Supabase backend.
 */

export function normalizePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  // If 10 digits (Indian standard mobile), prepend country code 91
  if (digits.length === 10) return '91' + digits;
  // If starts with 0 and is 11 digits
  if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.slice(1);
  return digits;
}

export function formatDisplayPhone(raw) {
  if (!raw) return '';
  const clean = String(raw).trim();
  if (clean.startsWith('+')) return clean;
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return clean;
}

export const contactRoutingService = {
  /**
   * Fetch current WhatsApp contacts and routing selections
   */
  async getRouting(supabase) {
    let contacts = [];
    let booking_recipient_id = null;
    let restaurant_recipient_id = null;
    let general_recipient_id = null;
    let settingsRow = null;

    try {
      // 1. Fetch latest hotel_settings
      const { data: settingsList, error: sErr } = await supabase
        .from('hotel_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!sErr && settingsList && settingsList.length > 0) {
        settingsRow = settingsList[0];
        
        // Check whatsapp_routing column
        if (settingsRow.whatsapp_routing && typeof settingsRow.whatsapp_routing === 'object') {
          const wr = settingsRow.whatsapp_routing;
          if (Array.isArray(wr.contacts)) contacts = wr.contacts;
          booking_recipient_id = wr.booking_recipient_id || null;
          restaurant_recipient_id = wr.restaurant_recipient_id || null;
          general_recipient_id = wr.general_recipient_id || null;
        } else if (settingsRow.whatsapp) {
          // Attempt JSON parse from whatsapp column fallback
          try {
            const parsed = JSON.parse(settingsRow.whatsapp);
            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.contacts)) contacts = parsed.contacts;
              booking_recipient_id = parsed.booking_recipient_id || null;
              restaurant_recipient_id = parsed.restaurant_recipient_id || null;
              general_recipient_id = parsed.general_recipient_id || null;
            }
          } catch {
            // Not a JSON string (could be legacy string)
          }
        }
      }
    } catch (err) {
      console.warn('[contactRoutingService] Error fetching hotel_settings:', err);
    }

    // 2. Also try reading from whatsapp_contacts table if available
    try {
      const { data: dbContacts, error: cErr } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('created_at', { ascending: true });

      if (!cErr && Array.isArray(dbContacts) && dbContacts.length > 0) {
        contacts = dbContacts;
      }
    } catch {
      // whatsapp_contacts table not yet created; fallback to settings payload
    }

    // Resolve active recipient objects
    const findContact = (id) => contacts.find(c => String(c.id) === String(id) && c.is_active !== false) || null;

    return {
      settingsId: settingsRow?.id,
      contacts,
      booking_recipient_id,
      restaurant_recipient_id,
      general_recipient_id,
      bookingContact: findContact(booking_recipient_id),
      restaurantContact: findContact(restaurant_recipient_id),
      generalContact: findContact(general_recipient_id)
    };
  },

  /**
   * Save WhatsApp contacts and routing selections
   */
  async saveRouting(supabase, { settingsId, contacts, booking_recipient_id, restaurant_recipient_id, general_recipient_id, location, timings }) {
    let existingRouting = {};
    if (settingsId) {
      try {
        const { data: sRow } = await supabase.from('hotel_settings').select('whatsapp_routing').eq('id', settingsId).maybeSingle();
        if (sRow?.whatsapp_routing && typeof sRow.whatsapp_routing === 'object') {
          existingRouting = sRow.whatsapp_routing;
        }
      } catch {}
    }

    const payload = {
      ...existingRouting,
      contacts,
      booking_recipient_id: booking_recipient_id || null,
      restaurant_recipient_id: restaurant_recipient_id || null,
      general_recipient_id: general_recipient_id || null,
      location: location || existingRouting.location || {},
      timings: timings || existingRouting.timings || { check_in_time: '12:00 PM', check_out_time: '11:00 AM' }
    };

    const serialized = JSON.stringify(payload);

    // 1. Try to upsert into whatsapp_contacts table if available
    try {
      for (const c of contacts) {
        if (!c.id || c.id.startsWith('temp_')) {
          // Insert new
          await supabase.from('whatsapp_contacts').insert([{
            name: c.name,
            phone: c.phone,
            role_description: c.role_description || '',
            is_active: c.is_active !== false
          }]);
        } else {
          // Update existing
          await supabase.from('whatsapp_contacts').update({
            name: c.name,
            phone: c.phone,
            role_description: c.role_description || '',
            is_active: c.is_active !== false,
            updated_at: new Date().toISOString()
          }).eq('id', c.id);
        }
      }
    } catch (tableErr) {
      console.warn('[contactRoutingService] whatsapp_contacts table update skipped:', tableErr?.message);
    }

    // 2. Update hotel_settings with both structured jsonb and fallback whatsapp text
    if (settingsId) {
      const updateObj = {
        updated_at: new Date().toISOString(),
        whatsapp: serialized
      };
      
      // Try with whatsapp_routing column
      try {
        const { error: wrErr } = await supabase
          .from('hotel_settings')
          .update({
            ...updateObj,
            whatsapp_routing: payload
          })
          .eq('id', settingsId);

        if (wrErr) {
          // Fallback without whatsapp_routing column
          await supabase
            .from('hotel_settings')
            .update(updateObj)
            .eq('id', settingsId);
        }
      } catch {
        await supabase
          .from('hotel_settings')
          .update(updateObj)
          .eq('id', settingsId);
      }
    }

    return { success: true };
  }
};
