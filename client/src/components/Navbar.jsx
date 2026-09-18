import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src="/logo.png" alt="QuoteHub Logo" className="navbar-brand-logo" />
          <span className="navbar-brand-text">QuoteHub</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {user.role === 'buyer' && (
            <>
              <Link
                to="/dashboard"
                className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                My RFQs
              </Link>
              <Link
                to="/rfqs/create"
                className={`navbar-link ${isActive('/rfqs/create') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                Create RFQ
              </Link>
            </>
          )}

          {user.role === 'supplier' && (
            <>
              <Link
                to="/dashboard"
                className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                Browse RFQs
              </Link>
              <Link
                to="/my-quotations"
                className={`navbar-link ${isActive('/my-quotations') ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                My Quotations
              </Link>
            </>
          )}

          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>
            Logout
          </button>
        </div>

        <div className="navbar-user">
          <div className="navbar-user-info">
            <div className="navbar-user-name">{user.name}</div>
            <div className="navbar-user-role">{user.role} · {user.company}</div>
          </div>
          <div className="navbar-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </nav>
  );
}
