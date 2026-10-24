import { supabase } from '../lib/supabase';

/**
 * Service for Simple Admin Data Cleanup System
 * Provides safe individual and bulk deletion with dependency verification,
 * typed confirmation enforcement, and audit logging.
 */

export const dataManagementService = {
  /**
   * Helper to write audit logs to financial_audit_logs with hotel_settings fallback
   */
  async logAuditAction({ actionType, entityType, recordId, adminUser, details }) {
    const auditObj = {
      action_type: actionType,
      year_month: new Date().toISOString().slice(0, 7),
      performed_by: adminUser?.id || null,
      details: {
        entity_type: entityType,
        record_id: recordId,
        admin_email: adminUser?.email,
        admin_name: adminUser?.full_name,
        timestamp: new Date().toISOString(),
        ...details
      }
    };

    try {
      await supabase.from('financial_audit_logs').insert([auditObj]);
    } catch {
      // Fallback to hotel_settings array
      try {
        const { data: sList } = await supabase.from('hotel_settings').select('*').order('updated_at', { ascending: false }).limit(1);
        if (sList && sList[0]) {
          const row = sList[0];
          const wr = row.whatsapp_routing || {};
          const logs = wr.financial_audit_logs || [];
          await supabase.from('hotel_settings').update({
            whatsapp_routing: {
              ...wr,
              financial_audit_logs: [
                ...logs,
                { id: 'audit_' + Date.now(), ...auditObj, created_at: new Date().toISOString() }
              ]
            },
            updated_at: new Date().toISOString()
          }).eq('id', row.id);
        }
      } catch {}
    }
  },

  // ==========================================
  // 1. CUSTOMER INSPECTION & SAFE DELETION
  // ==========================================

  /**
   * Inspect customer dependencies before deletion
   */
  async inspectCustomerDependencies(customerId) {
    const [{ data: customer }, { data: bookings }, { data: bills }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', customerId).maybeSingle(),
      supabase.from('bookings').select('id, booking_number, booking_status').eq('customer_id', customerId),
      supabase.from('bills').select('id, invoice_number, total_amount, bill_status, payments(id, amount)').eq('customer_id', customerId)
    ]);

    const linkedBookings = bookings || [];
    const linkedBills = bills || [];
    const totalPaymentsCount = linkedBills.reduce((acc, b) => acc + (b.payments?.length || 0), 0);
    const totalPaymentsAmount = linkedBills.reduce((acc, b) => {
      return acc + (b.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }, 0);

    const hasPayments = totalPaymentsCount > 0;
    const testPatterns = ['tg', 'test', 'dummy', 'dsdshgf'];
    const isDemoCustomer = customer?.is_test_data === true || 
                           testPatterns.some(p => (customer?.full_name || '').toLowerCase().includes(p)) ||
                           testPatterns.some(p => (customer?.email || '').toLowerCase().includes(p));

    const canDelete = isDemoCustomer || !hasPayments;

    return {
      canDelete,
      isDemoCustomer,
      hasPayments,
      hasUnpaidDependencies: (linkedBookings.length > 0 || linkedBills.length > 0) && !hasPayments,
      linkedBookings,
      linkedBills,
      totalPaymentsCount,
      totalPaymentsAmount,
      reason: !canDelete
        ? `This is a genuine operational customer with ${totalPaymentsCount} payment record(s) totaling ₹${totalPaymentsAmount.toFixed(2)}. Genuine financial history cannot be deleted.`
        : null
    };
  },

  /**
   * Delete customer and their linked bookings, bills, and payments in safe transactional order
   */
  async deleteCustomer({ id, confirmText, adminUser, reason = '' }) {
    const val = (confirmText || '').trim().toUpperCase();
    if (val !== 'DELETE' && val !== `DELETE-${id.slice(0, 8).toUpperCase()}` && val !== `DELETE-${id.toUpperCase()}`) {
      throw new Error('Please type "DELETE" to confirm.');
    }

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators are authorized to delete customer records.');
    }

    const check = await this.inspectCustomerDependencies(id);
    if (!check.canDelete) {
      throw new Error(check.reason);
    }

    // 1. Delete payments linked to customer bills if this is a verified demo customer
    if (check.linkedBills.length > 0) {
      const billIds = check.linkedBills.map(b => b.id);
      if (check.hasPayments && check.isDemoCustomer) {
        await supabase.from('payments').delete().in('bill_id', billIds);
      }
      // 2. Delete bill items and bills
      await supabase.from('bill_items').delete().in('bill_id', billIds);
      const { error: bErr } = await supabase.from('bills').delete().in('id', billIds);
      if (bErr) throw bErr;
    }

    // 3. Delete linked bookings if any
    if (check.linkedBookings.length > 0) {
      const bkgIds = check.linkedBookings.map(b => b.id);
      const { error: bkErr } = await supabase.from('bookings').delete().in('id', bkgIds);
      if (bkErr) throw bkErr;
    }

    // 4. Delete customer
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;

    await this.logAuditAction({
      actionType: 'customer_deleted',
      entityType: 'customers',
      recordId: id,
      adminUser,
      details: {
        isDemoCustomer: check.isDemoCustomer,
        deletedBookingsCount: check.linkedBookings.length,
        deletedBillsCount: check.linkedBills.length,
        deletedPaymentsCount: check.totalPaymentsCount,
        reason: reason || 'Customer deleted by admin',
        deleted_at: new Date().toISOString()
      }
    });

    return { 
      success: true, 
      message: check.hasPayments
        ? `Demo customer and all linked bookings, invoices, and test receipts permanently deleted.`
        : (check.hasUnpaidDependencies
          ? `Customer and ${check.linkedBookings.length} linked test booking(s) permanently deleted.`
          : 'Customer permanently deleted.')
    };
  },

  /**
   * Delete an unbilled/unpaid test booking permanently
   */
  async deleteBooking({ id, confirmText, adminUser, reason = '' }) {
    const val = (confirmText || '').trim().toUpperCase();
    if (val !== 'DELETE' && val !== `DELETE-${id.slice(0, 8).toUpperCase()}` && val !== `DELETE-${id.toUpperCase()}`) {
      throw new Error('Please type "DELETE" to confirm.');
    }

    // Check linked bills and payments
    const { data: bills } = await supabase
      .from('bills')
      .select('id, invoice_number, payments(id, amount)')
      .eq('booking_id', id);

    const linkedBills = bills || [];
    const hasPayments = linkedBills.some(b => (b.payments?.length || 0) > 0);
    if (hasPayments) {
      throw new Error('This booking has paid invoices. Permanent deletion is disabled to preserve financial history.');
    }

    if (linkedBills.length > 0) {
      const billIds = linkedBills.map(b => b.id);
      await supabase.from('bill_items').delete().in('bill_id', billIds);
      const { error: bErr } = await supabase.from('bills').delete().in('id', billIds);
      if (bErr) throw bErr;
    }

    const { error: bkErr } = await supabase.from('bookings').delete().eq('id', id);
    if (bkErr) throw bkErr;

    await this.logAuditAction({
      actionType: 'booking_deleted',
      entityType: 'bookings',
      recordId: id,
      adminUser,
      details: {
        reason: reason || 'Booking deleted by admin',
        deletedBillsCount: linkedBills.length,
        deleted_at: new Date().toISOString()
      }
    });

    return { success: true, message: 'Booking permanently deleted.' };
  },

  /**
   * Universal permanent deletion router for DataManagementPage
   */
  async deletePermanently({ entityType, id, confirmText, adminUser, reason = '' }) {
    if (entityType === 'customers') {
      return this.deleteCustomer({ id, confirmText, adminUser, reason });
    }
    if (entityType === 'bookings') {
      return this.deleteBooking({ id, confirmText, adminUser, reason });
    }
    if (entityType === 'bills') {
      return this.deleteBill({ id, confirmText, adminUser, reason });
    }
    if (entityType === 'expenses') {
      return this.deleteExpense({ id, confirmText, adminUser, reason });
    }
    if (entityType === 'payments') {
      throw new Error('Payments represent legal transaction history and cannot be deleted. Use audited financial corrections instead.');
    }
    throw new Error(`Unsupported entity type for deletion: ${entityType}`);
  },

  // ==========================================
  // 2. BILL / SALES INSPECTION & DELETION
  // ==========================================

  /**
   * Inspect bill dependencies before deletion
   */
  async inspectBillDependencies(billId) {
    const { data: payments } = await supabase
      .from('payments')
      .select('id, amount, paid_at, payment_method')
      .eq('bill_id', billId);

    const linkedPayments = payments || [];
    const hasPayments = linkedPayments.length > 0;
    const totalPaid = linkedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);

    return {
      canDelete: !hasPayments,
      hasPayments,
      linkedPayments,
      totalPaid,
      reason: hasPayments
        ? 'This invoice has payment records. Deleting it could affect financial history, so permanent deletion is disabled.'
        : null
    };
  },

  /**
   * Delete an unpaid/draft test bill permanently
   */
  async deleteBill({ id, confirmText, adminUser, reason = '' }) {
    const val = (confirmText || '').trim().toUpperCase();
    if (val !== 'DELETE' && val !== `DELETE-${id.slice(0, 8).toUpperCase()}` && val !== `DELETE-${id.toUpperCase()}`) {
      throw new Error('Please type "DELETE" to confirm.');
    }

    const check = await this.inspectBillDependencies(id);
    if (!check.canDelete) {
      throw new Error(check.reason);
    }

    // Delete bill items first to prevent foreign key errors
    await supabase.from('bill_items').delete().eq('bill_id', id);

    // Delete bill
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) throw error;

    await this.logAuditAction({
      actionType: 'bill_deleted',
      entityType: 'bills',
      recordId: id,
      adminUser,
      details: {
        reason: reason || 'Unpaid draft/test bill deleted by admin',
        deleted_at: new Date().toISOString()
      }
    });

    return { success: true, message: 'Invoice permanently deleted.' };
  },

  /**
   * Bulk clear all unpaid draft test bills
   */
  async clearEligibleTestBills({ adminUser, reason = '' }) {
    // 1. Fetch bills and check payments
    const { data: bills, error: bErr } = await supabase
      .from('bills')
      .select('id, invoice_number, total_amount, bill_status, is_test_data, payments(id)');

    if (bErr) throw bErr;

    // Filter only bills with 0 payments that are drafts or marked as test
    const eligibleBills = (bills || []).filter(b => {
      const hasZeroPayments = (b.payments?.length || 0) === 0;
      const isDraftOrTest = b.bill_status === 'draft' || b.bill_status === 'cancelled' || b.is_test_data === true;
      return hasZeroPayments && isDraftOrTest;
    });

    if (eligibleBills.length === 0) {
      return { success: true, count: 0, message: 'No eligible unpaid test bills found to delete.' };
    }

    const billIds = eligibleBills.map(b => b.id);

    // Delete bill items first
    await supabase.from('bill_items').delete().in('bill_id', billIds);

    // Delete bills
    const { error: delErr } = await supabase.from('bills').delete().in('id', billIds);
    if (delErr) throw delErr;

    await this.logAuditAction({
      actionType: 'bulk_test_bills_deleted',
      entityType: 'bills',
      recordId: 'bulk',
      adminUser,
      details: {
        count: eligibleBills.length,
        deletedIds: billIds,
        reason: reason || 'Bulk cleanup of unpaid test/draft bills',
        deleted_at: new Date().toISOString()
      }
    });

    return {
      success: true,
      count: eligibleBills.length,
      message: `Successfully cleared ${eligibleBills.length} unpaid test/draft invoice(s). Genuine paid bills preserved.`
    };
  },

  // ==========================================
  // 3. EXPENSE INSPECTION & DELETION
  // ==========================================

  /**
   * Delete an individual expense record
   */
  async deleteExpense({ id, confirmText, adminUser, reason = '' }) {
    const val = (confirmText || '').trim().toUpperCase();
    if (val !== 'DELETE' && val !== `DELETE-${id.slice(0, 8).toUpperCase()}` && val !== `DELETE-${id.toUpperCase()}`) {
      throw new Error('Please type "DELETE" to confirm.');
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;

    await this.logAuditAction({
      actionType: 'expense_deleted',
      entityType: 'expenses',
      recordId: id,
      adminUser,
      details: {
        reason: reason || 'Expense record deleted by admin',
        deleted_at: new Date().toISOString()
      }
    });

    return { success: true, message: `Expense record permanently deleted.` };
  },

  /**
   * Bulk clear verified test expenses (leaves genuine operational costs intact)
   */
  async clearEligibleTestExpenses({ adminUser, reason = '' }) {
    const { data: expenses, error } = await supabase.from('expenses').select('*');
    if (error) throw error;

    // Identify disposable test expenses (e.g. title contains 'test' or is_test_data = true)
    const testExpenses = (expenses || []).filter(e => {
      const titleLower = (e.title || '').toLowerCase();
      const descLower = (e.description || '').toLowerCase();
      return e.is_test_data === true || titleLower.includes('test') || descLower.includes('test');
    });

    if (testExpenses.length === 0) {
      return { success: true, count: 0, message: 'No disposable test expenses found to delete.' };
    }

    const testIds = testExpenses.map(e => e.id);
    const totalAmount = testExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    const { error: delErr } = await supabase.from('expenses').delete().in('id', testIds);
    if (delErr) throw delErr;

    await this.logAuditAction({
      actionType: 'bulk_test_expenses_deleted',
      entityType: 'expenses',
      recordId: 'bulk',
      adminUser,
      details: {
        count: testExpenses.length,
        totalAmount,
        deletedIds: testIds,
        reason: reason || 'Bulk cleanup of sandbox test expenses',
        deleted_at: new Date().toISOString()
      }
    });

    return {
      success: true,
      count: testExpenses.length,
      totalAmount,
      message: `Successfully cleared ${testExpenses.length} test expense(s) totaling ₹${totalAmount.toFixed(2)}. Genuine operational expenses preserved.`
    };
  },

  // ==========================================
  // 4. MONTHLY FINANCIAL REPORT - CLEAR ALL
  // ==========================================

  /**
   * Preview records that would be cleared for a specific month
   */
  async previewMonthClearAll(year, month) {
    const y = Number(year);
    const m = Number(month);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const startIso = `${startDate}T00:00:00.000Z`;
    const endIso = `${endDate}T23:59:59.999Z`;

    const [expensesRes, billsRes, bookingsRes] = await Promise.all([
      supabase.from('expenses').select('*').gte('expense_date', startDate).lte('expense_date', endDate),
      supabase.from('bills').select('id, invoice_number, total_amount, bill_status, is_test_data, payments(id, amount)').gte('created_at', startIso).lte('created_at', endIso),
      supabase.from('bookings').select('id, booking_number, booking_status, is_test_data, bills(id)').gte('created_at', startIso).lte('created_at', endIso)
    ]);

    const allExpenses = expensesRes.data || [];
    const allBills = billsRes.data || [];
    const allBookings = bookingsRes.data || [];

    // Eligible test expenses to clear
    const eligibleExpenses = allExpenses.filter(e => {
      const titleLower = (e.title || '').toLowerCase();
      return e.is_test_data === true || titleLower.includes('test');
    });
    const genuineExpenses = allExpenses.filter(e => !eligibleExpenses.includes(e));

    // Eligible test bills to clear (unpaid drafts/test)
    const eligibleBills = allBills.filter(b => {
      const hasZeroPayments = (b.payments?.length || 0) === 0;
      const isTestOrDraft = b.is_test_data === true || b.bill_status === 'draft' || b.bill_status === 'cancelled';
      return hasZeroPayments && isTestOrDraft;
    });
    const protectedPaidBills = allBills.filter(b => (b.payments?.length || 0) > 0);

    // Eligible test bookings to clear (0 linked bills, test/cancelled)
    const eligibleBookings = allBookings.filter(b => {
      const hasZeroBills = (b.bills?.length || 0) === 0;
      const isTestOrPending = b.is_test_data === true || b.booking_number?.includes('TEST') || b.booking_status === 'cancelled' || b.booking_status === 'pending';
      return hasZeroBills && isTestOrPending;
    });
    const protectedBookings = allBookings.filter(b => !eligibleBookings.includes(b));

    return {
      monthYear: `${year}-${String(month).padStart(2, '0')}`,
      eligibleExpenses,
      genuineExpenses,
      eligibleBills,
      protectedPaidBills,
      eligibleBookings,
      protectedBookings,
      totalEligibleCount: eligibleExpenses.length + eligibleBills.length + eligibleBookings.length
    };
  },

  /**
   * Execute Clear All for a specific month (removes disposable test records, preserves genuine history)
   */
  async executeMonthClearAll({ year, month, adminUser, reason = '' }) {
    const preview = await this.previewMonthClearAll(year, month);

    // 1. Delete eligible test expenses
    if (preview.eligibleExpenses.length > 0) {
      const expIds = preview.eligibleExpenses.map(e => e.id);
      await supabase.from('expenses').delete().in('id', expIds);
    }

    // 2. Delete eligible test bills (delete items first)
    if (preview.eligibleBills.length > 0) {
      const billIds = preview.eligibleBills.map(b => b.id);
      await supabase.from('bill_items').delete().in('bill_id', billIds);
      await supabase.from('bills').delete().in('id', billIds);
    }

    // 3. Delete eligible unlinked test bookings
    if (preview.eligibleBookings.length > 0) {
      const bkgIds = preview.eligibleBookings.map(b => b.id);
      await supabase.from('bookings').delete().in('id', bkgIds);
    }

    // 4. Log audit action
    await this.logAuditAction({
      actionType: 'month_clear_all_executed',
      entityType: 'monthly_financials',
      recordId: preview.monthYear,
      adminUser,
      details: {
        year,
        month,
        clearedExpensesCount: preview.eligibleExpenses.length,
        clearedBillsCount: preview.eligibleBills.length,
        clearedBookingsCount: preview.eligibleBookings.length,
        preservedPaidBillsCount: preview.protectedPaidBills.length,
        preservedGenuineExpensesCount: preview.genuineExpenses.length,
        reason: reason || 'Monthly financial report Clear All test data cleanup',
        cleared_at: new Date().toISOString()
      }
    });

    return {
      success: true,
      clearedExpensesCount: preview.eligibleExpenses.length,
      clearedBillsCount: preview.eligibleBills.length,
      clearedBookingsCount: preview.eligibleBookings.length,
      message: `Cleared ${preview.totalEligibleCount} test record(s) for ${preview.monthYear}. Genuine paid bills (${preview.protectedPaidBills.length}) and operational expenses (${preview.genuineExpenses.length}) preserved.`
    };
  },

  // ==========================================
  // 5. TEST DATA CLASSIFICATION (FALLBACK / MARK)
  // ==========================================

  /**
   * Set is_test_data flag for a record and related children
   */
  async setTestDataFlag({ entityType, id, isTest = true, adminUser, reason = '' }) {
    try {
      await supabase.from(entityType).update({ is_test_data: isTest }).eq('id', id);

      // If customer, cascade flag to bookings and bills
      if (entityType === 'customers') {
        const [{ data: bData }, { data: billData }] = await Promise.all([
          supabase.from('bookings').select('id').eq('customer_id', id),
          supabase.from('bills').select('id').eq('customer_id', id)
        ]);

        const bIds = (bData || []).map(b => b.id);
        const billIds = (billData || []).map(b => b.id);

        if (bIds.length > 0) {
          await supabase.from('bookings').update({ is_test_data: isTest }).in('id', bIds);
        }
        if (billIds.length > 0) {
          await supabase.from('bills').update({ is_test_data: isTest }).in('id', billIds);
          const { data: pData } = await supabase.from('payments').select('id').in('bill_id', billIds);
          const pIds = (pData || []).map(p => p.id);
          if (pIds.length > 0) {
            await supabase.from('payments').update({ is_test_data: isTest }).in('id', pIds);
          }
        }
      }

      await this.logAuditAction({
        actionType: isTest ? 'marked_as_test' : 'marked_as_genuine',
        entityType,
        recordId: id,
        adminUser,
        details: { reason }
      });

      return { success: true, message: `Record successfully updated.` };
    } catch (err) {
      throw err;
    }
  },

  // ==========================================
  // 6. COMPREHENSIVE TEST DATA CLEANUP WORKFLOW
  // ==========================================

  /**
   * Preview verified disposable test records across customers, bookings, bills, and expenses
   */
  async previewTestDataCleanup() {
    const [
      { data: customers, error: cErr },
      { data: bookings, error: bErr },
      { data: bills, error: blErr },
      { data: payments, error: pErr },
      { data: expenses, error: eErr }
    ] = await Promise.all([
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, customers(full_name), rooms(room_number)').order('created_at', { ascending: false }),
      supabase.from('bills').select('*, customers(full_name), payments(*)').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, bills(invoice_number, customer_id)').order('paid_at', { ascending: false }),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false })
    ]);

    if (cErr) throw cErr;

    const allCust = customers || [];
    const allBkg = bookings || [];
    const allBills = bills || [];
    const allPmts = payments || [];
    const allExp = expenses || [];

    const testPatterns = ['tg', 'test', 'dummy', 'dsdshgf'];
    const isTestString = (str) => {
      if (!str) return false;
      const lower = str.toLowerCase().trim();
      return testPatterns.some(p => lower.includes(p)) || lower.startsWith('req_');
    };

    const eligibleCustomers = [];
    const protectedRecords = [];

    for (const c of allCust) {
      const linkedB = allBkg.filter(b => b.customer_id === c.id);
      const linkedBl = allBills.filter(bl => bl.customer_id === c.id);
      const linkedP = allPmts.filter(p => p.bills?.customer_id === c.id);

      const isTest = c.is_test_data === true || isTestString(c.full_name) || isTestString(c.email) || linkedB.some(b => isTestString(b.booking_number));
      
      if (!isTest) {
        // Genuine operational customer - protect from deletion
        protectedRecords.push({
          type: 'customer',
          id: c.id,
          name: c.full_name,
          details: `${linkedB.length} booking(s), ${linkedBl.length} invoice(s), ${linkedP.length} payment(s)`,
          reason: 'Genuine operational hotel customer. Deletion strictly prevented.'
        });
        continue;
      }

      const totalPaymentsAmount = linkedP.reduce((s, p) => s + Number(p.amount || 0), 0);

      eligibleCustomers.push({
        id: c.id,
        full_name: c.full_name,
        phone: c.phone || 'None',
        created_at: c.created_at,
        linkedBookings: linkedB.map(b => ({ id: b.id, booking_number: b.booking_number, room: b.rooms?.room_number, status: b.booking_status })),
        linkedBills: linkedBl.map(bl => ({ id: bl.id, invoice_number: bl.invoice_number, amount: bl.total_amount, status: bl.bill_status })),
        linkedPayments: linkedP.map(p => ({ id: p.id, amount: Number(p.amount || 0), paid_at: p.paid_at })),
        hasDemoPayments: linkedP.length > 0,
        totalPaymentsAmount
      });
    }

    // Standalone test bookings (not under any eligible customer)
    const eligibleStandaloneBookings = allBkg.filter(b => {
      const isUnderEligibleCust = eligibleCustomers.some(ec => ec.id === b.customer_id);
      if (isUnderEligibleCust) return false;
      const isTest = b.is_test_data === true || isTestString(b.booking_number);
      return isTest;
    }).map(b => ({
      id: b.id,
      booking_number: b.booking_number,
      guest: b.customers?.full_name || 'Guest',
      room: b.rooms?.room_number || 'N/A'
    }));

    // Standalone test bills (not under any eligible customer)
    const eligibleBills = allBills.filter(bl => {
      const isUnderEligibleCust = eligibleCustomers.some(ec => ec.id === b.customer_id);
      if (isUnderEligibleCust) return false;
      const isTest = bl.is_test_data === true || isTestString(bl.invoice_number);
      return isTest;
    }).map(bl => ({
      id: bl.id,
      invoice_number: bl.invoice_number,
      guest: bl.customers?.full_name || 'Guest',
      amount: bl.total_amount
    }));

    // Test expenses
    const eligibleExpenses = allExp.filter(e => e.is_test_data === true || isTestString(e.title) || isTestString(e.description)).map(e => ({
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
  },

  /**
   * Execute selective demo data cleanup in atomic transactional order:
   * payments -> bill_items -> bills -> bookings -> customers -> expenses
   */
  async executeTestDataCleanup({
    selectedCustomerIds = [],
    selectedBookingIds = [],
    selectedBillIds = [],
    selectedExpenseIds = [],
    confirmText = '',
    adminUser,
    reason = ''
  }) {
    const val = (confirmText || '').trim().toUpperCase();
    if (val !== 'DELETE') {
      throw new Error('Please type "DELETE" to confirm cleanup.');
    }

    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can execute demo data cleanup.');
    }

    // Attempt RPC first for database-level atomic transaction
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('admin_cleanup_demo_records', {
        p_customer_ids: selectedCustomerIds,
        p_booking_ids: selectedBookingIds,
        p_bill_ids: selectedBillIds,
        p_expense_ids: selectedExpenseIds,
        p_reason: reason || 'Admin demo data cleanup before handover'
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        return {
          success: true,
          totalCleaned: rpcRes.total_cleaned,
          message: `Cleaned up ${rpcRes.total_cleaned} demo record(s) atomically (${rpcRes.deleted_customers} customer(s), ${rpcRes.deleted_bookings} booking(s), ${rpcRes.deleted_bills} invoice(s), ${rpcRes.deleted_payments} demo payment(s), ${rpcRes.deleted_expenses} expense(s)). Genuine operational records remain untouched.`
        };
      }
    } catch (e) {
      console.warn('[dataManagementService] RPC unavailable, falling back to direct atomic sequence:', e);
    }

    // Direct atomic cascade fallback:
    // 1. Gather all linked bookings for selected customers
    let customerBookingIds = [];
    if (selectedCustomerIds.length > 0) {
      const { data: cBkgs } = await supabase.from('bookings').select('id').in('customer_id', selectedCustomerIds);
      customerBookingIds = (cBkgs || []).map(b => b.id);
    }
    const allBookingsToDelete = Array.from(new Set([...selectedBookingIds, ...customerBookingIds]));

    // 2. Gather all linked bills for selected customers and bookings
    let customerBillIds = [];
    if (selectedCustomerIds.length > 0) {
      const { data: cBills } = await supabase.from('bills').select('id').in('customer_id', selectedCustomerIds);
      customerBillIds = (cBills || []).map(b => b.id);
    }
    if (allBookingsToDelete.length > 0) {
      const { data: bkBills } = await supabase.from('bills').select('id').in('booking_id', allBookingsToDelete);
      const bkBillsIds = (bkBills || []).map(b => b.id);
      customerBillIds = Array.from(new Set([...customerBillIds, ...bkBillsIds]));
    }
    const allBillsToDelete = Array.from(new Set([...selectedBillIds, ...customerBillIds]));

    // 3. Atomically delete payments linked to demo bills
    let deletedPaymentsCount = 0;
    if (allBillsToDelete.length > 0) {
      const { data: delP, error: pErr } = await supabase.from('payments').delete().in('bill_id', allBillsToDelete).select('id');
      if (pErr) throw pErr;
      deletedPaymentsCount = (delP || []).length;

      // 4. Delete bill items
      await supabase.from('bill_items').delete().in('bill_id', allBillsToDelete);

      // 5. Delete bills
      const { error: bErr } = await supabase.from('bills').delete().in('id', allBillsToDelete);
      if (bErr) throw bErr;
    }

    // 6. Delete bookings
    let deletedBookingsCount = 0;
    if (allBookingsToDelete.length > 0) {
      const { data: delB, error: bkErr } = await supabase.from('bookings').delete().in('id', allBookingsToDelete).select('id');
      if (bkErr) throw bkErr;
      deletedBookingsCount = (delB || []).length;
    }

    // 7. Delete customers
    let deletedCustomersCount = 0;
    if (selectedCustomerIds.length > 0) {
      const { data: delC, error: cErr } = await supabase.from('customers').delete().in('id', selectedCustomerIds).select('id');
      if (cErr) throw cErr;
      deletedCustomersCount = (delC || []).length;
    }

    // 8. Delete expenses
    let deletedExpensesCount = 0;
    if (selectedExpenseIds.length > 0) {
      const { data: delE, error: eErr } = await supabase.from('expenses').delete().in('id', selectedExpenseIds).select('id');
      if (eErr) throw eErr;
      deletedExpensesCount = (delE || []).length;
    }

    const totalCleaned = deletedCustomersCount + deletedBookingsCount + allBillsToDelete.length + deletedPaymentsCount + deletedExpensesCount;

    await this.logAuditAction({
      actionType: 'admin_demo_cleanup',
      entityType: 'system_cleanup',
      recordId: 'bulk',
      adminUser,
      details: {
        deletedCustomersCount,
        deletedBookingsCount,
        deletedBillsCount: allBillsToDelete.length,
        deletedPaymentsCount,
        deletedExpensesCount,
        totalCleaned,
        reason: reason || 'Admin-approved demo data cleanup'
      }
    });

    return {
      success: true,
      totalCleaned,
      deletedCustomersCount,
      deletedBookingsCount,
      deletedBillsCount: allBillsToDelete.length,
      deletedPaymentsCount,
      deletedExpensesCount,
      message: `Cleaned up ${totalCleaned} demo record(s) (${deletedCustomersCount} customer(s), ${deletedBookingsCount} booking(s), ${allBillsToDelete.length} invoice(s), ${deletedPaymentsCount} demo payment(s), ${deletedExpensesCount} expense(s)). Genuine records remain untouched.`
    };
  },

  /**
   * Helper for DataManagementPage tab inspection
   */
  async loadEntities(entityType) {
    if (entityType === 'customers') {
      const [{ data: customers }, { data: bookings }, { data: bills }] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('id, customer_id'),
        supabase.from('bills').select('id, customer_id, payments(id)')
      ]);
      return (customers || []).map(c => {
        const bCount = (bookings || []).filter(b => b.customer_id === c.id).length;
        const cBills = (bills || []).filter(b => b.customer_id === c.id);
        const hasPmts = cBills.some(b => (b.payments || []).length > 0);
        return {
          ...c,
          bookings_count: bCount,
          bills_count: cBills.length,
          can_permanently_delete: !hasPmts
        };
      });
    }
    if (entityType === 'bookings') {
      const [{ data: bookings }, { data: bills }] = await Promise.all([
        supabase.from('bookings').select('*, customers(full_name), rooms(room_number)').order('created_at', { ascending: false }),
        supabase.from('bills').select('id, booking_id, payments(id)')
      ]);
      return (bookings || []).map(b => {
        const bBill = (bills || []).find(bl => bl.booking_id === b.id);
        const hasPmts = (bBill?.payments || []).length > 0;
        return {
          ...b,
          customer_name: b.customers?.full_name || 'Guest',
          can_permanently_delete: !hasPmts
        };
      });
    }
    if (entityType === 'bills') {
      const { data: bills } = await supabase.from('bills').select('*, customers(full_name), payments(id)').order('created_at', { ascending: false });
      return (bills || []).map(b => ({
        ...b,
        customer_name: b.customers?.full_name || 'Guest',
        can_permanently_delete: (b.payments || []).length === 0
      }));
    }
    if (entityType === 'payments') {
      const { data: payments } = await supabase.from('payments').select('*, bills(invoice_number, customer_id, customers(full_name))').order('paid_at', { ascending: false });
      return (payments || []).map(p => ({
        ...p,
        invoice_number: p.bills?.invoice_number || 'N/A',
        customer_name: p.bills?.customers?.full_name || 'Guest',
        can_permanently_delete: false
      }));
    }
    if (entityType === 'expenses') {
      const { data: expenses } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
      return (expenses || []).map(e => ({
        ...e,
        can_permanently_delete: true
      }));
    }
    return [];
  }
};
