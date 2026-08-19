// Local API client. Same interface the pages already use.
// Every call goes to the FastAPI backend in this repository.
const API = '/api';

async function post(path, body) {
  const r = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error || r.statusText);
    err.response = { data };
    throw err;
  }
  return data;
}

async function get(path) {
  const r = await fetch(`${API}/${path}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || r.statusText);
  return data;
}

export const api = {
  functions: {
    invoke: async (name, payload) => ({ data: await post(name, payload) }),
  },
  entities: {
    Product: {
      list: async (sort = '-rating', limit = 200) =>
        get(`products?sort=${encodeURIComponent(sort)}&limit=${limit}`),
      filter: async (query = {}, sort = '-rating', limit = 50) => {
        const params = new URLSearchParams({ sort, limit: String(limit), ...query });
        return get(`products?${params.toString()}`);
      },
      get: async (id) => get(`products/${encodeURIComponent(id)}`),
    },
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const fd = new FormData();
        fd.append('file', file);
        const r = await fetch(`${API}/upload`, { method: 'POST', body: fd });
        return r.json();
      },
    },
  },
  auth: { me: async () => ({ email: 'local' }), logout() {} },
};
