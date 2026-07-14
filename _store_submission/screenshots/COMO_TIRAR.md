# Como tirar os screenshots para a loja

## Pré-requisitos
- App rodando em http://localhost:3000/tv/
- Chrome na aba /tv/
- Windows Snipping Tool: Win + Shift + S → "Janela"

---

## Script de blur (cole no Console do Chrome antes de cada print)

Abre o DevTools (F12) → Console → cole o script da tela desejada → Enter → Win+Shift+S

---

### Screenshot 1 — AO VIVO (canais + EPG)

1. Esteja na aba AO VIVO com um canal selecionado
2. Cole no Console:

```js
(function(){
  const s = document.createElement('style');
  s.id='ss-blur';
  s.textContent=`
    .cat-item span,.cat-item .cat-count,.ch-name-text,.ch-num,
    .live-ch-name,.epg-show,.epg-time,.ch-logo-wrap img,
    #live-preview-video { filter:blur(8px)!important; }
    #live-preview-video { object-fit:cover; }
  `;
  document.head.appendChild(s);
  console.log('✅ Blur aplicado — tire o print agora');
})()
```

3. Tire o print (Win+Shift+S → Janela inteira do Chrome)
4. Para remover o blur: `document.getElementById('ss-blur').remove()`

---

### Screenshot 2 — FILMES (grid de capas)

1. Clique em FILMES → escolha uma categoria com bastante conteúdo
2. Cole no Console:

```js
(function(){
  const s = document.createElement('style');
  s.id='ss-blur';
  s.textContent=`
    .cat-item span,.cat-item .cat-count,.card-name,.card-year,#cat-title
    { filter:blur(8px)!important; color:transparent!important; }
  `;
  document.head.appendChild(s);
  console.log('✅ Blur aplicado');
})()
```

3. Tire o print
4. Remove: `document.getElementById('ss-blur').remove()`

---

### Screenshot 3 — SÉRIES (grid de capas)

1. Clique em SÉRIES → escolha uma categoria
2. Cole no Console (mesmo script do Filmes):

```js
(function(){
  const s = document.createElement('style');
  s.id='ss-blur';
  s.textContent=`
    .cat-item span,.cat-item .cat-count,.card-name,.card-year,#cat-title
    { filter:blur(8px)!important; color:transparent!important; }
  `;
  document.head.appendChild(s);
  console.log('✅ Blur aplicado');
})()
```

3. Tire o print
4. Remove: `document.getElementById('ss-blur').remove()`

---

### Screenshot 4 — DETALHE DE SÉRIE (temporadas + episódios)

1. Clique em qualquer série
2. Cole no Console:

```js
(function(){
  const s = document.createElement('style');
  s.id='ss-blur';
  s.textContent=`
    .series-title,.series-meta,.season-item,.ep-title,.ep-duration,
    #series-cover { filter:blur(8px)!important; }
  `;
  document.head.appendChild(s);
  console.log('✅ Blur aplicado');
})()
```

3. Tire o print
4. Remove: `document.getElementById('ss-blur').remove()`

---

### Screenshot 5 — PLAYER (vídeo em reprodução)

1. Inicie a reprodução de qualquer canal ao vivo
2. Cole no Console:

```js
(function(){
  const s = document.createElement('style');
  s.id='ss-blur';
  s.textContent=`
    .player-name,.player-sub,.player-cat
    { filter:blur(8px)!important; }
  `;
  document.head.appendChild(s);
  // Mostra o overlay para aparecer no print
  document.getElementById('player-overlay').classList.add('visible');
  console.log('✅ Blur aplicado');
})()
```

3. Tire o print
4. Remove: `document.getElementById('ss-blur').remove()`

---

### Screenshot 6 — ASSINATURA

1. Clique na aba ASSINATURA
2. Não precisa de blur (não tem conteúdo sensível)
3. Tire o print direto

---

## Onde salvar
Salve todos os prints em:
`C:\Users\LC\Desktop\SAMSUNG\screenshots\`

Nomes sugeridos:
- `01_ao_vivo.png`
- `02_filmes.png`
- `03_series.png`
- `04_detalhe_serie.png`
- `05_player.png`
- `06_assinatura.png`

---

## Resolução
O Chrome precisa estar com zoom a 100% (Ctrl+0) e janela maximizada para garantir 1920×1080.
Verifique: DevTools → Console → `window.innerWidth + 'x' + window.innerHeight`
