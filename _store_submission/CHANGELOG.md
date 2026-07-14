# CHANGELOG

## [0.2.0] - 2026-06-26

### Mudança de arquitetura — autenticação via Xtream Codes direta

**Motivo:** A autenticação do cliente passou a ser feita diretamente pelo servidor Xtream Codes,
sem camada de login própria no backend. O backend serve apenas para configuração centralizada
(URL do servidor) e futuros logs de acesso.

### Adicionado
- `GET /api/config` — endpoint público que retorna a URL do servidor Xtream para o app da TV
- Log de acessos à configuração (IP + User-Agent) em `connections_log`
- `GET /api/admin/connections` — listagem dos últimos 200 acessos no painel admin
- Aba "Conexões" no painel admin com tabela de acessos recentes

### Removido
- Sistema de usuários próprio (tabela `users`, rotas `POST/PUT/DELETE /api/admin/users`)
- Endpoint `POST /api/auth/login` (login de cliente no backend)
- Aba "Clientes" do painel admin
- Mock Xtream Codes (`/mock/player_api.php`) — usado apenas para testes locais iniciais
- Campos `_nextUserId` e `users` do banco de dados JSON

### Alterado
- `db.js` — removido todo o gerenciamento de usuários; mantido apenas `settings`, `admins` e `connections_log`
- `routes/auth.js` — mantido apenas o login do admin
- `routes/admin.js` — removidas rotas de usuários; adicionada rota de conexões
- `tizen-app/js/app.js` — app agora busca a URL via `/api/config` e autentica direto no Xtream Codes
- Painel admin simplificado para 3 abas: Configurações, Conexões, Segurança

---

## [0.1.0] - 2026-06-26

### Criação inicial do projeto

### Adicionado
- Backend Node.js + Express + lowdb (JSON)
  - Login de clientes com JWT próprio
  - CRUD de usuários com controle de vencimento e ativação
  - Login de admin
  - Configuração de URL do servidor Xtream
- Painel admin web com abas: Clientes, Configurações, Segurança
- App Tizen (Samsung TV) com login próprio, grade de canais e player HLS
- Substituído `better-sqlite3` por `lowdb` (sem necessidade de compilação nativa no Windows)
