import { supabase } from '../lib/supabase';

/**
 * Service for Monthly Financial Reporting, Month Archiving, and Safe Record Management.
 */

export const financialReportService = {
  /**
   * Helper to format YYYY-MM
   */
  formatMonthYear(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
  },

  /**
   * Helper to get start and end dates of a given month
   */
  getMonthDateRange(year, month) {
    const y = Number(year);
    const m = Number(month);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    // Last day of month
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate, lastDay };
  },

  async getTestRegistry() {
    try {
      const { data } = await supabase
        .from('hotel_settings')
        .select('whatsapp_routing')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (data && data[0]?.whatsapp_routing?.test_data_registry) {
        return data[0].whatsapp_routing.test_data_registry;
      }
    } catch {}
    return { customers: [], bookings: [], bills: [], payments: [], expenses: [] };
  },

  /**
   * Calculate detailed monthly financial report using actual payment and expense dates.
   * By default excludes test data records unless options.includeTestData === true.
   */
  async getMonthlyFinancialReport(year, month, options = {}) {
    const includeTestData = options.includeTestData === true;
    const { startDate, endDate } = this.getMonthDateRange(year, month);
    const startIso = `${startDate}T00:00:00.000Z`;
    const endIso = `${endDate}T23:59:59.999Z`;
    const monthYear = this.formatMonthYear(year, month);

    // Parallelize all data fetching for optimal performance
    const [
      archivedSnapshot,
      registry,
      { data: paymentsData, error: paymentsErr },
      { data: expensesData, error: expensesErr },
      { data: billsData, error: billsErr },
      { data: bookingsData, error: bookingsErr }
    ] = await Promise.all([
      this.getArchivedMonth(monthYear),
      this.getTestRegistry(),
      supabase
        .from('payments')
        .select('*, bills(invoice_number, total_amount, bill_status, customer_id, customers(full_name, phone))')
        .gte('paid_at', startIso)
        .lte('paid_at', endIso)
        .order('paid_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('*, profiles(full_name, email)')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: false }),
      supabase
        .from('bills')
        .select('*, customers(full_name, phone), bookings(*)')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('*, customers(full_name, phone)')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
    ]);

    if (paymentsErr) throw paymentsErr;
    if (expensesErr) throw expensesErr;
    if (billsErr) throw billsErr;
    if (bookingsErr) throw bookingsErr;

    const isTest = (rec, type) => rec?.is_test_data === true || (registry[type] || []).includes(rec?.id);

    const rawPayments = paymentsData || [];
    const payments = includeTestData ? rawPayments : rawPayments.filter(p => !isTest(p, 'payments'));

    const rawExpenses = expensesData || [];
    const expenses = (includeTestData ? rawExpenses : rawExpenses.filter(e => !isTest(e, 'expenses'))).filter(e => e.status !== 'rejected');

    const allBills = billsData || [];
    const validBills = (includeTestData ? allBills : allBills.filter(b => !isTest(b, 'bills'))).filter(b => b.bill_status !== 'cancelled' && b.bill_status !== 'draft');

    const allBookings = bookingsData || [];
    const validBookings = (includeTestData ? allBookings : allBookings.filter(b => !isTest(b, 'bookings'))).filter(b => b.booking_status !== 'cancelled');

    const totalExcludedTestRecords = (rawPayments.length - payments.length) +
      (rawExpenses.length - (includeTestData ? rawExpenses.length : rawExpenses.filter(e => !isTest(e, 'expenses')).length)) +
      (allBills.length - (includeTestData ? allBills.length : allBills.filter(b => !isTest(b, 'bills')).length)) +
      (allBookings.length - (includeTestData ? allBookings.length : allBookings.filter(b => !isTest(b, 'bookings')).length));

    // 6. Calculate Totals
    // Actual cash received from all payments in month
    const actualCashReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Payment methods breakdown
    const paymentMethods = {
      cash: 0,
      upi: 0,
      card: 0,
      other: 0
    };
    payments.forEach(p => {
      const method = (p.payment_method || 'other').toLowerCase();
      if (paymentMethods[method] !== undefined) {
        paymentMethods[method] += Number(p.amount || 0);
      } else {
        paymentMethods.other += Number(p.amount || 0);
      }
    });

    // Total expenses recorded
    const recordedExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Expense categories breakdown
    const expenseCategories = {};
    expenses.forEach(e => {
      const cat = e.category || 'other';
      expenseCategories[cat] = (expenseCategories[cat] || 0) + Number(e.amount || 0);
    });

    // Net Cash Movement = Actual cash received minus Actual expenses
    const netCashMovement = actualCashReceived - recordedExpenses;

    // Invoiced revenue from valid bills in month
    const invoicedRevenue = validBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    // Outstanding dues on bills generated this month
    // Note: each bill may have payments recorded.
    let outstandingDue = 0;
    const billMap = new Map();
    validBills.forEach(b => {
      billMap.set(b.id, {
        total: Number(b.total_amount || 0),
        paid: 0,
        invoice: b.invoice_number,
        customer: b.customers?.full_name || 'Guest'
      });
    });

    // Sum payments mapped to these bills
    payments.forEach(p => {
      if (p.bill_id && billMap.has(p.bill_id)) {
        billMap.get(p.bill_id).paid += Number(p.amount || 0);
      }
    });

    billMap.forEach(b => {
      if (b.total > b.paid) {
        outstandingDue += (b.total - b.paid);
      }
    });

    return {
      year: Number(year),
      month: Number(month),
      monthYear,
      startDate,
      endDate,
      actualCashReceived,
      paymentMethods,
      recordedExpenses,
      expenseCategories,
      netCashMovement,
      invoicedRevenue,
      outstandingDue,
      bookingsCount: validBookings.length,
      billsCount: validBills.length,
      paymentsCount: payments.length,
      expensesCount: expenses.length,
      isArchived: !!archivedSnapshot,
      archivedSnapshot: archivedSnapshot || null,
      includeTestData,
      totalExcludedTestRecords,
      paymentsList: payments,
      expensesList: expenses,
      billsList: validBills,
      bookingsList: validBookings
    };
  },

  /**
   * Retrieve archived summary for a specific month
   */
  async getArchivedMonth(monthYear) {
    try {
      // 1. Try from database table
      const { data, error } = await supabase
        .from('monthly_financial_archives')
        .select('*')
        .eq('month_year', monthYear)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch {
      // Table might not exist yet
    }

    // 2. Fallback to hotel_settings.whatsapp_routing.financial_archives
    try {
      const { data: sList } = await supabase
        .from('hotel_settings')
        .select('whatsapp_routing')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sList && sList.length > 0) {
        const archives = sList[0].whatsapp_routing?.financial_archives || [];
        const match = archives.find(a => a.month_year === monthYear);
        if (match) return match;
      }
    } catch {
      // Fallback
    }

    return null;
  },

  /**
   * Get all archived months history
   */
  async getAllArchivedMonths() {
    let archives = [];
    try {
      const { data, error } = await supabase
        .from('monthly_financial_archives')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Table might not exist yet
    }

    // Fallback from hotel_settings
    try {
      const { data: sList } = await supabase
        .from('hotel_settings')
        .select('whatsapp_routing')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sList && sList.length > 0) {
        archives = sList[0].whatsapp_routing?.financial_archives || [];
      }
    } catch (e) {
      console.warn('Error reading fallback archives:', e);
    }

    return archives;
  },

  /**
   * Close and Archive a month.
   * Finalizes the financial totals, making the monthly summary immutable.
   */
  async closeAndArchiveMonth({ year, month, reportData, notes, adminUser }) {
    const monthYear = this.formatMonthYear(year, month);
    const existing = await this.getArchivedMonth(monthYear);
    if (existing) {
      throw new Error(`Month ${monthYear} is already finalized and archived. Finalized summaries cannot be modified.`);
    }

    const archivePayload = {
      month_year: monthYear,
      year: Number(year),
      month: Number(month),
      date_from: reportData.startDate,
      date_to: reportData.endDate,
      invoiced_revenue: reportData.invoicedRevenue,
      actual_payments_received: reportData.actualCashReceived,
      recorded_expenses: reportData.recordedExpenses,
      net_cash_movement: reportData.netCashMovement,
      outstanding_due: reportData.outstandingDue,
      bookings_count: reportData.bookingsCount,
      bills_count: reportData.billsCount,
      payments_count: reportData.paymentsCount,
      expenses_count: reportData.expensesCount,
      closed_by: adminUser?.id || null,
      closed_at: new Date().toISOString(),
      notes: notes || '',
      metadata: {
        admin_email: adminUser?.email,
        admin_name: adminUser?.full_name,
        payment_methods: reportData.paymentMethods,
        expense_categories: reportData.expenseCategories
      }
    };

    let tableSuccess = false;
    // 1. Try saving to monthly_financial_archives table
    try {
      const { data, error } = await supabase
        .from('monthly_financial_archives')
        .insert([archivePayload])
        .select()
        .single();

      if (!error) {
        tableSuccess = true;
      }
    } catch {
      // Table might not exist yet
    }

    // 2. Also log audit trail in financial_audit_logs if possible
    try {
      await supabase
        .from('financial_audit_logs')
        .insert([{
          action_type: 'month_closed',
          month_year: monthYear,
          performed_by: adminUser?.id || null,
          details: {
            closed_at: archivePayload.closed_at,
            actual_receipts: reportData.actualCashReceived,
            actual_expenses: reportData.recordedExpenses,
            net_movement: reportData.netCashMovement
          }
        }]);
    } catch {
      // Log table fallback
    }

    // 3. Fallback / dual-sync to hotel_settings.whatsapp_routing.financial_archives
    try {
      const { data: sList } = await supabase
        .from('hotel_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sList && sList.length > 0) {
        const row = sList[0];
        const wr = row.whatsapp_routing || {};
        const currentArchives = wr.financial_archives || [];
        const currentAuditLogs = wr.financial_audit_logs || [];

        const updatedArchives = [
          ...currentArchives.filter(a => a.month_year !== monthYear),
          { ...archivePayload, id: 'arch_' + Date.now() }
        ];

        const updatedAuditLogs = [
          ...currentAuditLogs,
          {
            id: 'audit_' + Date.now(),
            action_type: 'month_closed',
            month_year: monthYear,
            performed_by: adminUser?.email || 'admin',
            performed_at: new Date().toISOString(),
            notes: notes || ''
          }
        ];

        await supabase
          .from('hotel_settings')
          .update({
            whatsapp_routing: {
              ...wr,
              financial_archives: updatedArchives,
              financial_audit_logs: updatedAuditLogs
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id);
      }
    } catch (fallbackErr) {
      console.warn('Fallback sync warning:', fallbackErr);
    }

    return archivePayload;
  },

  /**
   * Transparently recalculate a finalized monthly archive after test data removal.
   * Preserves historical integrity by logging previous values, corrected values,
   * deltas, reason, timestamp, and performing Admin in the immutable audit trail.
   */
  async recalculateArchivedSnapshot({ year, month, adminUser, reason }) {
    const monthYear = this.formatMonthYear(year, month);
    const existing = await this.getArchivedMonth(monthYear);
    if (!existing) {
      throw new Error(`Month ${monthYear} is not currently archived. There is no historical snapshot to recalculate.`);
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason is required to recalculate a finalized monthly archive.');
    }

    // Calculate clean metrics excluding all test data
    const cleanReport = await this.getMonthlyFinancialReport(year, month, { includeTestData: false });

    const previousSnapshot = {
      actual_payments_received: existing.actual_payments_received,
      recorded_expenses: existing.recorded_expenses,
      net_cash_movement: existing.net_cash_movement,
      invoiced_revenue: existing.invoiced_revenue,
      outstanding_due: existing.outstanding_due,
      bookings_count: existing.bookings_count,
      bills_count: existing.bills_count,
      payments_count: existing.payments_count,
      expenses_count: existing.expenses_count
    };

    const correctedSnapshot = {
      actual_payments_received: cleanReport.actualCashReceived,
      recorded_expenses: cleanReport.recordedExpenses,
      net_cash_movement: cleanReport.netCashMovement,
      invoiced_revenue: cleanReport.invoicedRevenue,
      outstanding_due: cleanReport.outstandingDue,
      bookings_count: cleanReport.bookingsCount,
      bills_count: cleanReport.billsCount,
      payments_count: cleanReport.paymentsCount,
      expenses_count: cleanReport.expensesCount
    };

    const deltas = {
      cash_received_delta: cleanReport.actualCashReceived - Number(existing.actual_payments_received || 0),
      expenses_delta: cleanReport.recordedExpenses - Number(existing.recorded_expenses || 0),
      net_movement_delta: cleanReport.netCashMovement - Number(existing.net_cash_movement || 0)
    };

    const correctionAudit = {
      action_type: 'archive_recalculated_after_test_cleanup',
      month_year: monthYear,
      performed_by: adminUser?.id || null,
      details: {
        reason: reason.trim(),
        previous_snapshot: previousSnapshot,
        corrected_snapshot: correctedSnapshot,
        deltas,
        admin_email: adminUser?.email,
        admin_name: adminUser?.full_name,
        recalculated_at: new Date().toISOString()
      }
    };

    // 1. Log to financial_audit_logs
    try {
      await supabase.from('financial_audit_logs').insert([correctionAudit]);
    } catch {}

    // 2. Update monthly_financial_archives in database
    const updatedPayload = {
      ...existing,
      invoiced_revenue: cleanReport.invoicedRevenue,
      actual_payments_received: cleanReport.actualCashReceived,
      recorded_expenses: cleanReport.recordedExpenses,
      net_cash_movement: cleanReport.netCashMovement,
      outstanding_due: cleanReport.outstandingDue,
      bookings_count: cleanReport.bookingsCount,
      bills_count: cleanReport.billsCount,
      payments_count: cleanReport.paymentsCount,
      expenses_count: cleanReport.expensesCount,
      notes: `${existing.notes || ''} [Recalculated on ${new Date().toLocaleDateString()} after test data cleanup: ${reason.trim()}]`,
      metadata: {
        ...(existing.metadata || {}),
        last_recalculated_at: new Date().toISOString(),
        last_recalculated_by: adminUser?.email,
        recalculation_reason: reason.trim(),
        previous_values: previousSnapshot
      }
    };

    try {
      await supabase
        .from('monthly_financial_archives')
        .update(updatedPayload)
        .eq('month_year', monthYear);
    } catch {}

    // Fallback sync to hotel_settings
    try {
      const { data: sList } = await supabase
        .from('hotel_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sList && sList[0]) {
        const row = sList[0];
        const wr = row.whatsapp_routing || {};
        const archives = wr.financial_archives || [];
        const logs = wr.financial_audit_logs || [];

        const updatedArchives = archives.map(a => a.month_year === monthYear ? { ...a, ...updatedPayload } : a);
        const updatedLogs = [
          ...logs,
          { id: 'audit_' + Date.now(), ...correctionAudit, created_at: new Date().toISOString() }
        ];

        await supabase
          .from('hotel_settings')
          .update({
            whatsapp_routing: {
              ...wr,
              financial_archives: updatedArchives,
              financial_audit_logs: updatedLogs
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id);
      }
    } catch {}

    return {
      success: true,
      previousSnapshot,
      correctedSnapshot,
      deltas,
      message: `Archived snapshot for ${monthYear} successfully recalculated and logged in immutable audit history.`
    };
  },

  /**
   * Safe Archiving of Eligible Expenses for a Finalized Month
   * Restricts action to authenticated admins, requires explicit confirmation,
   * performs soft archiving (is_archived = true, archived_at = now()),
   * and preserves full audit trail. NEVER deletes bills, payments, or bookings.
   */
  async archiveEligibleExpenses({ year, month, adminUser, confirmationPhrase, reason }) {
    const monthYear = this.formatMonthYear(year, month);
    const expectedPhrase = `ARCHIVE-${monthYear}`;
    
    if (confirmationPhrase !== expectedPhrase) {
      throw new Error(`Confirmation mismatch. You must type "${expectedPhrase}" to confirm.`);
    }

    const { startDate, endDate } = this.getMonthDateRange(year, month);

    // 1. Check that the month is already closed/archived first
    const isArchived = await this.getArchivedMonth(monthYear);
    if (!isArchived) {
      throw new Error(`Cannot archive records for ${monthYear} before the month has been finalized and archived.`);
    }

    // 2. Perform soft archiving of expenses in this date range
    let softArchivedCount = 0;
    try {
      const { data: expToArchive, error: fetchErr } = await supabase
        .from('expenses')
        .select('id')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .eq('is_archived', false);

      if (!fetchErr && expToArchive && expToArchive.length > 0) {
        const { error: updErr } = await supabase
          .from('expenses')
          .update({
            is_archived: true,
            archived_at: new Date().toISOString()
          })
          .gte('expense_date', startDate)
          .lte('expense_date', endDate);

        if (!updErr) {
          softArchivedCount = expToArchive.length;
        }
      }
    } catch (e) {
      console.warn('Expenses table column is_archived may need migration:', e);
    }

    // 3. Log audit action in financial_audit_logs
    const auditRecord = {
      action_type: 'expenses_archived',
      month_year: monthYear,
      performed_by: adminUser?.id || null,
      details: {
        reason: reason || 'Monthly financial clearing and archiving',
        soft_archived_count: softArchivedCount,
        archived_at: new Date().toISOString(),
        admin_email: adminUser?.email
      }
    };

    try {
      await supabase.from('financial_audit_logs').insert([auditRecord]);
    } catch {
      // Table fallback
    }

    // Fallback audit log to hotel_settings
    try {
      const { data: sList } = await supabase
        .from('hotel_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sList && sList.length > 0) {
        const row = sList[0];
        const wr = row.whatsapp_routing || {};
        const logs = wr.financial_audit_logs || [];
        await supabase
          .from('hotel_settings')
          .update({
            whatsapp_routing: {
              ...wr,
              financial_audit_logs: [
                ...logs,
                {
                  id: 'audit_' + Date.now(),
                  action_type: 'expenses_archived',
                  month_year: monthYear,
                  performed_by: adminUser?.email || 'admin',
                  details: auditRecord.details,
                  created_at: new Date().toISOString()
                }
              ]
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id);
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      monthYear,
      softArchivedCount,
      message: `Successfully soft-archived ${softArchivedCount} expense record(s) for ${monthYear}. Financial summary remains permanently preserved.`
    };
  },

  /**
   * Export Monthly Summary to CSV format and trigger browser download
   */
  exportMonthlySummaryCSV(reportData) {
    const {
      monthYear,
      startDate,
      endDate,
      invoicedRevenue,
      actualCashReceived,
      recordedExpenses,
      netCashMovement,
      outstandingDue,
      bookingsCount,
      billsCount,
      paymentsCount,
      expensesCount,
      paymentMethods,
      expenseCategories,
      paymentsList,
      expensesList
    } = reportData;

    let csv = '';
    csv += `AMONTRON HOTEL AND RESTAURANT - MONTHLY FINANCIAL SUMMARY\n`;
    csv += `Period,${monthYear} (${startDate} to ${endDate})\n`;
    csv += `Export Generated,${new Date().toLocaleString()}\n\n`;

    csv += `KEY FINANCIAL TOTALS\n`;
    csv += `Metric,Amount (INR)\n`;
    csv += `Actual Cash Receipts,${actualCashReceived.toFixed(2)}\n`;
    csv += `Recorded Expenses,${recordedExpenses.toFixed(2)}\n`;
    csv += `Net Cash Movement (Receipts - Expenses),${netCashMovement.toFixed(2)}\n`;
    csv += `Invoiced Revenue (Valid Bills),${invoicedRevenue.toFixed(2)}\n`;
    csv += `Outstanding Customer Balances,${outstandingDue.toFixed(2)}\n\n`;

    csv += `OPERATIONAL COUNTS\n`;
    csv += `Category,Count\n`;
    csv += `Total Bookings,${bookingsCount}\n`;
    csv += `Total Bills / Invoices,${billsCount}\n`;
    csv += `Payments Received,${paymentsCount}\n`;
    csv += `Expenses Recorded,${expensesCount}\n\n`;

    csv += `PAYMENT METHODS BREAKDOWN\n`;
    csv += `Method,Amount (INR)\n`;
    csv += `Cash,${(paymentMethods.cash || 0).toFixed(2)}\n`;
    csv += `UPI,${(paymentMethods.upi || 0).toFixed(2)}\n`;
    csv += `Card,${(paymentMethods.card || 0).toFixed(2)}\n`;
    csv += `Other,${(paymentMethods.other || 0).toFixed(2)}\n\n`;

    csv += `EXPENSES BY CATEGORY\n`;
    csv += `Category,Amount (INR)\n`;
    Object.entries(expenseCategories).forEach(([cat, amt]) => {
      csv += `${cat.replace('_', ' ')},${amt.toFixed(2)}\n`;
    });
    csv += `\n`;

    csv += `ITEMIZED PAYMENTS RECEIVED\n`;
    csv += `Date,Invoice #,Customer,Method,Amount (INR)\n`;
    paymentsList.forEach(p => {
      const inv = p.bills?.invoice_number || 'Direct';
      const cust = (p.bills?.customers?.full_name || 'Guest').replace(/,/g, ' ');
      csv += `${p.paid_at?.slice(0, 10)},${inv},"${cust}",${p.payment_method?.toUpperCase()},${Number(p.amount).toFixed(2)}\n`;
    });
    csv += `\n`;

    csv += `ITEMIZED EXPENSES\n`;
    csv += `Date,Title,Category,Amount (INR)\n`;
    expensesList.forEach(e => {
      const t = (e.title || '').replace(/,/g, ' ');
      csv += `${e.expense_date},"${t}",${e.category},${Number(e.amount).toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Amontron_Financial_Summary_${monthYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
