const BACKEND_URL = window.location.origin;

// ─── CONFIGURAÇÕES ────────────────────────────────────────
const SETTINGS_KEY = 'fusion_settings';
const SETTINGS_DEFAULT = { streamFormat: 'm3u8', player: 'native' };

function getSettings() {
  try { return { ...SETTINGS_DEFAULT, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { ...SETTINGS_DEFAULT }; }
}

function saveSettings(s) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function setSetting(key, val) {
  const s = getSettings();
  s[key] = val;
  saveSettings(s);
  renderSettingsState();
}

function openSettings() {
  renderSettingsState();
  renderServer2State();
  document.getElementById('settings-overlay').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settings-overlay').style.display = 'none';
}

function renderSettingsState() {
  const s = getSettings();
  document.querySelectorAll('#opt-format .opt-btn').forEach(b => b.classList.toggle('active', b.dataset.val === s.streamFormat));
  document.querySelectorAll('#opt-player .opt-btn').forEach(b => b.classList.toggle('active', b.dataset.val === s.player));
}

// STATE
let serverUrl = '';
let serverUrl2 = '';
let currentType = 'live';
let allItems = [];
let allCategories = [];
let selectedLiveChannel = null;
let currentSeriesData = null;
let playerReturnScreen = 'screen-home';
let overlayTimeout = null;
let epgTimeout = null;

// Paginação progressiva
const PAGE_LIVE = 60;
const PAGE_GRID = 30;
let pageState = { items: [], offset: 0, pageSize: 60, observer: null, container: null, renderFn: null };

// ─── CACHE ────────────────────────────────────────────────
const CACHE_KEY = 'fusion_cache';

function cacheGet(type) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    // Invalida se for de outro usuário
    if (cache.user !== localStorage.getItem('xu')) return null;
    return cache[type] || null;
  } catch { return null; }
}

function cacheSave(type, data) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache.user = localStorage.getItem('xu');
    cache.saved_at = Date.now();
    cache[type] = data;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Quota excedida — limpa e tenta de novo sem esse tipo
    if (e.name === 'QuotaExceededError') {
      try { localStorage.removeItem(CACHE_KEY); } catch {}
    }
  }
}

function cacheClear() {
  localStorage.removeItem(CACHE_KEY);
}

// Promises em andamento — evita fetch duplicado para o mesmo tipo
const _fetching = {};

const _catActions  = { live: 'get_live_categories', vod: 'get_vod_categories', series: 'get_series_categories' };
const _itemActions = { live: 'get_live_streams',    vod: 'get_vod_streams',    series: 'get_series' };

// Garante os dados de um tipo: usa cache, promessa em andamento ou inicia nova busca
function ensureTypeData(type) {
  const cached = cacheGet(type);
  if (cached) return Promise.resolve(cached);
  if (_fetching[type]) return _fetching[type];

  _fetching[type] = Promise.all([
    xtream(_catActions[type]),
    xtream(_itemActions[type]),
  ]).then(([categories, items]) => {
    const data = {
      categories: Array.isArray(categories) ? categories : [],
      items:      Array.isArray(items)      ? items      : [],
    };
    cacheSave(type, data);
    delete _fetching[type];
    return data;
  }).catch(() => {
    delete _fetching[type];
    return { categories: [], items: [] };
  });

  return _fetching[type];
}

// Pré-carrega as 3 abas em paralelo logo após o login
async function prefetchAll() {
  await Promise.allSettled(['live', 'vod', 'series'].map(t => ensureTypeData(t)));
  showCacheStatus('Conteúdo atualizado');
}

function showCacheStatus(msg) {
  let el = document.getElementById('cache-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cache-status';
    el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#222;color:#888;padding:10px 28px;border-radius:6px;font-size:20px;letter-spacing:1px;z-index:500;transition:opacity .4s;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

// ─── SERVIDOR 2 (FALLBACK) ───────────────────────────────
function renderServer2State() {
  const el = document.getElementById('inp-server2');
  if (el) {
    el.value = serverUrl2 || '';
    document.getElementById('server2-status').textContent = serverUrl2 ? `Ativo: ${serverUrl2}` : 'Não configurado';
  }
}

// Tenta autenticar em um servidor específico; retorna true se ok
async function tryLoginOnServer(url, username, password) {
  const params = new URLSearchParams({ username, password });
  const target = `${url}/player_api.php?${params}`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(target)}`;
  const data = await fetch(proxyUrl).then(r => r.json());
  return data.user_info && data.user_info.auth != 0;
}

// ─── INIT ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  showLoading(true);
  try {
    const cfg = await fetch(`${BACKEND_URL}/api/config`).then(r => r.json());
    serverUrl  = cfg.serverUrl  || '';
    serverUrl2 = cfg.serverUrl2 || localStorage.getItem('server_url_2') || '';
    if (!serverUrl) { showFatal('Servidor não configurado. Contate o administrador.'); return; }
  } catch {
    showFatal('Não foi possível conectar ao servidor.');
    return;
  } finally {
    showLoading(false);
  }

  setupKeyboard();
  setupPlayerEvents();

  // Auto-login se já tiver credenciais salvas
  const savedUser = localStorage.getItem('xu');
  const savedPass = localStorage.getItem('xp');
  if (savedUser && savedPass) {
    try {
      let ok = await tryLoginOnServer(serverUrl, savedUser, savedPass);
      if (!ok && serverUrl2) ok = await tryLoginOnServer(serverUrl2, savedUser, savedPass);
      if (ok) {
        await goHome();
        prefetchAll();
        checkSubscriptionOnLogin();
        return;
      }
    } catch {}
    localStorage.removeItem('xu');
    localStorage.removeItem('xp');
    cacheClear();
  }

  showScreen('screen-login');
});

// ─── AUTH ─────────────────────────────────────────────────
async function doLogin() {
  const username = document.getElementById('inp-user').value.trim();
  const password = document.getElementById('inp-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  if (!username || !password) { errEl.textContent = 'Preencha usuário e senha'; return; }

  showLoading(true);
  try {
    // Tenta servidor primário
    let ok = false;
    try { ok = await tryLoginOnServer(serverUrl, username, password); } catch {}

    // Se falhou e tem servidor 2, tenta o secundário
    if (!ok && serverUrl2) {
      try {
        ok = await tryLoginOnServer(serverUrl2, username, password);
        if (ok) serverUrl = serverUrl2; // usa servidor 2 como ativo
      } catch {}
    }

    if (!ok) {
      errEl.textContent = 'Usuário ou senha inválidos';
      return;
    }

    localStorage.setItem('xu', username);
    localStorage.setItem('xp', password);
    cacheClear();
    await goHome();
    prefetchAll();
    checkSubscriptionOnLogin();
  } catch {
    errEl.textContent = 'Erro ao conectar ao servidor';
  } finally {
    showLoading(false);
  }
}

function logout() {
  localStorage.removeItem('xu');
  localStorage.removeItem('xp');
  cacheClear();
  stopPlayer();
  stopLivePreview();
  showScreen('screen-login');
}

// ─── HOME ─────────────────────────────────────────────────
async function goHome() {
  showScreen('screen-home');
  stopPlayer();
  await switchContentType('live', document.querySelector('.content-tab[data-type="live"]'));
}

async function switchContentType(type, el) {
  currentType = type;
  document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');

  if (type === 'live') {
    document.getElementById('live-layout').style.display = 'flex';
    document.getElementById('grid-layout').style.display = 'none';
  } else {
    // Só para o preview ao sair do live
    stopLivePreview();
    document.getElementById('live-layout').style.display = 'none';
    document.getElementById('grid-layout').style.display = 'flex';
    document.getElementById('search-input').value = '';
  }

  // Só mostra loading se os dados ainda não estão prontos
  const needsLoad = !cacheGet(type) && !_fetching[type];
  if (needsLoad) showLoading(true);
  try {
    await loadCategories();
  } finally {
    showLoading(false);
  }
}

// ─── CATEGORIAS + CONTEÚDO ────────────────────────────────
async function loadCategories() {
  const data = await ensureTypeData(currentType);
  allCategories = data.categories;
  allItems      = data.items;

  // Conta itens por categoria para exibir no sidebar
  const countMap = {};
  allItems.forEach(i => {
    const cid = i.category_id;
    countMap[cid] = (countMap[cid] || 0) + 1;
  });

  const listId = currentType === 'live' ? 'live-category-list' : 'grid-category-list';
  const nav = document.getElementById(listId);
  nav.innerHTML = '';

  const allEl = makeCatItem('', 'Tudo', allItems.length, true);
  nav.appendChild(allEl);
  allCategories.forEach(c => {
    nav.appendChild(makeCatItem(c.category_id, c.category_name, countMap[c.category_id] || 0, false));
  });

  selectCategory('', 'Tudo', allEl);
}

function makeCatItem(id, name, count, selected) {
  const el = document.createElement('div');
  el.className = 'cat-item focusable' + (selected ? ' selected' : '');
  el.innerHTML = `<span>${name}</span><span class="cat-count">${count}</span>`;
  el.onclick = () => selectCategory(id, name, el);
  return el;
}

// Filtra localmente — sem chamada à API
function selectCategory(catId, catName, el) {
  const listId = currentType === 'live' ? 'live-category-list' : 'grid-category-list';
  document.querySelectorAll(`#${listId} .cat-item`).forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');

  const filtered = catId ? allItems.filter(i => i.category_id === catId) : allItems;

  if (currentType === 'live') {
    document.getElementById('live-search').value = '';
    renderChannelList(filtered);
  } else {
    document.getElementById('cat-title').textContent = catName;
    document.getElementById('search-input').value = '';
    renderGrid(filtered);
  }
}

// ─── PAGINAÇÃO PROGRESSIVA ────────────────────────────────
function initPagination(container, items, pageSize, renderBatchFn) {
  // Remove scroll listener anterior
  if (pageState._scrollEl && pageState._scrollFn) {
    pageState._scrollEl.removeEventListener('scroll', pageState._scrollFn);
  }
  if (pageState.observer) pageState.observer.disconnect();

  // O scroll pode estar no container ou no pai (ex: .content-grid-scroll wrapping o grid)
  const scrollEl = container.parentElement && container.parentElement.classList.contains('content-grid-scroll')
    ? container.parentElement
    : container;

  pageState = { items, offset: 0, pageSize, observer: null, container, renderFn: renderBatchFn, _scrollEl: scrollEl, _scrollFn: null };
  container.innerHTML = '';

  if (!items.length) {
    container.innerHTML = '<div class="empty-msg">Nenhum item encontrado</div>';
    return;
  }

  loadNextPage();

  // Scroll event — dispara quando faltar 400px pro fim
  const onScroll = () => {
    if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 400) {
      loadNextPage();
    }
  };
  scrollEl.addEventListener('scroll', onScroll, { passive: true });
  pageState._scrollFn = onScroll;
}

function loadNextPage() {
  const { items, offset, pageSize, container, renderFn } = pageState;
  if (offset >= items.length) return;

  const batch = items.slice(offset, offset + pageSize);
  batch.forEach(item => container.appendChild(renderFn(item)));
  pageState.offset += batch.length;
}

// ─── AO VIVO: lista de canais ─────────────────────────────
function renderChannelList(channels) {
  const list = document.getElementById('channel-list');
  const playingId = selectedLiveChannel ? String(selectedLiveChannel.stream_id) : null;

  initPagination(list, channels, PAGE_LIVE, (ch) => {
    const el = document.createElement('div');
    el.className = 'ch-item focusable';
    el.tabIndex = 0;
    el.dataset.id = ch.stream_id;

    const logo = ch.stream_icon
      ? `<div class="ch-logo-wrap"><img src="${ch.stream_icon}" alt="" onerror="this.parentElement.innerHTML='<div class=\\'ch-logo-empty\\'></div>'" /></div>`
      : `<div class="ch-logo-wrap"><div class="ch-logo-empty"></div></div>`;

    el.innerHTML = `<span class="ch-num">${ch.num || ''}</span>${logo}<span class="ch-name-text">${ch.name}</span>`;
    el.onclick = () => selectLiveChannel(ch, el);
    el.ondblclick = () => { selectLiveChannel(ch, el); playSelectedLive(); };
    el.onkeydown = e => { if (e.key === 'Enter') playSelectedLive(); };
    return el;
  });

  if (playingId) {
    // Restaura marcação visual do canal em reprodução — sem reiniciar o stream
    const activeEl = list.querySelector(`[data-id="${playingId}"]`);
    if (activeEl) activeEl.classList.add('selected');
  } else {
    // Nenhum canal ativo: seleciona e inicia o primeiro
    const first = list.querySelector('.ch-item');
    if (first && channels.length) { selectLiveChannel(channels[0], first); navFocus(first); }
  }
}

function filterLive(q) {
  const filtered = q ? allItems.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : allItems;
  renderChannelList(filtered);
}

function selectLiveChannel(ch, el) {
  document.querySelectorAll('.ch-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  selectedLiveChannel = ch;
  navFocus(el);

  document.getElementById('live-ch-name').textContent = ch.name;
  document.getElementById('epg-list').innerHTML = '<div style="color:#333;font-size:20px">Carregando programação...</div>';

  // Preview de vídeo
  loadLivePreview(ch);

  // EPG
  clearTimeout(epgTimeout);
  epgTimeout = setTimeout(() => loadEpg(ch.stream_id), 400);
}

function loadLivePreview(ch) {
  const { xu: u, xp: p } = getCredentials();
  const fmt = getSettings().streamFormat;
  const url = `${serverUrl}/live/${u}/${p}/${ch.stream_id}.${fmt}`;
  const video = document.getElementById('live-preview-video');
  const placeholder = document.getElementById('live-preview-placeholder');
  placeholder.style.display = 'none';
  video.src = url;
  video.play().catch(() => {});
}

function stopLivePreview() {
  const video = document.getElementById('live-preview-video');
  video.pause(); video.src = '';
  document.getElementById('live-preview-placeholder').style.display = 'flex';
}

function clearLivePreview() {
  stopLivePreview();
  document.getElementById('live-ch-name').textContent = '';
  document.getElementById('epg-list').innerHTML = '';
}

function decodeEpgTitle(raw) {
  if (!raw) return '—';
  try {
    // Xtream envia base64 com UTF-8 — precisa decodificar em dois passos
    const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes).replace(/<[^>]+>/g, '').trim() || '—';
  } catch {
    // Se não for base64, usa o valor direto
    return raw.replace(/<[^>]+>/g, '').trim() || '—';
  }
}

async function loadEpg(streamId) {
  try {
    const data = await xtream('get_short_epg', { stream_id: streamId, limit: 5 });
    const epgEl = document.getElementById('epg-list');
    const items = data.epg_listings || [];
    if (!items.length) {
      epgEl.innerHTML = '<div style="color:#333;font-size:20px">Sem programação disponível</div>';
      return;
    }

    const now = Date.now() / 1000;
    epgEl.innerHTML = items.map(ep => {
      // start/stop podem vir como "2024-01-01 12:00:00" ou timestamp
      const startDate = new Date(ep.start.includes(' ') ? ep.start.replace(' ', 'T') : ep.start * 1000);
      const stopDate  = new Date(ep.stop.includes(' ')  ? ep.stop.replace(' ', 'T')  : ep.stop * 1000);
      const start = startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const end   = stopDate.toLocaleTimeString('pt-BR',  { hour: '2-digit', minute: '2-digit' });
      const title = decodeEpgTitle(ep.title);
      const startTs = ep.start_timestamp || startDate.getTime() / 1000;
      const stopTs  = ep.stop_timestamp  || stopDate.getTime() / 1000;
      const isCurrent = startTs <= now && stopTs >= now;
      return `<div class="epg-item${isCurrent ? ' now' : ''}">
        <span class="epg-time">${start} - ${end}</span>
        <span class="epg-show">${title}</span>
      </div>`;
    }).join('');
  } catch {
    document.getElementById('epg-list').innerHTML = '<div style="color:#333;font-size:20px">Sem programação disponível</div>';
  }
}

function playSelectedLive() {
  if (!selectedLiveChannel) return;
  stopLivePreview();
  playLive(selectedLiveChannel);
}

// ─── GRID FILMES / SERIES ────────────────────────────────
function renderGrid(items) {
  const grid = document.getElementById('content-grid');
  const scrollEl = grid.parentElement;
  if (scrollEl) scrollEl.scrollTop = 0;

  function thumb(src) {
    return `<div class="card-thumb">${src
      ? `<img src="${src}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="card-thumb-empty" style="display:none">SEM CAPA</div>`
      : `<div class="card-thumb-empty">SEM CAPA</div>`}</div>`;
  }

  initPagination(grid, items, PAGE_GRID, item => {
    const card = document.createElement('div');
    card.className = 'content-card focusable';
    card.tabIndex = 0;

    // VOD: stream_icon é a capa (TMDB w600_and_h900 portrait)
    // Series: cover é a capa (TMDB w600_and_h900 portrait)
    const cover = currentType === 'vod'
      ? (item.stream_icon || '')
      : (item.cover || '');

    // title é o nome limpo sem o ano entre parênteses
    const displayName = item.title || item.name || '';

    // Série não tem year, mas tem release_date
    const displayYear = item.year
      || (item.release_date || item.releaseDate || '').split('-')[0]
      || '';

    card.innerHTML = `${thumb(cover)}<div class="card-info"><div class="card-name">${displayName}</div>${displayYear ? `<div class="card-year">${displayYear}</div>` : ''}</div>`;

    if (currentType === 'vod') {
      card.onclick = () => playVod(item);
    } else {
      card.onclick = () => openSeries(item);
    }

    card.onkeydown = e => { if (e.key === 'Enter') card.click(); };
    return card;
  });
}

function filterContent(q) {
  const filtered = q ? allItems.filter(i => (i.name || '').toLowerCase().includes(q.toLowerCase())) : allItems;
  renderGrid(filtered);
}

// ─── SÉRIE DETALHE ────────────────────────────────────────
async function openSeries(series) {
  showLoading(true);
  try {
    const info = await xtream('get_series_info', { series_id: series.series_id });
    currentSeriesData = info;

    document.getElementById('series-title').textContent = series.name;
    document.getElementById('series-meta').textContent =
      [series.year, series.genre].filter(Boolean).join(' · ');

    const cover = series.cover || info.info?.cover || '';
    const coverEl = document.getElementById('series-cover');
    if (cover) { coverEl.src = cover; coverEl.style.display = 'block'; }
    else coverEl.style.display = 'none';

    const seasonsList = document.getElementById('seasons-list');
    seasonsList.innerHTML = '';
    const seasons = Object.keys(info.episodes || {}).sort((a, b) => Number(a) - Number(b));

    if (!seasons.length) {
      seasonsList.innerHTML = '<div style="padding:20px;color:#555">Sem episódios</div>';
    } else {
      seasons.forEach((s, i) => {
        const el = document.createElement('div');
        el.className = 'season-item focusable' + (i === 0 ? ' selected' : '');
        el.textContent = `Temporada ${s}`;
        el.onclick = () => selectSeason(s, el, info.episodes);
        seasonsList.appendChild(el);
      });
      selectSeason(seasons[0], seasonsList.firstChild, info.episodes);
    }

    showScreen('screen-series');
  } finally {
    showLoading(false);
  }
}

function selectSeason(season, el, episodes) {
  document.querySelectorAll('.season-item').forEach(i => i.classList.remove('selected'));
  el.classList.add('selected');
  const epList = document.getElementById('episodes-list');
  epList.innerHTML = '';
  (episodes[season] || []).forEach(ep => {
    const div = document.createElement('div');
    div.className = 'episode-item focusable';
    div.tabIndex = 0;
    div.innerHTML = `
      <div class="ep-num">EP ${ep.episode_num}</div>
      <div class="ep-info">
        <div class="ep-title">${ep.title || `Episódio ${ep.episode_num}`}</div>
        ${ep.info?.duration ? `<div class="ep-duration">${ep.info.duration}</div>` : ''}
      </div>
      <div class="ep-play">&#9654;</div>`;
    div.onclick = () => playEpisode(ep);
    div.onkeydown = e => { if (e.key === 'Enter') div.click(); };
    epList.appendChild(div);
  });
}

// ─── PLAYER ───────────────────────────────────────────────
function playLive(ch) {
  const { xu: u, xp: p } = getCredentials();
  const fmt = getSettings().streamFormat;
  const url = `${serverUrl}/live/${u}/${p}/${ch.stream_id}.${fmt}`;
  const cat = allCategories.find(c => c.category_id === ch.category_id)?.category_name || 'Ao Vivo';
  startPlayer(url, cat, ch.name, '', 'screen-home');
}

function playVod(item) {
  const { xu: u, xp: p } = getCredentials();
  const ext = item.container_extension || 'mp4';
  const url = `${serverUrl}/movie/${u}/${p}/${item.stream_id}.${ext}`;
  const cat = allCategories.find(c => c.category_id === item.category_id)?.category_name || 'Filmes';
  startPlayer(url, cat, item.name, item.year || '', 'screen-home');
}

function playEpisode(ep) {
  const { xu: u, xp: p } = getCredentials();
  const ext = ep.container_extension || 'mp4';
  const url = `${serverUrl}/series/${u}/${p}/${ep.id}.${ext}`;
  const seriesTitle = document.getElementById('series-title').textContent;
  startPlayer(url, seriesTitle, `Episódio ${ep.episode_num}`, ep.title || '', 'screen-series');
}

function startPlayer(url, cat, name, sub, returnTo) {
  playerReturnScreen = returnTo;
  document.getElementById('player-cat').textContent = cat;
  document.getElementById('player-name').textContent = name;
  document.getElementById('player-sub').textContent = sub;
  showScreen('screen-player');
  showOverlay();

  if (getSettings().player === 'avplay' && window.webapis?.avplay) {
    _avPlayStart(url);
  } else {
    const video = document.getElementById('player');
    video.src = url;
    video.play().catch(() => {});
  }
}

function _avPlayStart(url) {
  try {
    const av = webapis.avplay;
    av.open(url);
    av.setDisplayRect(0, 0, 1920, 1080);
    av.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
    av.play();
  } catch (e) {
    // AVPlay não disponível — fallback para HTML5
    const video = document.getElementById('player');
    video.src = url;
    video.play().catch(() => {});
  }
}

function stopPlayer() {
  if (getSettings().player === 'avplay' && window.webapis?.avplay) {
    try { webapis.avplay.stop(); webapis.avplay.close(); } catch {}
  }
  const v = document.getElementById('player');
  v.pause(); v.src = '';
}

function backFromPlayer() {
  stopPlayer();
  showScreen(playerReturnScreen);
  if (playerReturnScreen === 'screen-home' && currentType === 'live' && selectedLiveChannel) {
    loadLivePreview(selectedLiveChannel);
  }
}

function toggleMute() {
  const v = document.getElementById('player');
  v.muted = !v.muted;
  document.getElementById('btn-mute').textContent = v.muted ? '🔇' : '🔊';
}

function togglePlayPause() {
  const v = document.getElementById('player');
  if (v.paused) { v.play(); document.getElementById('btn-play-pause').innerHTML = '&#9646;&#9646;'; }
  else          { v.pause(); document.getElementById('btn-play-pause').innerHTML = '&#9654;'; }
}

function playerSeek(sec) {
  const v = document.getElementById('player');
  if (!isFinite(v.duration)) return;
  v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec));
  showOverlay();
}

function playerSeekClick(e, wrap) {
  const v = document.getElementById('player');
  if (!isFinite(v.duration)) return;
  const rect = wrap.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  v.currentTime = ratio * v.duration;
  showOverlay();
}

function fmtTime(s) {
  if (!isFinite(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
    : `${m}:${String(ss).padStart(2,'0')}`;
}

function setupPlayerEvents() {
  const v = document.getElementById('player');
  v.addEventListener('timeupdate', () => {
    if (!isFinite(v.duration)) return;
    const pct = (v.currentTime / v.duration) * 100;
    document.getElementById('player-progress-fill').style.width = pct + '%';
    document.getElementById('player-time-cur').textContent = fmtTime(v.currentTime);
    document.getElementById('player-time-dur').textContent = fmtTime(v.duration);
  });
  v.addEventListener('play',  () => { document.getElementById('btn-play-pause').innerHTML = '&#9646;&#9646;'; });
  v.addEventListener('pause', () => { document.getElementById('btn-play-pause').innerHTML = '&#9654;'; });
  v.addEventListener('ended', () => backFromPlayer());
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

function showOverlay() {
  const ov = document.getElementById('player-overlay');
  ov.classList.add('visible');
  clearTimeout(overlayTimeout);
  overlayTimeout = setTimeout(() => ov.classList.remove('visible'), 4000);
}

// ─── KEYBOARD ─────────────────────────────────────────────
function setupKeyboard() {
  // Motor de navegação espacial (setas do D-pad)
  navInit();

  document.addEventListener('keydown', e => {
    const screen = document.querySelector('.screen.active')?.id;
    const code = e.keyCode;
    const key  = e.key;
    const isBack  = code === 10009 || code === 8  || key === 'Backspace' || key === 'XF86Back';
    const isEnter = code === 13 || key === 'Enter';

    // Fecha configurações com Back
    if (isBack && document.getElementById('settings-overlay').style.display !== 'none') {
      e.preventDefault(); closeSettings(); return;
    }

    if (screen === 'screen-login') {
      if (isEnter) { doLogin(); return; }
    }

    if (screen === 'screen-player') {
      showOverlay();
      if (isBack)  { e.preventDefault(); backFromPlayer(); return; }
      if (isEnter || key === ' ') { e.preventDefault(); togglePlayPause(); return; }
      if (code === 37 || key === 'ArrowLeft')  { e.preventDefault(); playerSeek(-10); return; }
      if (code === 39 || key === 'ArrowRight') { e.preventDefault(); playerSeek(10);  return; }
      if (code === 38 || key === 'ArrowUp')    { e.preventDefault(); playerSeek(30);  return; }
      if (code === 40 || key === 'ArrowDown')  { e.preventDefault(); playerSeek(-30); return; }
      return;
    }

    if (screen === 'screen-series') {
      if (isBack) { e.preventDefault(); showScreen('screen-home'); return; }
    }

    if (screen === 'screen-subscription') {
      if (isBack) {
        e.preventDefault();
        const renewVisible = document.getElementById('sub-renew-panel').style.display !== 'none';
        if (renewVisible) {
          // Volta pro painel de info
          document.getElementById('sub-info-panel').style.display  = 'flex';
          document.getElementById('sub-renew-panel').style.display = 'none';
        } else {
          showScreen('screen-home');
        }
        return;
      }
    }

    if (screen === 'screen-home') {
      if (isBack) { e.preventDefault(); logout(); return; }
    }
  });

  // Registra teclas do controle remoto Tizen
  if (window.tizen) {
    try {
      const keys = ['Back', 'MediaPlayPause', 'MediaStop',
                    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      keys.forEach(k => {
        try { tizen.tvinputdevice.registerKey(k); } catch {}
      });
    } catch {}
  }
}

// ─── ASSINATURA ───────────────────────────────────────────
let _subData = null;

async function loadSubscription() {
  const { xu } = getCredentials();
  if (!xu) return null;
  try {
    const r = await fetch(`${BACKEND_URL}/api/subscription?username=${encodeURIComponent(xu)}`);
    if (!r.ok) return null;
    _subData = await r.json();
    return _subData;
  } catch { return null; }
}

function isExpired(data) {
  if (!data) return false;
  // Verifica status explícito primeiro
  if (data.status && data.status !== 'ACTIVE') return true;
  if (!data.expires_at) return false;
  // Remove microsegundos (formato "2026-07-07T02:59:59.000000Z") para parse correto
  const dateStr = data.expires_at.replace(/(\.\d{3})\d*Z$/, '$1Z');
  const d = new Date(dateStr);
  return !isNaN(d) && d < new Date();
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function openSubscription() {
  // Desmarca tabs de conteúdo
  document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.content-tab[data-type="subscription"]').classList.add('active');

  showLoading(true);
  const data = _subData || await loadSubscription();
  showLoading(false);

  const badge    = document.getElementById('sub-badge');
  const expires  = document.getElementById('sub-expires');
  const pkg      = document.getElementById('sub-package');
  const renewBtn = document.getElementById('sub-renew-btn');

  if (!data) {
    badge.textContent = 'SEM DADOS';
    badge.className = 'sub-status-badge loading';
    expires.textContent = '—';
    pkg.textContent = '—';
    renewBtn.style.display = 'none';
  } else {
    const expired = isExpired(data);
    badge.textContent  = expired ? 'VENCIDO' : 'ATIVO';
    badge.className    = 'sub-status-badge ' + (expired ? 'expired' : 'active');
    expires.textContent = fmtDate(data.expires_at);
    pkg.textContent    = data.package || '—';
    renewBtn.style.display = 'block';
  }

  // Mostra painel de info, esconde renovação
  document.getElementById('sub-info-panel').style.display  = 'flex';
  document.getElementById('sub-renew-panel').style.display = 'none';

  showScreen('screen-subscription');
}

function openRenewScreen() {
  const data = _subData;
  const url  = (data && data.renew_url) || '';

  document.getElementById('renew-url-text').textContent = url || 'Entre em contato com o suporte';

  const qr = document.getElementById('renew-qr');
  if (url) {
    qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
    qr.style.display = 'block';
  } else {
    qr.style.display = 'none';
  }

  document.getElementById('sub-info-panel').style.display  = 'none';
  document.getElementById('sub-renew-panel').style.display = 'flex';
}

// Verifica assinatura após login — abre tela de assinatura se vencido
async function checkSubscriptionOnLogin() {
  const data = await loadSubscription();
  if (data && isExpired(data)) {
    openSubscription(); // mostra painel de info com badge VENCIDO e botão Renovar
  }
}

// ─── UTILS ────────────────────────────────────────────────
function xtream(action, extra = {}) {
  const { xu: u, xp: p } = getCredentials();
  const params = new URLSearchParams({ username: u, password: p, ...(action ? { action } : {}), ...extra });
  return fetch(`${serverUrl}/player_api.php?${params}`).then(r => r.json());
}

function getCredentials() {
  return { xu: localStorage.getItem('xu') || '', xp: localStorage.getItem('xp') || '' };
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  navResetFocus(id);
}

function showLoading(show) {
  document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

function showFatal(msg) {
  document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:20px;font-size:32px;color:#fff;text-align:center;padding:60px;background:#000">${msg}</div>`;
}
