/**
 * Contact & WhatsApp Routing Service for CUSTOMER Website
 * Connects website buttons (Room Booking, Restaurant Orders, General Enquiries)
 * directly to the admin-configured WhatsApp staff recipient stored in Supabase.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function normalizePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  // 10 digits Indian standard -> prepend 91
  if (digits.length === 10) return '91' + digits;
  // 11 digits starting with 0 -> replace 0 with 91
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
   * Fetch current WhatsApp routing configuration from Supabase
   */
  async getRouting() {
    let contacts = [];
    let booking_recipient_id = null;
    let restaurant_recipient_id = null;
    let general_recipient_id = null;
    let settingsRow = null;

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Fetch latest hotel_settings
        const { data: settingsList, error: sErr } = await supabase
          .from('hotel_settings')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!sErr && settingsList && settingsList.length > 0) {
          settingsRow = settingsList[0];
          
          if (settingsRow.whatsapp_routing && typeof settingsRow.whatsapp_routing === 'object') {
            const wr = settingsRow.whatsapp_routing;
            if (Array.isArray(wr.contacts)) contacts = wr.contacts;
            booking_recipient_id = wr.booking_recipient_id || null;
            restaurant_recipient_id = wr.restaurant_recipient_id || null;
            general_recipient_id = wr.general_recipient_id || null;
          } else if (settingsRow.whatsapp) {
            try {
              const parsed = JSON.parse(settingsRow.whatsapp);
              if (parsed && typeof parsed === 'object') {
                if (Array.isArray(parsed.contacts)) contacts = parsed.contacts;
                booking_recipient_id = parsed.booking_recipient_id || null;
                restaurant_recipient_id = parsed.restaurant_recipient_id || null;
                general_recipient_id = parsed.general_recipient_id || null;
              }
            } catch {
              // Not JSON
            }
          }
        }
      } catch (err) {
        console.warn('[contactRoutingService] Could not fetch settings routing:', err);
      }

      // 2. Fetch whatsapp_contacts table if available
      try {
        const { data: dbContacts, error: cErr } = await supabase
          .from('whatsapp_contacts')
          .select('*')
          .order('created_at', { ascending: true });

        if (!cErr && Array.isArray(dbContacts) && dbContacts.length > 0) {
          contacts = dbContacts;
        }
      } catch {
        // Table may not exist yet
      }
    }

    const findContact = (id) => {
      if (!id) return null;
      return contacts.find(c => String(c.id) === String(id) && c.is_active !== false) || null;
    };

    return {
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
   * Build click-to-chat WhatsApp URL for a target phone & message
   */
  buildWhatsAppUrl(rawPhone, messageText) {
    const digits = normalizePhone(rawPhone);
    if (!digits || digits.length < 10) {
      return null;
    }
    return `https://wa.me/${digits}?text=${encodeURIComponent(messageText || '')}`;
  },

  /**
   * Room Booking WhatsApp helper
   */
  async getBookingWhatsAppAction({
    guestName,
    guestPhone,
    roomName,
    roomNumber,
    checkIn,
    checkOut,
    guests,
    totalAmount
  }) {
    const routing = await this.getRouting();
    const contact = routing.bookingContact;

    if (!contact || !contact.phone) {
      return {
        configured: false,
        contactName: null,
        url: null,
        errorMessage: 'Room Booking WhatsApp recipient is not configured in Admin Settings. Please call the hotel at +91 94334 24718.'
      };
    }

    const lines = [
      '🏨 *AMONTRON HOTEL & RESTAURANT — ROOM BOOKING ENQUIRY*',
      '----------------------------------------'
    ];

    if (guestName) lines.push(`👤 *Guest Name:* ${guestName}`);
    if (guestPhone) lines.push(`📞 *Phone:* ${guestPhone}`);
    if (roomName) lines.push(`🛏️ *Room:* ${roomName}${roomNumber ? ` (Room ${roomNumber})` : ''}`);
    if (checkIn) lines.push(`📅 *Check-In:* ${checkIn}`);
    if (checkOut) lines.push(`📅 *Check-Out:* ${checkOut}`);
    if (guests) lines.push(`👥 *Guests:* ${guests}`);
    if (totalAmount) lines.push(`💰 *Estimated Total:* ₹${Number(totalAmount).toLocaleString('en-IN')}`);

    lines.push('----------------------------------------');
    lines.push('Please confirm room availability and booking details. Thank you!');

    const messageText = lines.join('\n');
    const url = this.buildWhatsAppUrl(contact.phone, messageText);

    return {
      configured: true,
      contactName: contact.name,
      contactPhone: contact.phone,
      url,
      errorMessage: null
    };
  },

  /**
   * Restaurant Orders WhatsApp helper
   */
  async getRestaurantWhatsAppAction({
    items = [],
    customerName,
    customerPhone,
    tableOrRoom,
    specialNotes
  }) {
    const routing = await this.getRouting();
    const contact = routing.restaurantContact;

    if (!contact || !contact.phone) {
      return {
        configured: false,
        contactName: null,
        url: null,
        errorMessage: 'Restaurant Orders WhatsApp recipient is not configured in Admin Settings. Please call the hotel at +91 94334 24718.'
      };
    }

    const lines = [
      '🍽️ *AMONTRON RESTAURANT — ORDER REQUEST*',
      '----------------------------------------'
    ];

    if (customerName) lines.push(`👤 *Customer:* ${customerName}`);
    if (customerPhone) lines.push(`📞 *Phone:* ${customerPhone}`);
    if (tableOrRoom) lines.push(`📍 *Table / Room / Takeaway:* ${tableOrRoom}`);

    if (items && items.length > 0) {
      lines.push('\n📋 *Selected Items:*');
      let orderTotal = 0;
      items.forEach(item => {
        const qty = item.quantity || 1;
        const price = Number(item.price || 0);
        const itemTotal = price * qty;
        orderTotal += itemTotal;
        lines.push(`• ${qty}x ${item.name} (₹${itemTotal})`);
      });
      if (orderTotal > 0) {
        lines.push(`💰 *Estimated Order Total:* ₹${orderTotal.toLocaleString('en-IN')}`);
      }
    }

    if (specialNotes) {
      lines.push(`\n📝 *Notes:* ${specialNotes}`);
    }

    lines.push('----------------------------------------');
    lines.push('Please confirm this restaurant order. Thank you!');

    const messageText = lines.join('\n');
    const url = this.buildWhatsAppUrl(contact.phone, messageText);

    return {
      configured: true,
      contactName: contact.name,
      contactPhone: contact.phone,
      url,
      errorMessage: null
    };
  },

  /**
   * General Enquiry WhatsApp helper
   */
  async getGeneralWhatsAppAction({
    name,
    phone,
    email,
    subject,
    message
  }) {
    const routing = await this.getRouting();
    const contact = routing.generalContact;

    if (!contact || !contact.phone) {
      return {
        configured: false,
        contactName: null,
        url: null,
        errorMessage: 'General Enquiries WhatsApp recipient is not configured in Admin Settings. Please call our front desk at +91 94334 24718.'
      };
    }

    const lines = [
      '💬 *AMONTRON HOTEL & RESTAURANT — GENERAL ENQUIRY*',
      '----------------------------------------'
    ];

    if (name) lines.push(`👤 *From:* ${name}`);
    if (phone) lines.push(`📞 *Phone:* ${phone}`);
    if (email) lines.push(`✉️ *Email:* ${email}`);
    if (subject) lines.push(`📌 *Subject:* ${subject}`);
    if (message) lines.push(`\n📝 *Message:*\n${message}`);

    lines.push('----------------------------------------');
    lines.push('Thank you!');

    const messageText = lines.join('\n');
    const url = this.buildWhatsAppUrl(contact.phone, messageText);

    return {
      configured: true,
      contactName: contact.name,
      contactPhone: contact.phone,
      url,
      errorMessage: null
    };
  }
};
