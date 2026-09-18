import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRFQ } from '../services/api';

export default function CreateRFQ() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    delivery_location: '',
    deadline: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createRFQ({
        ...formData,
        quantity: parseInt(formData.quantity, 10),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '700px' }}>
        <button className="back-link" onClick={() => navigate(-1)}>
          ← Back to Dashboard
        </button>

        <div className="page-header">
          <h1>Create New RFQ</h1>
          <p>Fill in the details for your request for quotation</p>
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
                placeholder="e.g. Industrial Steel Pipes"
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
                placeholder="Describe your requirements in detail — specifications, standards, materials, etc."
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
                  placeholder="e.g. 500"
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
                placeholder="e.g. Mumbai, Maharashtra, India"
                value={formData.delivery_location}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Creating...' : 'Create RFQ'}
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
