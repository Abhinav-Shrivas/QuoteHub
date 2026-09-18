import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFillDemo = (role) => {
    if (role === 'buyer') {
      setFormData({
        email: 'buyer@test.com',
        password: 'password123',
      });
      setActiveDemo('buyer');
    } else {
      setFormData({
        email: 'supplier@test.com',
        password: 'password123',
      });
      setActiveDemo('supplier');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(formData);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card animate-in">
          <div className="auth-header">
            <div className="auth-logo-wrapper">
              <img src="/logo.png" alt="QuoteHub Logo" className="auth-brand-logo" />
            </div>
            <h1>Welcome back</h1>
            <p>Sign in to your QuoteHub account</p>
          </div>

          {error && <div className="error-banner">⚠ {error}</div>}

          {/* Quick Demo Credentials Panel */}
          <div className="demo-credentials-section">
            <div className="demo-credentials-header">
              <span className="demo-title">
                <span className="demo-icon">🔑</span> Demo Credentials
              </span>
              <span className="demo-hint-tag">Click to auto-fill</span>
            </div>

            <div className="demo-accounts-grid">
              <button
                type="button"
                className={`demo-account-card ${activeDemo === 'buyer' ? 'selected' : ''}`}
                onClick={() => handleFillDemo('buyer')}
                title="Click to fill Buyer credentials"
              >
                <div className="demo-account-header">
                  <span className="demo-role-badge badge-buyer">🛒 Buyer</span>
                  <span className="demo-action-btn">
                    {activeDemo === 'buyer' ? '✓ Filled' : 'Auto-fill'}
                  </span>
                </div>
                <div className="demo-account-email">buyer@test.com</div>
                <div className="demo-account-pass">
                  Password: <code>password123</code>
                </div>
              </button>

              <button
                type="button"
                className={`demo-account-card ${activeDemo === 'supplier' ? 'selected' : ''}`}
                onClick={() => handleFillDemo('supplier')}
                title="Click to fill Supplier credentials"
              >
                <div className="demo-account-header">
                  <span className="demo-role-badge badge-supplier">🏭 Supplier</span>
                  <span className="demo-action-btn">
                    {activeDemo === 'supplier' ? '✓ Filled' : 'Auto-fill'}
                  </span>
                </div>
                <div className="demo-account-email">supplier@test.com</div>
                <div className="demo-account-pass">
                  Password: <code>password123</code>
                </div>
              </button>
            </div>
          </div>

          <div className="auth-divider">
            <span>Or enter credentials manually</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-input"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
