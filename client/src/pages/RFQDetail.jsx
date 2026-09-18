import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRFQ, getQuotationsForRFQ, submitQuotation, deleteRFQ, closeRFQ } from '../services/api';

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quotation form (supplier)
  const [quoteForm, setQuoteForm] = useState({
    price: '',
    delivery_time: '',
    message: '',
  });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const rfqData = await getRFQ(id);
      setRfq(rfqData.rfq);

      // Pre-fill quotation form if supplier already submitted
      if (user.role === 'supplier' && rfqData.rfq.my_quotation) {
        setQuoteForm({
          price: rfqData.rfq.my_quotation.price.toString(),
          delivery_time: rfqData.rfq.my_quotation.delivery_time,
          message: rfqData.rfq.my_quotation.message || '',
        });
      }

      // Buyer: fetch quotations
      if (user.role === 'buyer' && rfqData.rfq.buyer_id === user.id) {
        try {
          const quotesData = await getQuotationsForRFQ(id);
          setQuotations(quotesData.quotations);
        } catch (_) {
          // May fail if no quotations yet — that's fine
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setQuoteError('');
    setQuoteLoading(true);

    try {
      await submitQuotation(id, {
        price: parseFloat(quoteForm.price),
        delivery_time: quoteForm.delivery_time,
        message: quoteForm.message,
      });
      setSuccess('Quotation submitted successfully!');
      fetchData();
    } catch (err) {
      setQuoteError(err.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const [actionModal, setActionModal] = useState(null); // 'close' | 'delete' | null
  const [actionLoading, setActionLoading] = useState(false);

  const confirmDelete = async () => {
    setActionLoading(true);
    setError('');
    try {
      await deleteRFQ(id);
      setActionModal(null);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setActionModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmClose = async () => {
    setActionLoading(true);
    setError('');
    try {
      await closeRFQ(id);
      setActionModal(null);
      await fetchData();
      setSuccess('RFQ closed successfully.');
    } catch (err) {
      setError(err.message);
      setActionModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (error && !rfq) {
    return (
      <div className="page">
        <div className="container">
          <div className="error-banner">⚠ {error}</div>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const isBuyerOwner = user && user.role === 'buyer' && Number(rfq.buyer_id) === Number(user.id);
  const isSupplier = user && user.role === 'supplier';
  const hasExistingQuote = rfq.my_quotation != null;

  return (
    <div className="page">
      <div className="container rfq-detail">
        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {success && <div className="success-banner">✓ {success}</div>}
        {error && <div className="error-banner">⚠ {error}</div>}

        {/* Action Confirmation Modal */}
        {actionModal && (
          <div className="modal-backdrop animate-fade" onClick={() => !actionLoading && setActionModal(null)}>
            <div className="modal-dialog animate-in" onClick={(e) => e.stopPropagation()}>
              <div className={`modal-icon-badge ${actionModal === 'delete' ? 'badge-danger-glow' : 'badge-success-glow'}`}>
                {actionModal === 'delete' ? '🗑' : '✓'}
              </div>
              <h3>{actionModal === 'delete' ? 'Delete this RFQ?' : 'Close this RFQ?'}</h3>
              <p>
                {actionModal === 'delete'
                  ? 'Are you sure you want to permanently delete this RFQ? All submitted quotations will also be deleted. This action cannot be undone.'
                  : 'Once closed, this RFQ will no longer accept new quotations from suppliers. You can still review all received quotes.'}
              </p>

              <div className="modal-footer-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActionModal(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${actionModal === 'delete' ? 'btn-danger' : 'btn-success'} btn-lg`}
                  onClick={actionModal === 'delete' ? confirmDelete : confirmClose}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : (actionModal === 'delete' ? 'Yes, Delete' : 'Yes, Close RFQ')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="rfq-detail-header animate-in">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div className="rfq-detail-title">{rfq.title}</div>
              <div className="rfq-detail-meta">
                <div className="rfq-detail-meta-item">
                  🏢 {rfq.buyer_company || rfq.buyer_name}
                </div>
                <div className="rfq-detail-meta-item">
                  📅 Posted {formatDate(rfq.created_at)}
                </div>
                <div className="rfq-detail-meta-item">
                  <span className={`badge badge-${rfq.status}`}>{rfq.status}</span>
                </div>
              </div>
            </div>

            {isBuyerOwner && rfq.status === 'open' && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link to={`/rfqs/${rfq.id}/edit`} className="btn btn-secondary btn-sm">✏ Edit</Link>
                <button type="button" className="btn btn-success btn-sm" onClick={() => setActionModal('close')}>✓ Close RFQ</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setActionModal('delete')}>🗑 Delete</button>
              </div>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="rfq-detail-section animate-in">
          <h2>RFQ Details</h2>
          <div className="rfq-detail-grid">
            <div className="rfq-detail-field">
              <div className="rfq-detail-field-label">Quantity</div>
              <div className="rfq-detail-field-value">{rfq.quantity.toLocaleString()}</div>
            </div>
            <div className="rfq-detail-field">
              <div className="rfq-detail-field-label">Delivery Location</div>
              <div className="rfq-detail-field-value">{rfq.delivery_location}</div>
            </div>
            <div className="rfq-detail-field">
              <div className="rfq-detail-field-label">Deadline</div>
              <div className="rfq-detail-field-value">{formatDate(rfq.deadline)}</div>
            </div>
            <div className="rfq-detail-field">
              <div className="rfq-detail-field-label">Quotations</div>
              <div className="rfq-detail-field-value">{rfq.quotation_count || 0}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rfq-detail-section animate-in">
          <h2>Requirement Description</h2>
          <div className="card">
            <div className="card-body" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
              {rfq.description}
            </div>
          </div>
        </div>

        {/* Supplier: Submit quotation form */}
        {isSupplier && rfq.status === 'open' && (
          <div className="rfq-detail-section animate-in">
            <h2>{hasExistingQuote ? 'Update Your Quotation' : 'Submit a Quotation'}</h2>
            <div className="card">
              {quoteError && <div className="error-banner">⚠ {quoteError}</div>}
              <form onSubmit={handleQuoteSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="price">Quoted Price ($) *</label>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="e.g. 25000.00"
                      value={quoteForm.price}
                      onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="delivery_time">Estimated Delivery Time *</label>
                    <input
                      id="delivery_time"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 2-3 weeks"
                      value={quoteForm.delivery_time}
                      onChange={(e) => setQuoteForm({ ...quoteForm, delivery_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="message">Message / Notes</label>
                  <textarea
                    id="message"
                    className="form-textarea"
                    placeholder="Any additional notes, terms, or conditions..."
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={quoteLoading}>
                  {quoteLoading
                    ? 'Submitting...'
                    : hasExistingQuote
                    ? 'Update Quotation'
                    : 'Submit Quotation'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Buyer: View received quotations */}
        {isBuyerOwner && (
          <div className="rfq-detail-section animate-in">
            <h2>Received Quotations ({quotations.length})</h2>

            {quotations.length === 0 && (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">📭</div>
                <h3>No quotations yet</h3>
                <p>Suppliers haven't submitted any quotations for this RFQ yet.</p>
              </div>
            )}

            {quotations.map((q) => (
              <div className="quotation-card" key={q.id}>
                <div className="quotation-header">
                  <div className="quotation-supplier">
                    <div className="quotation-supplier-avatar">
                      {q.supplier_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{q.supplier_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {q.supplier_company} · {q.supplier_email}
                      </div>
                    </div>
                  </div>
                  <div className="quotation-price">${parseFloat(q.price).toLocaleString()}</div>
                </div>
                <div className="quotation-details">
                  <div className="quotation-detail-item">
                    <strong>Delivery Time:</strong> {q.delivery_time}
                  </div>
                  <div className="quotation-detail-item">
                    <strong>Submitted:</strong> {formatDate(q.created_at)}
                  </div>
                </div>
                {q.message && (
                  <div className="quotation-message">"{q.message}"</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
