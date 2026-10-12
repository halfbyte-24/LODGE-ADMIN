import { supabase } from '../lib/supabase';

export const billingService = {
  
  async getDraftBillForCustomer(idOrCustomerId) {
    if (!idOrCustomerId) return null;

    // 1. First check if idOrCustomerId is a direct bill ID
    const { data: directBill, error: directErr } = await supabase
      .from('bills')
      .select('*, bill_items(*), customers(*), bookings(*)')
      .eq('id', idOrCustomerId)
      .maybeSingle();

    if (directErr) {
      console.error('Error fetching bill directly by ID:', directErr);
    }
    if (directBill) {
      return directBill;
    }

    // 2. Otherwise check if there is an active draft bill for this customer ID
    const { data: bills, error: custErr } = await supabase
      .from('bills')
      .select('*, bill_items(*), customers(*), bookings(*)')
      .eq('customer_id', idOrCustomerId)
      .eq('bill_status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1);

    if (custErr) {
      console.error('Error fetching bill by customer_id:', custErr);
      throw custErr;
    }
    if (bills && bills.length > 0) {
      return bills[0];
    }
    return null;
  },

  async createDraftBill(customerId, staffId, bookingId = null) {
    // Verify customer exists before inserting to prevent foreign key errors
    const { data: customer, error: custVerifyErr } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .maybeSingle();

    if (custVerifyErr) throw custVerifyErr;
    if (!customer) {
      throw new Error(`Cannot initialize bill: Customer with ID "${customerId}" does not exist in the database.`);
    }

    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const { data, error } = await supabase
      .from('bills')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: customerId,
        booking_id: bookingId,
        staff_id: staffId,
        bill_status: 'draft',
        payment_status: 'pending',
        subtotal: 0,
        total_amount: 0
      })
      .select('*, bill_items(*), customers(*), bookings(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async getOrInitializeDraftBill(idOrCustomerId, staffId) {
    let bill = await this.getDraftBillForCustomer(idOrCustomerId);
    if (!bill) {
      // Find if this ID corresponds to a customer with an active booking
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', idOrCustomerId)
        .in('booking_status', ['reserved', 'checked_in'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      let bookingId = bookings && bookings.length > 0 ? bookings[0].id : null;
      bill = await this.createDraftBill(idOrCustomerId, staffId, bookingId);
    }
    return bill;
  },

  async updateBillTotals(billId, subtotal, discount, tax, advance, total) {
    const { error } = await supabase
      .from('bills')
      .update({
        subtotal,
        discount_amount: discount,
        tax_amount: tax,
        advance_amount: advance,
        total_amount: total
      })
      .eq('id', billId);
    
    if (error) throw error;
  },

  async addOrUpdateBillItem(billId, itemType, item, qty = 1, isCustom = false) {
    if (!billId) throw new Error('Cannot add bill item: missing bill ID.');

    // Normalize itemType to comply with PostgreSQL check constraint: 'room', 'food', 'drink', 'service', 'custom'
    const normalizedType = (itemType === 'drinks' || itemType === 'drink')
      ? 'drink'
      : (itemType === 'services' || itemType === 'service')
      ? 'service'
      : itemType;

    const unitPrice = Number(item.price) || 0;
    const quantity = Number(qty) || 1;

    // For regular items with reference_id, check if item already exists in this bill
    if (!isCustom && item?.id) {
      const { data: existingItems, error: searchError } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', billId)
        .eq('reference_id', item.id);
        
      if (searchError) throw searchError;

      if (existingItems && existingItems.length > 0) {
        const existing = existingItems[0];
        const newQty = (Number(existing.quantity) || 0) + quantity;
        const newTotal = Number(existing.unit_price) * newQty;
        
        const { data, error } = await supabase
          .from('bill_items')
          .update({ quantity: newQty, total_price: newTotal })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    // Insert new item
    const { data, error } = await supabase
      .from('bill_items')
      .insert({
        bill_id: billId,
        item_type: normalizedType,
        reference_id: isCustom ? null : item.id,
        item_name: isCustom ? item.name : (item.name || item.room_number || 'Item'),
        quantity: quantity,
        unit_price: unitPrice,
        total_price: unitPrice * quantity
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateItemQuantity(itemId, newQty, unitPrice) {
    const newTotal = Number(unitPrice) * newQty;
    const { data, error } = await supabase
      .from('bill_items')
      .update({ quantity: newQty, total_price: newTotal })
      .eq('id', itemId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeBillItem(itemId) {
    const { error } = await supabase
      .from('bill_items')
      .delete()
      .eq('id', itemId);
    if (error) throw error;
  },

  async confirmBill(billId) {
    const { error } = await supabase
      .from('bills')
      .update({ bill_status: 'invoiced' }) // or 'confirmed'
      .eq('id', billId);
    if (error) throw error;
  },

  async getBillDetails(billId) {
    const { data, error } = await supabase
      .from('bills')
      .select('*, bill_items(*), customers(*), bookings(*, rooms(*))')
      .eq('id', billId)
      .single();
    if (error) throw error;
    return data;
  },
  
  async getActiveDraftCount() {
      const { count } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('bill_status', 'draft');
      return count || 0;
  },

  async recordPayment({ billId, amount, paymentMethod, staffId, notes = '' }) {
    // 1. Insert into payments table
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        bill_id: billId,
        amount: Number(amount),
        payment_method: paymentMethod.toLowerCase(), // 'cash', 'upi', 'card', 'other'
        payment_status: 'paid',
        received_by: staffId,
        notes: notes,
        paid_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 2. Fetch bill to check total and update status
    const { data: bill, error: billFetchError } = await supabase
      .from('bills')
      .select('*, payments(*), bookings(*)')
      .eq('id', billId)
      .single();

    if (billFetchError) throw billFetchError;

    const totalPaid = (bill.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const newPaymentStatus = totalPaid >= Number(bill.total_amount) ? 'paid' : 'partially_paid';

    const { error: billUpdateError } = await supabase
      .from('bills')
      .update({
        payment_status: newPaymentStatus,
        bill_status: 'completed'
      })
      .eq('id', billId);

    if (billUpdateError) throw billUpdateError;

    // 3. If there is an associated booking, update room status if completed
    if (bill.booking_id && newPaymentStatus === 'paid') {
      const { data: bkg } = await supabase.from('bookings').select('room_id').eq('id', bill.booking_id).single();
      if (bkg?.room_id) {
        await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', bkg.room_id);
        await supabase.from('bookings').update({ booking_status: 'checked_out' }).eq('id', bill.booking_id);
      }
    }

    return payment;
  },

  async getBillHistory() {
    const { data, error } = await supabase
      .from('bills')
      .select('*, customers(full_name, phone), bookings(room_id, rooms(room_number)), payments(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
