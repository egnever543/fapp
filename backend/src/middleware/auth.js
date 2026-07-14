const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'iptv_secret_change_me';

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Acesso negado' });
    next();
  });
}

module.exports = { verifyToken, verifyAdmin, SECRET };
