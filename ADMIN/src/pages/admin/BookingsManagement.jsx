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
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar', 'agenda', or 'list'
  
  // Format local date YYYY-MM-DD safely without UTC timezone shift
  const formatLocalDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Calendar month/year navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(formatLocalDate(new Date()));

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
      const bkg = bookings.find(b => b.id === bookingId);

      // Overlap protection: validate before assigning a physical room
      if (assignedRoom && (newStatus === 'reserved' || newStatus === 'checked_in') && bkg) {
        const { data: conflicts, error: conflictErr } = await supabase
          .from('bookings')
          .select('id, booking_number, check_in, check_out, customers(full_name)')
          .eq('room_id', assignedRoom)
          .neq('id', bookingId)
          .not('booking_status', 'in', '("cancelled","checked_out")')
          .lt('check_in', bkg.check_out)
          .gt('check_out', bkg.check_in);
        if (conflictErr) throw conflictErr;
        if (conflicts && conflicts.length > 0) {
          const c = conflicts[0];
          setActionMessage({ type: 'error', text: `Overlap conflict: Room already booked by "${c.customers?.full_name || 'Another guest'}" (${c.booking_number}) from ${c.check_in} to ${c.check_out}. Pick a different room.` });
          setUpdating(false);
          return;
        }
      }

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

  const todayStr = formatLocalDate(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar days for current month view using local timezone formatting
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = formatLocalDate(prevDate);
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const curDate = new Date(year, month, i);
      const dateStr = formatLocalDate(curDate);
      days.push({ dayNumber: i, dateStr, isCurrentMonth: true });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = formatLocalDate(nextDate);
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

  // Distinct status badge with clear text, icon, and colors (not relying on color alone)
  const getStatusBadge = (status) => {
    const baseStyle = {
      padding: '0.2rem 0.55rem',
      borderRadius: '4px',
      fontWeight: 700,
      fontSize: '0.72rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      whiteSpace: 'nowrap'
    };

    switch (status) {
      case 'pending':
        return (
          <span style={{ ...baseStyle, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
            <Clock size={11} /> Pending
          </span>
        );
      case 'reserved':
        return (
          <span style={{ ...baseStyle, background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
            <Calendar size={11} /> Reserved
          </span>
        );
      case 'checked_in':
        return (
          <span style={{ ...baseStyle, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 800 }}>
            <BedDouble size={11} /> Occupied
          </span>
        );
      case 'checked_out':
        return (
          <span style={{ ...baseStyle, background: '#e2e8f0', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 600 }}>
            <CheckCircle2 size={11} /> Out
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ ...baseStyle, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 600 }}>
            <XCircle size={11} /> Cancel
          </span>
        );
      default:
        return (
          <span style={{ ...baseStyle, background: '#f1f5f9', color: '#475569' }}>
            {status}
          </span>
        );
    }
  };

  // Compact status label for calendar pills
  const getStatusTag = (status) => {
    if (status === 'checked_in') return 'Occ';
    if (status === 'pending') return 'Req';
    if (status === 'reserved') return 'Res';
    if (status === 'checked_out') return 'Out';
    return '';
  };

  // Render the selected-date details panel (used in both desktop sidebar and mobile below-calendar)
  const renderDateDetailsPanel = () => (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            {selectedDateStr}
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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
          Bookings active on this date:
        </p>
      </div>

      {selectedDateBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={32} style={{ color: '#10b981', margin: '0 auto 0.75rem auto', opacity: 0.8 }} />
          <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>All Rooms Available</h4>
          <p style={{ fontSize: '0.82rem', margin: 0 }}>No bookings scheduled for this date.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                  padding: '0.85rem',
                  background: '#fafafa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {bkg.rooms?.room_number ? `Room ${bkg.rooms.room_number}` : 'Unassigned'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                      ({bkg.booking_number})
                    </span>
                  </div>
                  {getStatusBadge(bkg.booking_status)}
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontWeight: 600 }}>{custName}</span> <span style={{ color: 'var(--text-muted)' }}>• {custPhone}</span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  <span><strong>In:</strong> {bkg.check_in} {isCheckInToday && <span style={{ color: '#2563eb', fontWeight: 700 }}>(Today)</span>}</span>
                  <span><strong>Out:</strong> {bkg.check_out} {isCheckOutToday && <span style={{ color: '#dc2626', fontWeight: 700 }}>(Dep.)</span>}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    ₹{Number(bkg.room_total || 0).toFixed(2)} ({bkg.number_of_nights || 1} Nts)
                  </span>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
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
  );

  return (
    <div className="bookings-page-root">
      {/* HEADER */}
      <div className="bookings-page-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Booking Calendar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>Monthly calendar with real-time room reservations.</p>
        </div>
        <div className="bookings-header-actions">
          <div className="bookings-view-toggle">
            <button 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays size={15} /> Grid
            </button>
            <button 
              className={`btn ${viewMode === 'agenda' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('agenda')}
            >
              <Calendar size={15} /> Agenda
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('list')}
            >
              <List size={15} /> Table
            </button>
          </div>

          <button className="btn btn-outline" onClick={loadData} disabled={loading} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {actionMessage.text && (
        <div style={{ 
          padding: '0.85rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          background: actionMessage.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: actionMessage.type === 'error' ? '#991b1b' : '#065f46',
          fontSize: '0.875rem'
        }}>
          {actionMessage.text}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.85rem' }}>
        <div className="bookings-search-row">
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input" 
              style={{ width: '100%', paddingLeft: '2.25rem' }} 
              placeholder="Search name, phone, room..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {viewMode === 'list' && (
            <>
              <div style={{ flex: '0 1 200px', minWidth: '140px' }}>
                <select 
                  className="input" 
                  style={{ width: '100%' }}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="today_checkin">Today's Check-ins</option>
                  <option value="today_checkout">Today's Check-outs</option>
                  <option value="reserved">Reserved</option>
                  <option value="checked_in">Occupied</option>
                  <option value="checked_out">Checked Out</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{ flex: '0 1 170px', minWidth: '130px' }}>
                <input 
                  type="date" 
                  className="input" 
                  style={{ width: '100%' }}
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  title="Filter by specific date"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* CALENDAR VIEW MODE */}
      {viewMode === 'calendar' ? (
        <div className="calendar-layout">
          {/* MONTHLY CALENDAR GRID */}
          <div className="calendar-grid-panel">
            <div className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
              {/* Month navigation */}
              <div className="calendar-nav-bar">
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  {monthNames[month]} {year}
                </h2>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.8rem' }} onClick={prevMonth}>
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.8rem' }} onClick={() => { setCurrentDate(new Date()); setSelectedDateStr(formatLocalDate(new Date())); }}>
                    Today
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.8rem' }} onClick={nextMonth}>
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="calendar-weekday-header">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i}>{d}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="calendar-days-grid">
                {calendarDays.map((cell, idx) => {
                  const dayBookings = bookingsForDate(cell.dateStr);
                  const hasBookings = dayBookings.length > 0;
                  const isSelected = selectedDateStr === cell.dateStr;
                  const isToday = cell.dateStr === todayStr;

                  return (
                    <div 
                      key={idx}
                      className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!cell.isCurrentMonth ? 'other-month' : ''}`}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                    >
                      <div className="day-cell-header">
                        <span className={`day-number ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}>
                          {cell.dayNumber}
                        </span>
                        {hasBookings && (
                          <span className="day-booking-count">
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      {/* Room pills — compact */}
                      <div className="day-cell-pills">
                        {dayBookings.slice(0, 2).map(b => {
                          const tag = getStatusTag(b.booking_status);
                          const isOccupied = b.booking_status === 'checked_in';
                          return (
                            <div 
                              key={b.id} 
                              className={`booking-pill ${isOccupied ? 'occupied' : 'reserved'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBooking(b);
                                setAssignRoomId(b.room_id || '');
                              }}
                              title={`${b.booking_number} — ${b.customers?.full_name || b.guest_name || 'Guest'} (${b.check_in} to ${b.check_out})`}
                            >
                              <span className="pill-text">
                                {tag && `[${tag}] `}Rm {b.rooms?.room_number || '?'}
                              </span>
                            </div>
                          );
                        })}
                        {dayBookings.length > 2 && (
                          <span className="pill-more">+{dayBookings.length - 2}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                Tap a date to see details. Tap a pill to manage that booking.
              </div>
            </div>
          </div>

          {/* DATE DETAILS PANEL */}
          <div className="calendar-details-panel">
            {renderDateDetailsPanel()}
          </div>
        </div>
      ) : viewMode === 'agenda' ? (
        /* RESPONSIVE AGENDA / MOBILE LIST VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Agenda ({filteredBookingsList.length})
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                  onClick={() => setStatusFilter(statusFilter === 'today_checkin' ? 'all' : 'today_checkin')}
                >
                  {statusFilter === 'today_checkin' ? 'Showing Today In' : "Today's Check-ins"}
                </button>
              </div>
            </div>
          </div>

          {filteredBookingsList.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
              <h4>No bookings found matching filters</h4>
              <p style={{ fontSize: '0.85rem' }}>Try clearing your search term or status filter.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '0.75rem' }}>
              {filteredBookingsList.map(bkg => {
                const custName = bkg.customers?.full_name || bkg.guest_name || 'Guest';
                const custPhone = bkg.customers?.phone || bkg.guest_phone || '—';
                const roomNum = bkg.rooms?.room_number ? `Room ${bkg.rooms.room_number}` : 'Unassigned';

                return (
                  <div 
                    key={bkg.id} 
                    className="card" 
                    style={{ 
                      padding: '1rem', 
                      borderLeft: `4px solid ${bkg.booking_status === 'checked_in' ? '#ef4444' : '#3b82f6'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.6rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>{roomNum}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>#{bkg.booking_number}</span>
                        </div>
                        {getStatusBadge(bkg.booking_status)}
                      </div>

                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {custName}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                        Phone: {custPhone} • {bkg.number_of_guests || 1} Guests
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div>
                          <strong>In:</strong> {bkg.check_in}
                          {bkg.check_in === todayStr && <span style={{ color: '#2563eb', fontWeight: 700 }}> (Today)</span>}
                        </div>
                        <div>
                          <strong>Out:</strong> {bkg.check_out}
                          {bkg.check_out === todayStr && <span style={{ color: '#dc2626', fontWeight: 700 }}> (Today)</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: '0.95rem' }}>
                        ₹{Number(bkg.room_total || 0).toFixed(2)} ({bkg.number_of_nights || 1} Nts)
                      </span>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
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
      ) : (
        /* TABLE LIST VIEW MODE */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem', minWidth: '700px' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Booking #</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Room</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Check In</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Check Out</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Guests</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Total</th>
                  <th style={{ padding: '0.75rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookingsList.map(bkg => {
                  const custName = bkg.customers?.full_name || bkg.guest_name || 'Guest';
                  const custPhone = bkg.customers?.phone || bkg.guest_phone || '—';
                  const roomNumber = bkg.rooms?.room_number ? `Room ${bkg.rooms.room_number}` : 'Unassigned';

                  return (
                    <tr key={bkg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{bkg.booking_number}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 500 }}>{custName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{custPhone}</div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ fontWeight: 600, color: bkg.rooms?.room_number ? 'var(--text-main)' : '#d97706' }}>
                          {roomNumber}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{bkg.check_in}</td>
                      <td style={{ padding: '0.75rem' }}>{bkg.check_out}</td>
                      <td style={{ padding: '0.75rem' }}>{bkg.number_of_guests}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹{Number(bkg.room_total || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem' }}>{getStatusBadge(bkg.booking_status)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
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
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
              Manage Booking {selectedBooking.booking_number}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Customer: {selectedBooking.customers?.full_name || selectedBooking.guest_name} ({selectedBooking.check_in} to {selectedBooking.check_out})
            </p>

            {/* Room Assignment */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
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
