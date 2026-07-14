const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const app = express();

app.use(cors());
app.use(express.json());

// Interfaces estáticas
app.use('/admin', express.static(path.join(__dirname, '../../admin-panel'), { etag: false, lastModified: false, setHeaders: r => r.setHeader('Cache-Control', 'no-store') }));
app.use('/tv', express.static(path.join(__dirname, '../../tizen-app'), { etag: false, lastModified: false, setHeaders: r => r.setHeader('Cache-Control', 'no-store') }));

// Proxy para evitar CORS: TV app chama este endpoint, backend faz o fetch externo
app.get('/api/proxy', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? require('https') : require('http');
    const options = { rejectUnauthorized: false };
    lib.get(url, options, (upstream) => {
      let body = '';
      upstream.on('data', chunk => body += chunk);
      upstream.on('end', () => {
        try { res.json(JSON.parse(body)); }
        catch { res.status(502).json({ error: 'invalid json from upstream' }); }
      });
    }).on('error', e => res.status(502).json({ error: e.message }));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Endpoint público: TV app busca a URL do servidor Xtream
app.get('/api/config', (req, res) => {
  // Registra o acesso (IP, user-agent)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';
  // Log anônimo só do acesso à configuração
  db.addConnectionLog({ username: '—', ip, user_agent: ua });
  res.json({
    serverUrl:  db.getSetting('server_url')   || '',
    serverUrl2: db.getSetting('server_url_2') || '',
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subscription', require('./routes/subscription'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor IPTV rodando na porta ${PORT}`);
  console.log(`Painel admin: http://localhost:${PORT}/admin`);
  console.log(`App TV:       http://localhost:${PORT}/tv`);
});
