const API_ROOT = '/api';
const TOKEN_KEY = 'simply_access_token';

async function request(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `API request failed (${response.status})`);
  }
  return data;
}

const entityApi = (entity) => ({
  list: (sort, limit) => {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', String(limit));
    return request(`/entities.php?entity=${encodeURIComponent(entity)}&${params.toString()}`);
  },
  filter: (filter = {}, sort, limit) => {
    const params = new URLSearchParams({ filter: JSON.stringify(filter) });
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', String(limit));
    return request(`/entities.php?entity=${encodeURIComponent(entity)}&${params.toString()}`);
  },
  get: (id) => request(`/entities.php?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`),
  create: (data) => request(`/entities.php?entity=${encodeURIComponent(entity)}`, { method: 'POST', body: data }),
  bulkCreate: (rows) => request(`/entities.php?entity=${encodeURIComponent(entity)}`, { method: 'POST', body: rows }),
  update: (id, data) => request(`/entities.php?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
  delete: (id) => request(`/entities.php?entity=${encodeURIComponent(entity)}&id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  subscribe: () => () => {},
});

export const simplyClient = {
  entities: new Proxy({}, {
    get: (_target, entity) => entityApi(String(entity)),
  }),
  functions: {
    invoke: (name, body = {}) => request(`/functions.php?name=${encodeURIComponent(name)}`, { method: 'POST', body }),
  },
  auth: {
    async me() {
      const user = await request('/auth.php?action=me');
      if (!user) throw new Error('Authentication required');
      return user;
    },
    async loginViaEmailPassword(email, password) {
      const result = await request('/auth.php?action=login', { method: 'POST', body: { email, password } });
      if (result?.access_token) localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    async register({ email, password }) {
      const result = await request('/auth.php?action=register', { method: 'POST', body: { email, password } });
      if (result?.access_token) localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    async verifyOtp() {
      return { ok: true, access_token: localStorage.getItem(TOKEN_KEY) };
    },
    async resendOtp() {
      return { ok: true };
    },
    async logout() {
      await request('/auth.php?action=logout', { method: 'POST' }).catch(() => null);
      localStorage.removeItem(TOKEN_KEY);
    },
    setToken(token) {
      localStorage.setItem(TOKEN_KEY, token);
    },
    redirectToLogin(returnTo = window.location.pathname) {
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    },
    loginWithProvider() {
      throw new Error('Google login is not enabled on Simply yet');
    },
  },
};
