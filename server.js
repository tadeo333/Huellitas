// Huellitas · servidor (Express + SQLite). Sin configuración obligatoria.
const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });

// Clave para firmar sesiones: usa JWT_SECRET si existe; si no, se genera y se guarda una vez.
let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  const f = path.join(DATA, 'secret.txt');
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(48).toString('hex'));
  SECRET = fs.readFileSync(f, 'utf8').trim();
}

const db = new Database(path.join(DATA, 'huellitas.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, hash TEXT NOT NULL,
  created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS docs(
  user_id INTEGER NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
  updated TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, id),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`);

const app = express();
app.use(express.json({ limit: '1mb' }));

// Límite simple de intentos de acceso (10 por minuto por IP)
const tries = new Map();
const limit = (req, res, next) => {
  const k = req.ip, now = Date.now();
  const a = (tries.get(k) || []).filter(t => now - t < 60000);
  if (a.length >= 10) return res.status(429).json({ error: 'Demasiados intentos. Espera un minuto.' });
  a.push(now); tries.set(k, a); next();
};

const sign = u => jwt.sign({ uid: u.id }, SECRET, { expiresIn: '90d' });
const pub = u => ({ id: u.id, email: u.email, name: u.name });

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  try {
    req.uid = jwt.verify(h.replace(/^Bearer /, ''), SECRET).uid;
    if (!db.prepare('SELECT 1 FROM users WHERE id=?').get(req.uid)) throw 0;
    next();
  } catch { res.status(401).json({ error: 'Sesión no válida' }); }
}

app.post('/api/register', limit, (req, res) => {
  const { email = '', password = '', name = '' } = req.body || {};
  const em = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return res.status(400).json({ error: 'Escribe un correo válido.' });
  if (String(password).length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(em)) return res.status(409).json({ error: 'Ese correo ya está registrado.' });
  const r = db.prepare('INSERT INTO users(email,name,hash) VALUES(?,?,?)')
    .run(em, String(name).trim().slice(0, 80), bcrypt.hashSync(String(password), 10));
  const u = { id: r.lastInsertRowid, email: em, name: String(name).trim() };
  res.json({ token: sign(u), user: pub(u) });
});

app.post('/api/login', limit, (req, res) => {
  const em = String((req.body || {}).email || '').trim().toLowerCase();
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(em);
  if (!u || !bcrypt.compareSync(String((req.body || {}).password || ''), u.hash))
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  res.json({ token: sign(u), user: pub(u) });
});

app.get('/api/me', auth, (req, res) =>
  res.json(pub(db.prepare('SELECT * FROM users WHERE id=?').get(req.uid))));

// Documentos privados de cada usuario (perros, vacunas, citas, historial, peso, recordatorios)
const okId = id => /^[\w-]{1,64}$/.test(id);
const okData = d => d && typeof d === 'object' && !Array.isArray(d);

app.get('/api/docs', auth, (req, res) =>
  res.json(db.prepare('SELECT id,data FROM docs WHERE user_id=?').all(req.uid)
    .map(r => ({ id: r.id, data: JSON.parse(r.data) }))));

app.post('/api/docs', auth, (req, res) => {
  if (!okData(req.body)) return res.status(400).json({ error: 'Datos no válidos.' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO docs(user_id,id,data) VALUES(?,?,?)').run(req.uid, id, JSON.stringify(req.body));
  res.json({ id });
});

app.put('/api/docs/:id', auth, (req, res) => {
  if (!okId(req.params.id) || !okData(req.body)) return res.status(400).json({ error: 'Datos no válidos.' });
  db.prepare(`INSERT INTO docs(user_id,id,data) VALUES(?,?,?)
    ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data, updated=CURRENT_TIMESTAMP`)
    .run(req.uid, req.params.id, JSON.stringify(req.body));
  res.json({ ok: true });
});

app.delete('/api/docs/:id', auth, (req, res) => {
  db.prepare('DELETE FROM docs WHERE user_id=? AND id=?').run(req.uid, req.params.id);
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => res.status(400).json({ error: 'Solicitud no válida (¿imagen demasiado grande?).' }));

app.listen(PORT, () => console.log(`Huellitas listo en http://localhost:${PORT}`));
