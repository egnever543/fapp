# IPTV Samsung TV - Sistema Completo

## Estrutura

```
SAMSUNG/
├── backend/          → Servidor Node.js + SQLite
├── admin-panel/      → Painel web do admin
└── tizen-app/        → App para Samsung TV (Tizen)
```

## 1. Configurar o Backend

```bash
cd backend
npm install
npm start
```

O servidor inicia na porta **3000**.
Admin padrão: `admin` / `admin123` → **troque a senha pelo painel!**

## 2. Acessar o Painel Admin

Abra no navegador: `http://SEU-IP:3000/admin`

No painel você pode:
- Cadastrar/editar/remover clientes
- Definir datas de vencimento
- Configurar a URL do servidor Xtream Codes
- Alterar a senha do admin

## 3. Configurar o App Tizen

Edite a linha no arquivo `tizen-app/js/app.js`:

```js
const BACKEND_URL = 'http://SEU-IP-DO-SERVIDOR:3000';
```

## 4. Deploy no Tizen (Samsung TV)

1. Instale o **Tizen Studio** no PC
2. Abra o projeto `tizen-app/` no Tizen Studio
3. Conecte a TV em modo desenvolvedor:
   - Na TV: Configurações → Suporte → Informações do dispositivo → Pressione `12345`
   - Ative o "Modo Desenvolvedor" e coloque o IP do PC
4. Faça o deploy pelo Tizen Studio

## Atualizar via SSH (Backend)

```bash
ssh usuario@seu-servidor
cd /caminho/do/projeto/backend
git pull
npm install
pm2 restart all   # ou: node src/server.js
```

## Rodar em produção com PM2

```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name iptv-backend
pm2 save
pm2 startup
```
