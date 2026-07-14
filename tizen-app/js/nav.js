// ─── NAVEGAÇÃO ESPACIAL PARA D-PAD ───────────────────────
// Encontra o elemento focável mais próximo na direção pressionada
// usando as coordenadas reais dos elementos na tela.

const FOCUSABLE = '.focusable';
let lastFocused = null;

function navInit() {
  document.addEventListener('keydown', onNavKey);
}

function onNavKey(e) {
  const KEY = {
    UP:    [38, 'ArrowUp'],
    DOWN:  [40, 'ArrowDown'],
    LEFT:  [37, 'ArrowLeft'],
    RIGHT: [39, 'ArrowRight'],
    OK:    [13, 'Enter'],
    BACK:  [10009, 8],  // Tizen Back / Backspace
  };

  const code = e.keyCode;
  const key  = e.key;

  let dir = null;
  if (KEY.UP[0]    === code || KEY.UP[1]    === key) dir = 'up';
  if (KEY.DOWN[0]  === code || KEY.DOWN[1]  === key) dir = 'down';
  if (KEY.LEFT[0]  === code || KEY.LEFT[1]  === key) dir = 'left';
  if (KEY.RIGHT[0] === code || KEY.RIGHT[1] === key) dir = 'right';

  if (!dir) return; // deixa Enter e Back para o handler do app
  e.preventDefault();

  const current = document.activeElement;

  // Se nenhum elemento focado, foca o primeiro visível na tela
  if (!current || !current.matches(FOCUSABLE)) {
    focusFirst();
    return;
  }

  const next = findNext(current, dir);
  if (next) {
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    lastFocused = next;
  }
}

// Acha o melhor candidato na direção dada
function findNext(origin, dir) {
  const or = origin.getBoundingClientRect();
  const ox = or.left + or.width  / 2;
  const oy = or.top  + or.height / 2;

  // Pega todos os focusables visíveis da tela ativa
  const screen = document.querySelector('.screen.active');
  if (!screen) return null;

  const candidates = Array.from(screen.querySelectorAll(FOCUSABLE))
    .filter(el => el !== origin && isVisible(el));

  let best = null;
  let bestScore = Infinity;

  for (const el of candidates) {
    const r  = el.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;

    const dx = cx - ox;
    const dy = cy - oy;

    // Filtra pela direção: o candidato deve estar no quadrante correto
    const inDir = (dir === 'up'    && dy < -4)
               || (dir === 'down'  && dy >  4)
               || (dir === 'left'  && dx < -4)
               || (dir === 'right' && dx >  4);

    if (!inDir) continue;

    // Score: distância primária + penalidade pelo desvio lateral
    let primary, secondary;
    if (dir === 'up'   || dir === 'down')  { primary = Math.abs(dy); secondary = Math.abs(dx); }
    else                                   { primary = Math.abs(dx); secondary = Math.abs(dy); }

    // Descarta candidatos muito fora do eixo (>70% do primário de desvio)
    if (secondary > primary * 2.5) continue;

    const score = primary + secondary * 1.5;
    if (score < bestScore) { bestScore = score; best = el; }
  }

  return best;
}

function isVisible(el) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  // Verifica se está dentro dos limites da viewport (com margem)
  return r.bottom > -50 && r.top < window.innerHeight + 50
      && r.right  > -50 && r.left < window.innerWidth  + 50;
}

// Foca o primeiro elemento focável da tela ativa
function focusFirst(screen) {
  const sc = screen || document.querySelector('.screen.active');
  if (!sc) return;
  const first = sc.querySelector(FOCUSABLE);
  if (first) { first.focus({ preventScroll: true }); lastFocused = first; }
}

// Chama isso ao trocar de tela para resetar o foco
function navResetFocus(screenId) {
  requestAnimationFrame(() => {
    const sc = document.getElementById(screenId);
    if (!sc) return;
    const first = sc.querySelector(FOCUSABLE);
    if (first) { first.focus({ preventScroll: true }); lastFocused = first; }
  });
}

// Foca um elemento específico (usado ao selecionar categoria etc)
function navFocus(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  lastFocused = el;
}
