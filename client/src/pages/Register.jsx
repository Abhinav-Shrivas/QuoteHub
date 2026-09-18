import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    company: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const data = await apiRegister(registerData);
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
            <h1>Create Account</h1>
            <p>Join QuoteHub — Post Needs. Find Solutions.</p>
          </div>

          {error && <div className="error-banner">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Role selector */}
            <label className="form-label">I am a</label>
            <div className="role-selector">
              <div
                className={`role-option ${formData.role === 'buyer' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'buyer' })}
              >
                <div className="role-option-icon">🛒</div>
                <div className="role-option-label">Buyer</div>
                <div className="role-option-desc">Post RFQs & get quotes</div>
              </div>
              <div
                className={`role-option ${formData.role === 'supplier' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'supplier' })}
              >
                <div className="role-option-icon">🏭</div>
                <div className="role-option-label">Supplier</div>
                <div className="role-option-desc">Browse & submit quotes</div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="company">Company</label>
                <input
                  id="company"
                  type="text"
                  name="company"
                  className="form-input"
                  placeholder="Acme Corp"
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
