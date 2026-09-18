import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyQuotations } from '../services/api';

export default function MyQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const data = await getMyQuotations();
        setQuotations(data.quotations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Quotations</h1>
          <p>Track all quotations you've submitted</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card animate-in">
            <div className="stat-card-label">Total Submitted</div>
            <div className="stat-card-value">{quotations.length}</div>
          </div>
          <div className="stat-card animate-in">
            <div className="stat-card-label">For Open RFQs</div>
            <div className="stat-card-value">
              {quotations.filter((q) => q.rfq_status === 'open').length}
            </div>
          </div>
          <div className="stat-card animate-in">
            <div className="stat-card-label">For Closed RFQs</div>
            <div className="stat-card-value">
              {quotations.filter((q) => q.rfq_status === 'closed').length}
            </div>
          </div>
        </div>

        {error && <div className="error-banner">⚠ {error}</div>}

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading your quotations...</p>
          </div>
        )}

        {!loading && !error && quotations.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No quotations submitted</h3>
            <p>Browse open RFQs and submit your first quotation.</p>
            <Link to="/dashboard" className="btn btn-primary">Browse RFQs</Link>
          </div>
        )}

        {!loading && quotations.length > 0 && (
          <div className="grid">
            {quotations.map((q) => (
              <Link to={`/rfqs/${q.rfq_id}`} key={q.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card animate-in">
                  <div className="card-header">
                    <div>
                      <div className="card-title">{q.rfq_title}</div>
                      <div className="card-subtitle">by {q.buyer_company || q.buyer_name}</div>
                    </div>
                    <span className={`badge badge-${q.rfq_status}`}>{q.rfq_status}</span>
                  </div>

                  <div className="quotation-details" style={{ margin: '0' }}>
                    <div className="quotation-detail-item">
                      <strong>Your Price:</strong>{' '}
                      <span style={{ color: 'var(--accent-success)', fontWeight: 700, fontSize: '1.1rem' }}>
                        ${parseFloat(q.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="quotation-detail-item">
                      <strong>Delivery:</strong> {q.delivery_time}
                    </div>
                  </div>

                  {q.message && (
                    <div className="quotation-message">"{q.message}"</div>
                  )}

                  <div className="card-footer">
                    <div className="card-meta">
                      <div className="card-meta-item">
                        📦 Qty: {q.rfq_quantity}
                      </div>
                      <div className="card-meta-item">
                        📍 {q.rfq_delivery_location}
                      </div>
                      <div className="card-meta-item">
                        📅 Submitted: {formatDate(q.created_at)}
                      </div>
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
