// Capa de datos: conecta la interfaz con el servidor (REST) y sincroniza entre dispositivos.
const API = {
  token: localStorage.getItem('hp_token'),
  async req(method, url, body) {
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(API.token ? { Authorization: 'Bearer ' + API.token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && API.token) { API.logout(); throw new Error('Sesión expirada'); }
    if (!r.ok) throw new Error(j.error || 'Error del servidor');
    return j;
  },
  async auth(kind, body) {
    const j = await API.req('POST', '/api/' + kind, body);
    API.token = j.token; localStorage.setItem('hp_token', j.token);
    return j.user;
  },
  logout() { localStorage.removeItem('hp_token'); API.token = null; location.reload(); }
};

function makeCol() {
  const subs = new Set(); let timer;
  const load = async () => {
    const rows = await API.req('GET', '/api/docs');
    const snap = { docs: rows.map(r => ({ id: r.id, data: () => r.data })) };
    subs.forEach(f => f(snap));
  };
  const after = async p => { const x = await p; await load(); return x; };
  return {
    doc: id => ({
      set: d => after(API.req('PUT', '/api/docs/' + encodeURIComponent(id), d)),
      delete: () => after(API.req('DELETE', '/api/docs/' + encodeURIComponent(id)))
    }),
    add: d => after(API.req('POST', '/api/docs', d)),
    onSnapshot(fn, onErr) {
      subs.add(fn); load().catch(e => onErr && onErr(e));
      if (!timer) timer = setInterval(() => { if (!document.hidden) load().catch(() => {}); }, 15000);
      return () => subs.delete(fn);
    }
  };
}
