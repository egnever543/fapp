const router = require('express').Router();
const db = require('../db');

const FTS_BASE = 'https://sistema.ftspanel.vip';

// Endpoint público: TV app busca dados de assinatura pelo username Xtream
router.get('/', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username obrigatório' });

  const token = db.getSetting('fts_token');
  if (!token) return res.status(503).json({ error: 'Integração FTS não configurada' });

  try {
    const r = await fetch(`${FTS_BASE}/api/webhook/customer?username=${encodeURIComponent(username)}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!r.ok) return res.status(r.status).json({ error: 'Cliente não encontrado' });

    const json = await r.json();
    const d = json.data;

    // Expõe apenas o necessário — token e dados sensíveis ficam no backend
    res.json({
      name:       d.name       || '',
      status:     d.status     || '',
      expires_at: d.expires_at || null,
      package:    d.package    || '',
      renew_url:  d.renew_url  || '',
      is_trial:   d.is_trial   || 'NO',
    });
  } catch (e) {
    res.status(502).json({ error: 'Falha ao consultar painel FTS' });
  }
});

module.exports = router;
