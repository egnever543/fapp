const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(path.join(dataDir, 'iptv.json'));
const db = low(adapter);

db.defaults({
  settings: { server_url: '', server_url_2: '' },
  admins: [],
  connections_log: [],
  _nextAdminId: 1,
  _nextLogId: 1,
}).write();

// Seed admin padrão
if (!db.get('admins').find({ username: 'admin' }).value()) {
  const hash = bcrypt.hashSync('admin123', 10);
  const id = db.get('_nextAdminId').value();
  db.get('admins').push({ id, username: 'admin', password: hash }).write();
  db.set('_nextAdminId', id + 1).write();
  console.log('Admin padrão criado: admin / admin123');
}

const dbHelper = {
  // Settings
  getSetting(key) {
    return db.get(`settings.${key}`).value();
  },
  setSetting(key, value) {
    db.set(`settings.${key}`, value).write();
  },
  getAllSettings() {
    return db.get('settings').value();
  },

  // Admins
  getAdminByUsername(username) {
    return db.get('admins').find({ username }).value() || null;
  },
  getAdminById(id) {
    return db.get('admins').find({ id: Number(id) }).value() || null;
  },
  updateAdmin(id, fields) {
    db.get('admins').find({ id: Number(id) }).assign(fields).write();
  },

  // Log de conexões
  addConnectionLog({ username, ip, user_agent }) {
    const id = db.get('_nextLogId').value();
    db.get('connections_log').push({
      id,
      username,
      ip,
      user_agent: user_agent || '',
      connected_at: new Date().toISOString(),
    }).write();
    db.set('_nextLogId', id + 1).write();
    // Mantém só os últimos 500 registros
    const logs = db.get('connections_log').value();
    if (logs.length > 500) {
      db.set('connections_log', logs.slice(logs.length - 500)).write();
    }
  },
  getConnectionLogs() {
    return db.get('connections_log').orderBy('connected_at', 'desc').take(200).value();
  },
};

module.exports = dbHelper;
