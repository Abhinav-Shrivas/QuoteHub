import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRFQ, updateRFQ } from '../services/api';

export default function EditRFQ() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    delivery_location: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRFQ = async () => {
      try {
        const data = await getRFQ(id);
        setFormData({
          title: data.rfq.title,
          description: data.rfq.description,
          quantity: data.rfq.quantity.toString(),
          delivery_location: data.rfq.delivery_location,
          deadline: data.rfq.deadline.split('T')[0],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRFQ();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await updateRFQ(id, {
        ...formData,
        quantity: parseInt(formData.quantity, 10),
      });
      navigate(`/rfqs/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="page">
        <div className="container loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading RFQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '700px' }}>
        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="page-header">
          <h1>Edit RFQ</h1>
          <p>Update your request for quotation details</p>
        </div>

        {error && <div className="error-banner">⚠ {error}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Product / Service Name *</label>
              <input
                id="title"
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Requirement Description *</label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="quantity">Quantity *</label>
                <input
                  id="quantity"
                  type="number"
                  name="quantity"
                  className="form-input"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="deadline">Deadline *</label>
                <input
                  id="deadline"
                  type="date"
                  name="deadline"
                  className="form-input"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  min={minDate}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="delivery_location">Delivery Location *</label>
              <input
                id="delivery_location"
                type="text"
                name="delivery_location"
                className="form-input"
                value={formData.delivery_location}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
