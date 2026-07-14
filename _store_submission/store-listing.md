# Fusion Player — Samsung Apps Store Listing

---

## APP INFO (Samsung Seller Portal)

| Campo | Valor |
|---|---|
| App Name | Fusion Player |
| Package ID | FsnPlay |
| App ID | FsnPlay.FusionPlayer |
| Version | 1.0.0 |
| Category | Entertainment |
| Sub-category | Media & Video |
| Age Rating | 18+ (por conter acesso a conteúdo adulto via configuração do operador) |
| Countries | Brazil (inicialmente) |
| Price | Free |
| Privacy Policy URL | https://fusionplayer.app/privacy-policy (hospedar o arquivo privacy-policy.html) |

---

## DESCRIÇÃO — Português (pt-BR)

**Título:** Fusion Player

**Descrição curta (80 caracteres):**
Player pessoal de streaming para assistir seus conteúdos na Samsung TV.

**Descrição longa:**
Fusion Player é um player de mídia pessoal que conecta sua Samsung Smart TV ao seu servidor de streaming privado, permitindo assistir canais ao vivo, filmes e séries diretamente na tela grande.

**Principais recursos:**

• Canais ao vivo com grade de programação (EPG)
• Biblioteca de filmes com capas e informações
• Biblioteca de séries com temporadas e episódios
• Navegação intuitiva por controle remoto
• Busca rápida dentro de cada biblioteca
• Carregamento instantâneo com cache inteligente
• Suporte a múltiplos formatos: HLS e MPEG-TS
• Compatível com servidores Xtream Codes
• Tela de assinatura com data de vencimento e renovação

**Como funciona:**
Conecte o aplicativo ao seu servidor de mídia pessoal inserindo seu usuário e senha. Todo o conteúdo é transmitido diretamente do seu servidor para sua TV — sem intermediários.

---

## DESCRIPTION — English (en-US)

**Title:** Fusion Player

**Short description (80 chars):**
Personal streaming player to watch your content on Samsung TV.

**Long description:**
Fusion Player is a personal media player that connects your Samsung Smart TV to your private streaming server, letting you watch live channels, movies and series directly on the big screen.

**Key features:**

• Live channels with electronic program guide (EPG)
• Movie library with covers and details
• Series library with seasons and episodes
• Intuitive remote control navigation
• Quick search within each library
• Instant loading with smart cache
• Multiple format support: HLS and MPEG-TS
• Compatible with Xtream Codes servers
• Subscription screen with expiry date and renewal

**How it works:**
Connect the app to your personal media server by entering your username and password. All content is streamed directly from your server to your TV — no intermediaries.

---

## CREDENCIAIS DE TESTE (para o revisor Samsung)

Preencher no campo "Test Account Information" do Seller Portal:

```
Servidor: [URL do seu servidor]
Usuário: [criar uma conta de teste no seu painel]
Senha: [senha da conta de teste]

Instruções:
1. Abra o app e insira o usuário e senha acima
2. Pressione ENTRAR
3. O app carregará as listas de canais, filmes e séries
4. Use as setas do controle remoto para navegar
5. Pressione OK/Enter para selecionar
6. Pressione Voltar para retornar ao menu anterior
```

> ⚠️ Crie uma conta de teste específica para a revisão Samsung com conteúdo
> apenas de canais abertos/filmes sem restrição de age rating.
> NÃO inclua conteúdo adulto na conta de teste.

---

## ASSETS NECESSÁRIOS

### Ícones (obrigatórios)

| Arquivo | Tamanho | Uso |
|---|---|---|
| `assets/icon_512.png` | 512×512 px | Ícone principal (loja + config.xml) |
| `assets/icon_96.png` | 96×96 px | Ícone pequeno (launcher TV) |

**Especificações:**
- Formato: PNG com fundo transparente ou cor sólida
- Sem texto no ícone (Samsung rejeita)
- Design simples, legível em TV

### Screenshots (mínimo 4, máximo 8)

| Resolução | Orientação | Quantidade |
|---|---|---|
| 1920×1080 px | Landscape | 4–8 imagens |

**Sugestão de screenshots:**
1. Tela de canais ao vivo com EPG
2. Biblioteca de filmes (grid com capas)
3. Biblioteca de séries
4. Tela de detalhe de série (temporadas/episódios)
5. Player em reprodução
6. Tela de assinatura

**Como capturar:**
- Abrir o app no browser em 1920×1080
- Usar F12 → Device Toolbar → 1920×1080
- Print screen de cada tela

### Feature Graphic (opcional mas recomendado)

| Arquivo | Tamanho |
|---|---|
| `store/feature_graphic.png` | 1920×1080 px |

Banner exibido na página do app na loja.
Fundo escuro, logo Fusion centralizado, subtítulo em branco.

---

## CHECKLIST FINAL ANTES DE SUBMETER

- [ ] `config.xml` com package ID único (FsnPlay)
- [ ] `assets/icon_512.png` criado (512×512)
- [ ] `assets/icon_96.png` criado (96×96)
- [ ] Pelo menos 4 screenshots em 1920×1080
- [ ] Conta de teste criada (sem conteúdo adulto)
- [ ] Privacy Policy URL online e acessível
- [ ] `.wgt` gerado pelo Tizen Studio
- [ ] Testado no Tizen emulador ou TV física
- [ ] Descrição revisada (sem menção a IPTV, pirataria, canais de TV)
