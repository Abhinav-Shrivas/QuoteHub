const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

/**
 * Generic API fetch wrapper with auth header injection and error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // Build a user-friendly error message
    const message =
      data.error ||
      data.errors?.map((e) => e.msg).join(', ') ||
      'Something went wrong';
    throw new Error(message);
  }

  return data;
}

// ========================
// AUTH
// ========================
export async function register(userData) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function login(credentials) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function getProfile() {
  return apiFetch('/auth/me');
}

// ========================
// RFQS
// ========================
export async function createRFQ(rfqData) {
  return apiFetch('/rfqs', {
    method: 'POST',
    body: JSON.stringify(rfqData),
  });
}

export async function getRFQs(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.sort) query.set('sort', params.sort);
  const qs = query.toString();
  return apiFetch(`/rfqs${qs ? `?${qs}` : ''}`);
}

export async function getRFQ(id) {
  return apiFetch(`/rfqs/${id}`);
}

export async function updateRFQ(id, rfqData) {
  return apiFetch(`/rfqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(rfqData),
  });
}

export async function deleteRFQ(id) {
  return apiFetch(`/rfqs/${id}`, {
    method: 'DELETE',
  });
}

export async function closeRFQ(id) {
  return apiFetch(`/rfqs/${id}/close`, {
    method: 'PATCH',
  });
}

// ========================
// QUOTATIONS
// ========================
export async function submitQuotation(rfqId, quotationData) {
  return apiFetch(`/rfqs/${rfqId}/quotations`, {
    method: 'POST',
    body: JSON.stringify(quotationData),
  });
}

export async function getQuotationsForRFQ(rfqId) {
  return apiFetch(`/rfqs/${rfqId}/quotations`);
}

export async function getMyQuotations() {
  return apiFetch('/quotations/my');
}
