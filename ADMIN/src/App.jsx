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
import { LayoutDashboard, BedDouble, Receipt, Settings, LogOut, DollarSign, CalendarCheck, Menu, X } from 'lucide-react';

const AdminSidebar = ({ isOpen, onClose }) => {
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
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ background: '#1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1rem 0.5rem 1rem' }}>
          <div className="sidebar-logo" style={{ color: 'white', padding: 0, border: 'none', fontSize: '1.1rem', fontWeight: 800 }}>
            Amontron Hotel
          </div>
          <button 
            type="button" 
            className="mobile-close-btn" 
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>
        <div style={{ padding: '0 1rem', color: '#fbbf24', fontSize: '0.75rem', marginBottom: '1rem', fontWeight: 'bold', letterSpacing: '1px' }}>
          ADMIN PANEL
        </div>
        
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {menu.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => { if (onClose) onClose(); }}
              className={`sidebar-link ${location.pathname.startsWith(item.path) ? 'active' : ''}`} 
              style={{ color: '#cbd5e1' }}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'white' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile?.full_name || 'Admin User'}</div>
          <button onClick={logout} className="btn" style={{ background: '#334155', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', minHeight: '44px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="app-layout">
      {/* Mobile Top Header */}
      <header className="mobile-top-bar">
        <button 
          type="button" 
          className="mobile-menu-btn" 
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-bar-title">Amontron Hotel & Restaurant</div>
        <div style={{ width: 44 }}></div>
      </header>

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-content" style={{ background: '#f8fafc' }}>{children}</main>
    </div>
  );
};

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
