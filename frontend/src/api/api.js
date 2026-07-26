const BASE_URL = '/api';

async function request(method, path, body = null, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
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
    const res = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
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

export const users = {
  getListings: (id) => api.get(`/users/${id}/listings`),
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
