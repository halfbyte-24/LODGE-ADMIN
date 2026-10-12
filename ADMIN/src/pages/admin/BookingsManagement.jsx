import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, Calendar, Users, BedDouble, CheckCircle2, Clock, 
  XCircle, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, 
  List, CalendarDays, Filter
} from 'lucide-react';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  
  // Calendar month/year navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal / Action states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignRoomId, setAssignRoomId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bkgRes, roomsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, customers(*), rooms(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('rooms')
          .select('*')
          .order('room_number', { ascending: true })
      ]);

      if (bkgRes.error) throw bkgRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setBookings(bkgRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setActionMessage({ type: 'error', text: 'Error loading bookings: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus, assignedRoom = null) => {
    setUpdating(true);
    setActionMessage({ type: '', text: '' });
    try {
      const updatePayload = {
        booking_status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (assignedRoom) {
        updatePayload.room_id = assignedRoom;
      }

      const { error: bkgErr } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (bkgErr) throw bkgErr;

      // Synchronize room occupancy
      const bkg = bookings.find(b => b.id === bookingId);
      const targetRoomId = assignedRoom || bkg?.room_id;

      if (targetRoomId) {
        if (newStatus === 'checked_in') {
          await supabase.from('rooms').update({ status: 'occupied' }).eq('id', targetRoomId);
        } else if (newStatus === 'checked_out') {
          await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', targetRoomId);
        } else if (newStatus === 'cancelled') {
          await supabase.from('rooms').update({ status: 'available' }).eq('id', targetRoomId);
        }
      }

      setActionMessage({ type: 'success', text: `Booking marked as ${newStatus} successfully.` });
      setSelectedBooking(null);
      await loadData();
    } catch (err) {
      console.error('Update failed:', err);
      setActionMessage({ type: 'error', text: 'Update failed: ' + err.message });
    } finally {
      setUpdating(false);
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().split('T')[0];
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(year, month, i);
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      days.push({ dayNumber: i, dateStr, isCurrentMonth: true });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      days.push({ dayNumber: i, dateStr, isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  // Map bookings to dates: a booking covers [check_in, check_out)
  const bookingsForDate = (dateStr) => {
    return bookings.filter(b => {
      if (b.booking_status === 'cancelled') return false;
      return dateStr >= b.check_in && dateStr < b.check_out;
    });
  };

  // Filtered bookings list for the selected calendar date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDateStr) return [];
    return bookings.filter(b => {
      const term = searchTerm.toLowerCase();
      const custName = (b.customers?.full_name || b.guest_name || '').toLowerCase();
      const custPhone = (b.customers?.phone || b.guest_phone || '');
      const roomNum = (b.rooms?.room_number || '').toString();

      const matchesSearch = !term || custName.includes(term) || custPhone.includes(term) || roomNum.includes(term);
      const isOverlapping = selectedDateStr >= b.check_in && selectedDateStr < b.check_out;
      const isCheckInDay = b.check_in === selectedDateStr;
      const isCheckOutDay = b.check_out === selectedDateStr;

      return (isOverlapping || isCheckInDay || isCheckOutDay) && matchesSearch;
    });
  }, [bookings, selectedDateStr, searchTerm]);

  // Filtered bookings for the List View
  const filteredBookingsList = useMemo(() => {
    return bookings.filter(b => {
      const custName = b.customers?.full_name || b.guest_name || '';
      const custPhone = b.customers?.phone || b.guest_phone || '';
      const bkgNo = b.booking_number || '';
      const roomNum = b.rooms?.room_number ? b.rooms.room_number.toString() : '';
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term || 
        custName.toLowerCase().includes(term) ||
        custPhone.includes(term) ||
        bkgNo.toLowerCase().includes(term) ||
        roomNum.includes(term);

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'today_checkin' && b.check_in === todayStr) ||
        (statusFilter === 'today_checkout' && b.check_out === todayStr) ||
        b.booking_status === statusFilter;

      const matchesDate = !dateFilter || b.check_in === dateFilter || b.check_out === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter, todayStr]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>Pending Request</span>;
      case 'reserved':
        return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>Reserved</span>;
      case 'checked_in':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}>Booked / Occupied</span>;
      case 'checked_out':
        return <span style={{ background: '#e2e8f0', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>Checked Out</span>;
      case 'cancelled':
        return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>Cancelled</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>{status}</span>;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Booking Calendar &amp; Reservations</h1>
          <p style={{ color: 'var(--text-muted)' }}>Admin view of monthly booking calendar across all 9 rooms.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem', display: 'flex', gap: '0.25rem' }}>
            <button 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays size={16} style={{ marginRight: '0.35rem' }} /> Calendar View
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
              onClick={() => setViewMode('list')}
            >
              <List size={16} style={{ marginRight: '0.35rem' }} /> Table View
            </button>
          </div>

          <button className="btn btn-outline" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {actionMessage.text && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          background: actionMessage.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: actionMessage.type === 'error' ? '#991b1b' : '#065f46'
        }}>
          {actionMessage.text}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              style={{ width: '100%', paddingLeft: '2.25rem' }} 
              placeholder="Search customer name, phone, room number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {viewMode === 'list' && (
            <div>
              <select 
                className="input" 
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Booking Statuses</option>
                <option value="today_checkin">Today's Check-ins</option>
                <option value="today_checkout">Today's Check-outs</option>
                <option value="reserved">Reserved</option>
                <option value="checked_in">Checked In (Occupied)</option>
                <option value="checked_out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {viewMode === 'list' && (
            <div>
              <input 
                type="date" 
                className="input" 
                style={{ width: '100%' }}
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                title="Filter by specific date"
              />
            </div>
          )}
        </div>
      </div>

      {/* CALENDAR VIEW MODE */}
      {viewMode === 'calendar' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* MONTHLY CALENDAR GRID */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                {monthNames[month]} {year}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ padding: '0.35rem 0.65rem' }} onClick={prevMonth}>
                  <ChevronLeft size={18} /> Prev
                </button>
                <button className="btn btn-outline" style={{ padding: '0.35rem 0.65rem' }} onClick={() => setCurrentDate(new Date())}>
                  Today
                </button>
                <button className="btn btn-outline" style={{ padding: '0.35rem 0.65rem' }} onClick={nextMonth}>
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calendarDays.map((cell, idx) => {
                const dayBookings = bookingsForDate(cell.dateStr);
                const hasBookings = dayBookings.length > 0;
                const isSelected = selectedDateStr === cell.dateStr;
                const isToday = cell.dateStr === todayStr;

                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    style={{
                      minHeight: '85px',
                      padding: '0.4rem',
                      background: isSelected ? '#eff6ff' : cell.isCurrentMonth ? '#ffffff' : '#f8fafc',
                      border: isSelected ? '2px solid var(--primary-color)' : isToday ? '2px solid #10b981' : '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: cell.isCurrentMonth ? 1 : 0.45
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: isToday || isSelected ? 800 : 500,
                        color: isToday ? '#10b981' : isSelected ? 'var(--primary-color)' : 'var(--text-main)'
                      }}>
                        {cell.dayNumber}
                      </span>
                      {hasBookings && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          background: '#fee2e2', 
                          color: '#b91c1c', 
                          padding: '0.1rem 0.35rem', 
                          borderRadius: '10px', 
                          fontWeight: 700 
                        }}>
                          {dayBookings.length} {dayBookings.length === 1 ? 'room' : 'rooms'}
                        </span>
                      )}
                    </div>

                    {/* Room pills */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '50px', overflow: 'hidden' }}>
                      {dayBookings.slice(0, 2).map(b => (
                        <div key={b.id} style={{ 
                          fontSize: '0.7rem', 
                          background: b.booking_status === 'checked_in' ? '#fee2e2' : '#dbeafe', 
                          color: b.booking_status === 'checked_in' ? '#991b1b' : '#1e40af',
                          padding: '0.1rem 0.3rem', 
                          borderRadius: '3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 600
                        }}>
                          Rm {b.rooms?.room_number || '?'}: {b.customers?.full_name || b.guest_name || 'Guest'}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{dayBookings.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DATE DETAILS PANEL */}
          <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  Date: {selectedDateStr}
                </h3>
                <span style={{ 
                  background: selectedDateStr === todayStr ? '#d1fae5' : '#f1f5f9',
                  color: selectedDateStr === todayStr ? '#065f46' : 'var(--text-muted)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {selectedDateStr === todayStr ? 'Today' : new Date(selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                All room bookings active on this date:
              </p>
            </div>

            {selectedDateBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.75rem auto', opacity: 0.8 }} />
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>All 9 Rooms Available</h4>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No conflicting bookings scheduled for this date.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {selectedDateBookings.map(bkg => {
                  const custName = bkg.customers?.full_name || bkg.guest_name || 'Guest';
                  const custPhone = bkg.customers?.phone || bkg.guest_phone || '—';
                  const isCheckInToday = bkg.check_in === selectedDateStr;
                  const isCheckOutToday = bkg.check_out === selectedDateStr;

                  return (
                    <div 
                      key={bkg.id} 
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        borderLeft: `4px solid ${bkg.booking_status === 'checked_in' ? '#ef4444' : '#3b82f6'}`,
                        borderRadius: '8px', 
                        padding: '1rem',
                        background: '#fafafa'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                            {bkg.rooms?.room_number ? `Room ${bkg.rooms.room_number}` : 'Unassigned Room'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            ({bkg.booking_number})
                          </span>
                        </div>
                        {getStatusBadge(bkg.booking_status)}
                      </div>

                      <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{custName}</span> • <span style={{ color: 'var(--text-muted)' }}>{custPhone}</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        <span><strong>Check In:</strong> {bkg.check_in} {isCheckInToday && <span style={{ color: '#2563eb', fontWeight: 700 }}>(Today)</span>}</span>
                        <span><strong>Check Out:</strong> {bkg.check_out} {isCheckOutToday && <span style={{ color: '#dc2626', fontWeight: 700 }}>(Departure)</span>}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                          ₹{Number(bkg.room_total || 0).toFixed(2)} ({bkg.number_of_nights || 1} Nights)
                        </span>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setSelectedBooking(bkg);
                            setAssignRoomId(bkg.room_id || '');
                          }}
                        >
                          Manage Stay
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW MODE */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1rem' }}>Booking #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Room</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Check In</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Check Out</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Guests</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookingsList.map(bkg => {
                  const custName = bkg.customers?.full_name || bkg.guest_name || 'Guest';
                  const custPhone = bkg.customers?.phone || bkg.guest_phone || '—';
                  const roomNumber = bkg.rooms?.room_number ? `Room ${bkg.rooms.room_number}` : 'Unassigned';

                  return (
                    <tr key={bkg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{bkg.booking_number}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 500 }}>{custName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{custPhone}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 600, color: bkg.rooms?.room_number ? 'var(--text-main)' : '#d97706' }}>
                          {roomNumber}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{bkg.check_in}</td>
                      <td style={{ padding: '1rem' }}>{bkg.check_out}</td>
                      <td style={{ padding: '1rem' }}>{bkg.number_of_guests}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>₹{Number(bkg.room_total || 0).toFixed(2)}</td>
                      <td style={{ padding: '1rem' }}>{getStatusBadge(bkg.booking_status)}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setSelectedBooking(bkg);
                            setAssignRoomId(bkg.room_id || '');
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANAGE BOOKING MODAL */}
      {selectedBooking && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Manage Booking {selectedBooking.booking_number}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Customer: {selectedBooking.customers?.full_name || selectedBooking.guest_name} ({selectedBooking.check_in} to {selectedBooking.check_out})
            </p>

            {/* Room Assignment */}
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Assigned Room</label>
              <select 
                className="input" 
                value={assignRoomId} 
                onChange={e => setAssignRoomId(e.target.value)}
              >
                <option value="">-- Choose Physical Room --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} ({r.floor} Floor, {r.room_type} - ₹{r.price_per_night}/nt) [{r.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedBooking.booking_status === 'pending' && (
                <button 
                  className="btn btn-primary" 
                  disabled={updating}
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'reserved', assignRoomId || null)}
                >
                  Confirm &amp; Reserve
                </button>
              )}

              {(selectedBooking.booking_status === 'reserved' || selectedBooking.booking_status === 'pending') && (
                <button 
                  className="btn btn-success" 
                  disabled={updating}
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'checked_in', assignRoomId || null)}
                >
                  Check In Guest
                </button>
              )}

              {selectedBooking.booking_status === 'checked_in' && (
                <button 
                  className="btn btn-outline" 
                  disabled={updating}
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'checked_out')}
                >
                  Check Out Guest
                </button>
              )}

              {selectedBooking.booking_status !== 'cancelled' && selectedBooking.booking_status !== 'checked_out' && (
                <button 
                  className="btn btn-outline" 
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  disabled={updating}
                  onClick={() => handleStatusUpdate(selectedBooking.id, 'cancelled')}
                >
                  Cancel Booking
                </button>
              )}
            </div>

            <button 
              className="btn btn-outline" 
              style={{ width: '100%' }} 
              onClick={() => setSelectedBooking(null)}
              disabled={updating}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
