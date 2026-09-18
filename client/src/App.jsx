import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import CreateRFQ from './pages/CreateRFQ';
import EditRFQ from './pages/EditRFQ';
import RFQDetail from './pages/RFQDetail';
import MyQuotations from './pages/MyQuotations';

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return user.role === 'buyer' ? <BuyerDashboard /> : <SupplierDashboard />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardRouter /></ProtectedRoute>
        } />

        <Route path="/rfqs/create" element={
          <ProtectedRoute role="buyer"><CreateRFQ /></ProtectedRoute>
        } />

        <Route path="/rfqs/:id/edit" element={
          <ProtectedRoute role="buyer"><EditRFQ /></ProtectedRoute>
        } />

        <Route path="/rfqs/:id" element={
          <ProtectedRoute><RFQDetail /></ProtectedRoute>
        } />

        <Route path="/my-quotations" element={
          <ProtectedRoute role="supplier"><MyQuotations /></ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
