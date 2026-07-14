const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyAdmin } = require('../middleware/auth');

router.use(verifyAdmin);

// Configurações
router.get('/settings', (req, res) => {
  res.json(db.getAllSettings());
});

router.put('/settings', (req, res) => {
  const { server_url, server_url_2, fts_token } = req.body;
  if (server_url   !== undefined) db.setSetting('server_url',   server_url);
  if (server_url_2 !== undefined) db.setSetting('server_url_2', server_url_2);
  if (fts_token    !== undefined) db.setSetting('fts_token',    fts_token);
  res.json({ ok: true });
});

// Retorna apenas se o token existe (sem expor o valor)
router.get('/settings', (req, res) => {
  const s = db.getAllSettings();
  res.json({ ...s, fts_token: s.fts_token ? '••••••••' : '' });
});

// Log de conexões
router.get('/connections', (req, res) => {
  res.json(db.getConnectionLogs());
});

// Alterar senha do admin
router.put('/change-password', (req, res) => {
  const { current_password, new_password } = req.body;
  const admin = db.getAdminById(req.user.id);
  if (!bcrypt.compareSync(current_password, admin.password)) {
    return res.status(400).json({ error: 'Senha atual incorreta' });
  }
  db.updateAdmin(req.user.id, { password: bcrypt.hashSync(new_password, 10) });
  res.json({ ok: true });
});

module.exports = router;
