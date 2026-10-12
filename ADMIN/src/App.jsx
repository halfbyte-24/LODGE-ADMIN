import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import BookingsManagement from './pages/admin/BookingsManagement';
import ExpensesPage from './pages/admin/ExpensesPage';
import RoomsManagement from './pages/admin/RoomsManagement';
import MenuManagement from './pages/admin/MenuManagement';
import BillHistoryPage from './pages/admin/BillHistoryPage';
import HotelSettingsPage from './pages/admin/HotelSettingsPage';

// Icons
import { LayoutDashboard, BedDouble, Receipt, Settings, LogOut, DollarSign, CalendarCheck } from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout, profile } = useAuth();
  
  const menu = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20}/> },
    { name: 'Bookings', path: '/admin/bookings', icon: <CalendarCheck size={20}/> },
    { name: 'Sales Report', path: '/admin/sales', icon: <DollarSign size={20}/> },
    { name: 'Expense Report', path: '/admin/expenses', icon: <DollarSign size={20}/> },
    { name: 'Manage Rooms', path: '/admin/rooms', icon: <BedDouble size={20}/> },
    { name: 'Manage Menu', path: '/admin/menu', icon: <Receipt size={20}/> },
    { name: 'Hotel Settings', path: '/admin/settings', icon: <Settings size={20}/> },
  ];

  return (
    <div className="sidebar" style={{ background: '#1e293b' }}>
      <div className="sidebar-logo" style={{ color: 'white' }}>Amontron Hotel and Restaurant</div>
      <div style={{ padding: '0 1rem', color: '#fbbf24', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 'bold' }}>ADMIN PANEL</div>
      
      <nav className="sidebar-nav" style={{ flex: 1 }}>
        {menu.map(item => (
          <Link key={item.path} to={item.path} className={`sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`} style={{ color: '#cbd5e1' }}>
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile?.full_name || 'Admin User'}</div>
        <button onClick={logout} className="btn" style={{ background: '#334155', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }) => (
  <div className="app-layout">
    <AdminSidebar />
    <div className="app-content" style={{ background: '#f8fafc' }}>{children}</div>
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
  return <Navigate to="/admin/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            
            {/* ADMIN ROUTES */}
            <Route path="/admin/*" element={<ProtectedRoute requireRole="admin"><AdminLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="bookings" element={<BookingsManagement />} />
                <Route path="sales" element={<BillHistoryPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="rooms" element={<RoomsManagement />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="settings" element={<HotelSettingsPage />} />
              </Routes>
            </AdminLayout></ProtectedRoute>} />
            
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}
