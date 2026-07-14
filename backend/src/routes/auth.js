const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { SECRET } = require('../middleware/auth');

// Login do admin
router.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.getAdminByUsername(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  const token = jwt.sign({ id: admin.id, username: admin.username, isAdmin: true }, SECRET, { expiresIn: '24h' });
  res.json({ token });
});

module.exports = router;
