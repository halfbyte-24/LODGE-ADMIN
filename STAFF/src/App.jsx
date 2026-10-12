import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import NewCustomer from './pages/staff/NewCustomer';
import RoomBooking from './pages/staff/RoomBooking';
import BillingIndex from './pages/staff/BillingIndex';
import BillingWorkspace from './pages/staff/BillingWorkspace';
import InvoiceView from './pages/staff/InvoiceView';
import PaymentScreen from './pages/staff/PaymentScreen';
import BookingsManagement from './pages/staff/BookingsManagement';
import ExpensesPage from './pages/staff/ExpensesPage';
import RoomsManagement from './pages/staff/RoomsManagement';
import BillHistoryPage from './pages/staff/BillHistoryPage';

// Icons
import { LayoutDashboard, Users, BedDouble, Receipt, Settings, LogOut, DollarSign, CalendarCheck } from 'lucide-react';

const StaffSidebar = () => {
  const location = useLocation();
  const { logout, profile } = useAuth();
  
  const menu = [
    { name: 'Dashboard', path: '/staff/dashboard', icon: <LayoutDashboard size={20}/> },
    { name: 'Bookings', path: '/staff/bookings', icon: <CalendarCheck size={20}/> },
    { name: 'New Customer', path: '/staff/new-customer', icon: <Users size={20}/> },
    { name: 'Billing', path: '/staff/billing', icon: <Receipt size={20}/> },
    { name: 'Rooms', path: '/staff/rooms', icon: <BedDouble size={20}/> },
    { name: 'Bill History', path: '/staff/history', icon: <Receipt size={20}/> },
    { name: 'Expenses', path: '/staff/expenses', icon: <DollarSign size={20}/> },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">Amontron Hotel and Restaurant</div>
      <div style={{ padding: '0 1rem', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>Staff Panel</div>
      
      <nav className="sidebar-nav" style={{ flex: 1 }}>
        {menu.map(item => (
          <Link key={item.path} to={item.path} className={`sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`}>
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile?.full_name || 'Staff User'}</div>
        <button onClick={logout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

const StaffLayout = ({ children }) => (
  <div className="app-layout">
    <StaffSidebar />
    <div className="app-content">{children}</div>
  </div>
);

const RootRedirect = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <h2>Profile Not Configured</h2>
        <p>Your user account exists, but no profile was found in the system. Please contact the administrator.</p>
      </div>
    );
  }
  return <Navigate to="/staff/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            
            {/* STAFF ROUTES */}
            <Route path="/staff/*" element={<ProtectedRoute requireRole="staff"><StaffLayout>
              <Routes>
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="bookings" element={<BookingsManagement />} />
                <Route path="new-customer" element={<NewCustomer />} />
                <Route path="rooms/book/:customerId" element={<RoomBooking />} />
                <Route path="billing" element={<BillingIndex />} />
                <Route path="billing/:customerId" element={<BillingWorkspace />} />
                <Route path="invoice/:billId" element={<InvoiceView />} />
                <Route path="payment/:billId" element={<PaymentScreen />} />
                <Route path="rooms" element={<RoomsManagement />} />
                <Route path="history" element={<BillHistoryPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
              </Routes>
            </StaffLayout></ProtectedRoute>} />

          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
