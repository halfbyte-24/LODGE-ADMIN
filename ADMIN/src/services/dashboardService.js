import { supabase } from '../lib/supabase';

export const dashboardService = {
  async getStaffDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // 1. Customers created today
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr);

    // 2. Room guests (currently checked in or booked today)
    const { count: roomGuestsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('booking_status', ['reserved', 'checked_in'])
      .gte('created_at', todayStr);

    // 3. Today's bills
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*, bill_items(*)')
      .gte('created_at', todayStr);

    let totalBills = 0;
    let totalSales = 0;
    let pendingPaymentsCount = 0;
    
    let roomRevenue = 0;
    let foodRevenue = 0;
    let drinkRevenue = 0;
    let serviceRevenue = 0;

    if (bills && !billsError) {
      totalBills = bills.length;
      bills.forEach(bill => {
        if (bill.payment_status === 'paid' || bill.payment_status === 'partially_paid') {
          totalSales += Number(bill.total_amount);
        }
        if (bill.payment_status === 'pending') {
          pendingPaymentsCount++;
        }

        // Calculate revenue splits from bill items (only for confirmed/invoiced/completed bills)
        if (bill.bill_status !== 'draft') {
            bill.bill_items.forEach(item => {
            const itemTotal = Number(item.total_price);
            if (item.item_type === 'room') roomRevenue += itemTotal;
            if (item.item_type === 'food') foodRevenue += itemTotal;
            if (item.item_type === 'drink') drinkRevenue += itemTotal;
            if (item.item_type === 'service') serviceRevenue += itemTotal;
            });
        }
      });
    }

    return {
      totalCustomers: customersCount || 0,
      roomGuests: roomGuestsCount || 0,
      restaurantOnly: (customersCount || 0) - (roomGuestsCount || 0),
      totalBills,
      totalSales,
      pendingPayments: pendingPaymentsCount,
      revenue: {
        room: roomRevenue,
        food: foodRevenue,
        drink: drinkRevenue,
        service: serviceRevenue
      },
      recentActivity: bills ? bills.slice(0, 5).map(b => ({
          time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Bill #${b.invoice_number} - ₹${b.total_amount}`
      })) : []
    };
  }
};
