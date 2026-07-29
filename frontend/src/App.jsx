import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import DashboardLayout from './components/layout/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Search';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import MyListings from './pages/MyListings';
import CreateListing from './pages/CreateListing';
import ListingSuccess from './pages/ListingSuccess';
import EditListing from './pages/EditListing';
import Favorites from './pages/Favorites';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import About from './pages/About';
import Services from './pages/Services';
import Testimonials from './pages/Testimonials';
import NotFound from './pages/NotFound';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                fontFamily: 'var(--font)',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
              error: { iconTheme: { primary: 'var(--error)', secondary: 'white' } },
            }}
          />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="testimonials" element={<Testimonials />} />
              <Route path="browse" element={<Browse />} />
              <Route path="search" element={<Browse />} />
              <Route path="listing/:id" element={<ListingDetail />} />
              <Route path="login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="register" element={<GuestRoute><Register /></GuestRoute>} />
              <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
              <Route path="orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
              <Route path="listing-success" element={<ProtectedRoute><ListingSuccess /></ProtectedRoute>} />
              <Route path="edit-listing/:id" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
              <Route path="dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="my-listings" element={<MyListings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
