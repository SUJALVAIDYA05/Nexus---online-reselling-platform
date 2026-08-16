const VITE_API_URL = import.meta.env.VITE_API_URL || '';
const BASE_URL = VITE_API_URL ? `${VITE_API_URL.replace(/\/+$/, '')}/api` : '/api';

let memoryToken = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;

export const setAuthToken = (token) => {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('nexus_token', token);
    } else {
      localStorage.removeItem('nexus_token');
    }
  }
};

export const getAuthToken = () => {
  return memoryToken || (typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null);
};

async function request(method, path, body = null, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = options.token || getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers, credentials: 'include' };
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, config);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw { status: res.status, message: data?.error || 'Something went wrong', data };
  }

  return data;
}

export const api = {
  get: (path, options) => request('GET', path, null, options),
  post: (path, body, options) => request('POST', path, body, options),
  put: (path, body, options) => request('PUT', path, body, options),
  delete: (path, options) => request('DELETE', path, null, options),

  async upload(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const headers = {};
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw { status: res.status, message: data?.error || 'Upload failed' };
    return data;
  },
};

export const auth = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const users = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null && v !== '')
    ).toString();
    return api.get(`/users${qs ? `?${qs}` : ''}`);
  },
  getListings: (id) => api.get(`/users/${id}/listings`),
  updateProfile: (data) => api.put('/users/profile', data),
};

export const orders = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/orders${qs ? `?${qs}` : ''}`);
  },
  get: (id) => api.get(`/orders/${id}`),
  getPaymentStatus: (id) => api.get(`/orders/${id}/payment-status`),
  simulatePayment: (id) => api.post(`/orders/${id}/simulate-payment`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};



export const listings = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v != null && v !== '')
    ).toString();
    return api.get(`/listings${qs ? `?${qs}` : ''}`);
  },
  get: (id) => api.get(`/listings/${id}`),
  create: (data) => api.post('/listings', data),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
};

export const categories = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
};

export const favorites = {
  list: () => api.get('/favorites'),
  add: (listingId) => api.post('/favorites', { listingId }),
  remove: (listingId) => api.delete(`/favorites/${listingId}`),
};

export const conversations = {
  list: () => api.get('/conversations'),
  create: (listingId) => api.post('/conversations', { listingId }),
  getMessages: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/conversations/${id}/messages${qs ? `?${qs}` : ''}`);
  },
  sendMessage: (id, text) => api.post(`/conversations/${id}/messages`, { text }),
  markRead: (id) => api.post(`/conversations/${id}/read`),
};
