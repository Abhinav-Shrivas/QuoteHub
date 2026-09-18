import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRFQs } from '../services/api';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRFQs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRFQs({ search, status: statusFilter });
      setRfqs(data.rfqs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, [statusFilter]);

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

  const openCount = rfqs.filter((r) => r.status === 'open').length;
  const closedCount = rfqs.filter((r) => r.status === 'closed').length;
  const totalQuotes = rfqs.reduce((sum, r) => sum + (r.quotation_count || 0), 0);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <div className="page-header-row">
            <div>
              <h1>My RFQs</h1>
              <p>Manage your requests for quotation</p>
            </div>
            <Link to="/rfqs/create" className="btn btn-primary">
              + Create New RFQ
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card animate-in">
            <div className="stat-card-label">Total RFQs</div>
            <div className="stat-card-value">{rfqs.length}</div>
          </div>
          <div className="stat-card animate-in">
            <div className="stat-card-label">Open</div>
            <div className="stat-card-value">{openCount}</div>
          </div>
          <div className="stat-card animate-in">
            <div className="stat-card-label">Closed</div>
            <div className="stat-card-value">{closedCount}</div>
          </div>
          <div className="stat-card animate-in">
            <div className="stat-card-label">Quotations Received</div>
            <div className="stat-card-value">{totalQuotes}</div>
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
              placeholder="Search your RFQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>

        {/* Error */}
        {error && <div className="error-banner">⚠ {error}</div>}

        {/* Loading */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading your RFQs...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rfqs.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No RFQs yet</h3>
            <p>Create your first Request for Quotation to start receiving quotes from suppliers.</p>
            <Link to="/rfqs/create" className="btn btn-primary">Create RFQ</Link>
          </div>
        )}

        {/* RFQ List */}
        {!loading && rfqs.length > 0 && (
          <div className="grid">
            {rfqs.map((rfq) => (
              <Link to={`/rfqs/${rfq.id}`} key={rfq.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card animate-in">
                  <div className="card-header">
                    <div>
                      <div className="card-title">{rfq.title}</div>
                      <div className="card-subtitle">Created {formatDate(rfq.created_at)}</div>
                    </div>
                    <span className={`badge badge-${rfq.status}`}>{rfq.status}</span>
                  </div>
                  <div className="card-body">
                    {rfq.description.length > 120
                      ? rfq.description.substring(0, 120) + '...'
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
                    <div className="badge badge-buyer">
                      {rfq.quotation_count || 0} quote{rfq.quotation_count !== 1 ? 's' : ''}
                    </div>
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
