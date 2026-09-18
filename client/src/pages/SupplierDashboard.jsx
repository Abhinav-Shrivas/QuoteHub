import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRFQs } from '../services/api';

export default function SupplierDashboard() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const fetchRFQs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRFQs({ search, sort: sort === 'deadline' ? 'deadline' : undefined });
      setRfqs(data.rfqs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRFQs();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const daysUntil = (deadline) => {
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Today';
    if (diff === 1) return '1 day left';
    return `${diff} days left`;
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Browse RFQs</h1>
            <p>Find and respond to open requests for quotation</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card animate-in">
            <div className="stat-card-label">Available RFQs</div>
            <div className="stat-card-value">{rfqs.length}</div>
          </div>
        </div>

        {/* Search & Filter */}
        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Search by title, description, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="newest">Newest First</option>
            <option value="deadline">Deadline (Soonest)</option>
          </select>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        {error && <div className="error-banner">⚠ {error}</div>}

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading available RFQs...</p>
          </div>
        )}

        {!loading && !error && rfqs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No RFQs found</h3>
            <p>
              {search
                ? 'No RFQs match your search. Try different keywords.'
                : 'There are no open RFQs available at the moment. Check back later.'}
            </p>
          </div>
        )}

        {!loading && rfqs.length > 0 && (
          <div className="grid">
            {rfqs.map((rfq) => (
              <Link to={`/rfqs/${rfq.id}`} key={rfq.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card animate-in">
                  <div className="card-header">
                    <div>
                      <div className="card-title">{rfq.title}</div>
                      <div className="card-subtitle">
                        by {rfq.buyer_company || rfq.buyer_name}
                      </div>
                    </div>
                    <span className="badge badge-open">{daysUntil(rfq.deadline)}</span>
                  </div>
                  <div className="card-body">
                    {rfq.description.length > 150
                      ? rfq.description.substring(0, 150) + '...'
                      : rfq.description}
                  </div>
                  <div className="card-footer">
                    <div className="card-meta">
                      <div className="card-meta-item">
                        📦 Qty: {rfq.quantity}
                      </div>
                      <div className="card-meta-item">
                        📍 {rfq.delivery_location}
                      </div>
                      <div className="card-meta-item">
                        📅 Deadline: {formatDate(rfq.deadline)}
                      </div>
                    </div>
                    <span className="btn btn-primary btn-sm">View & Quote →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
