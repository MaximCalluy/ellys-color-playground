'use strict';

/* ============================================================
   Constants
   ============================================================ */

const STORAGE_KEY = 'elly-playground-v1';
const MAX_PALETTE = 8;

const SHADE_STEPS = [
  { step: 50,  l: 96 },
  { step: 100, l: 92 },
  { step: 200, l: 84 },
  { step: 300, l: 73 },
  { step: 400, l: 60 },
  { step: 500, l: 47 },
  { step: 600, l: 35 },
  { step: 700, l: 25 },
  { step: 800, l: 17 },
  { step: 900, l: 10 },
  { step: 950, l: 6  },
];

const RATING_LABEL = {
  fail:       'Fail',
  'aa-large': 'AA Large',
  aa:         'AA',
  aaa:        'AAA',
};

const RATING_META_CLASS = {
  fail:       'meta--fail',
  'aa-large': 'meta--warning',
  aa:         'meta--pass',
  aaa:        'meta--pass',
};

const DEFAULT_PALETTE = [
  { id: 'c1', name: 'CTA Blue',   hex: '#00799E' },
  { id: 'c2', name: 'Deep Teal',  hex: '#034656' },
  { id: 'c3', name: 'Mint',       hex: '#BBF6E2' },
  { id: 'c4', name: 'Light Blue', hex: '#EBFBFF' },
  { id: 'c5', name: 'Text',       hex: '#434751' },
];

/* ============================================================
   SVG Icons
   ============================================================ */

const ICON_EDIT = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M7.5 1.5 10.5 4.5 3.5 10.5H0.5V7.5L7.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 3 9 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

const ICON_TRASH = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M1 3H11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M4 3V2H8V3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 3L2.5 10H9.5L10 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 5.5V7.5M7 5.5V7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

const ICON_COLOR_PICKER = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.5"/>
  <path d="M12 3.75A8.25 8.25 0 0 1 20.25 12" stroke="#e05252" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M20.25 12A8.25 8.25 0 0 1 12 20.25" stroke="#52a852" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M12 20.25A8.25 8.25 0 0 1 3.75 12" stroke="#5252e0" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M3.75 12A8.25 8.25 0 0 1 12 3.75" stroke="#e0bb52" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.2"/>
</svg>`;

const ICON_CHECK = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
  <path d="M2 5.5 4.5 8 8.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/* ============================================================
   Color Math
   ============================================================ */

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l   = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r:  h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g:  h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgb(h, s, l);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
}

function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

function relativeLuminance(r, g, b) {
  const lin = c => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagRating(ratio) {
  if (ratio >= 7)   return 'aaa';
  if (ratio >= 4.5) return 'aa';
  if (ratio >= 3)   return 'aa-large';
  return 'fail';
}

/* ============================================================
   Shade Generation
   ============================================================ */

function generateShades(h, s) {
  return SHADE_STEPS.map(({ step, l }) => ({ step, l, hex: hslToHex(h, s, l) }));
}

function closestShadeIndex(currentL) {
  let best = 0;
  let bestDist = Infinity;
  SHADE_STEPS.forEach(({ l }, i) => {
    const dist = Math.abs(l - currentL);
    if (dist < bestDist) { bestDist = dist; best = i; }
  });
  return best;
}

/* ============================================================
   Color Name Generator
   ============================================================ */

function generateColorName(h, s, l) {
  if (s < 10) {
    if (l < 15) return 'Near Black';
    if (l < 35) return 'Dark Gray';
    if (l < 65) return 'Gray';
    if (l < 85) return 'Light Gray';
    return 'Near White';
  }
  const hueTable = [
    [0,   10,  'Red'],        [10,  20,  'Red-Orange'],
    [20,  45,  'Orange'],     [45,  55,  'Amber'],
    [55,  70,  'Yellow'],     [70,  85,  'Yellow-Green'],
    [85,  150, 'Green'],      [150, 165, 'Teal'],
    [165, 195, 'Cyan'],       [195, 225, 'Sky Blue'],
    [225, 255, 'Blue'],       [255, 280, 'Indigo'],
    [280, 320, 'Purple'],     [320, 345, 'Pink'],
    [345, 361, 'Red'],
  ];
  let name = 'Color';
  for (const [min, max, label] of hueTable) {
    if (h >= min && h < max) { name = label; break; }
  }
  if (l < 25) return `Dark ${name}`;
  if (l > 75) return `Light ${name}`;
  return name;
}

/* ============================================================
   Validation & Normalisation
   ============================================================ */

function isValidHex(hex) {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex.trim());
}

function normalizeHex(hex) {
  return '#' + hex.trim().replace(/^#/, '').toUpperCase();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   State
   ============================================================ */

let state = {
  palette:    [],
  selectedId: null,
  editingId:  null,
  filters: { fail: true, 'aa-large': true, aa: true, aaa: true },
};

/* ============================================================
   Persistence
   ============================================================ */

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        state.palette    = saved;
        state.selectedId = saved[0].id;
        return;
      }
    }
  } catch (_) { /* ignore malformed storage */ }

  // Fall back to defaults
  state.palette    = DEFAULT_PALETTE.map(c => ({ ...c }));
  state.selectedId = state.palette[0].id;
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.palette));
}

/* ============================================================
   Announce (aria-live)
   ============================================================ */

function announce(msg) {
  const el = document.getElementById('live-region');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

/* ============================================================
   Render — Palette sidebar
   ============================================================ */

function renderPalette() {
  const list  = document.getElementById('palette-list');
  const empty = document.getElementById('palette-empty');
  if (!list) return;

  if (state.palette.length === 0) {
    list.innerHTML = '';
    if (empty) empty.hidden = false;
  } else {
    if (empty) empty.hidden = true;
    list.innerHTML = state.palette.map(colorItemHTML).join('');
  }

  const addBtn = document.getElementById('add-btn');
  if (addBtn) addBtn.disabled = state.palette.length >= MAX_PALETTE;
}

function colorItemHTML(color) {
  const sel     = state.selectedId === color.id;
  const editing = state.editingId  === color.id;

  const nameHTML = editing
    ? `<input class="color-item__name-input"
               type="text"
               value="${escHtml(color.name)}"
               maxlength="30"
               data-id="${color.id}"
               aria-label="Rename colour"
               spellcheck="false">`
    : `<span class="color-item__name">${escHtml(color.name)}</span>`;

  return `<li class="color-item${sel ? ' is-selected' : ''}${editing ? ' is-editing' : ''}"
             data-id="${color.id}"
             tabindex="${editing ? -1 : 0}"
             role="option"
             aria-selected="${sel}">
    <div class="color-item__container">
      <div class="color-item__swatch" style="background:${color.hex};"></div>
      <div class="color-item__info">
        ${nameHTML}
        <span class="color-item__hex">${color.hex.toUpperCase()}</span>
      </div>
    </div>
    <div class="color-item__actions" role="group" aria-label="Actions for ${escHtml(color.name)}">
      <button class="icon-btn icon-btn--edit${editing ? ' is-active' : ''}"
              data-id="${color.id}"
              aria-label="${editing ? 'Save name' : 'Edit ' + escHtml(color.name)}"
              aria-pressed="${editing}">${ICON_EDIT}</button>
      <button class="icon-btn icon-btn--delete"
              data-id="${color.id}"
              aria-label="Delete ${escHtml(color.name)}">${ICON_TRASH}</button>
    </div>
  </li>`;
}

/* ============================================================
   Render — Color editor
   ============================================================ */

function renderColorEditor() {
  const color        = state.palette.find(c => c.id === state.selectedId);
  const editorActive = document.getElementById('editor-active');
  const editorEmpty  = document.getElementById('editor-empty');

  if (!color) {
    if (editorActive) editorActive.hidden = true;
    if (editorEmpty)  editorEmpty.hidden  = false;
    const sub = document.getElementById('editor-subtitle');
    if (sub) sub.textContent = '';
    return;
  }

  if (editorActive) editorActive.hidden = false;
  if (editorEmpty)  editorEmpty.hidden  = true;

  const { h, s, l } = hexToHsl(color.hex);

  const subtitle = document.getElementById('editor-subtitle');
  if (subtitle) subtitle.textContent = `Editing: ${color.name}`;

  document.getElementById('preview-swatch').style.background = color.hex;
  document.getElementById('preview-hex').textContent         = color.hex.toUpperCase();
  document.getElementById('preview-hsl').textContent         = `hsl(${h}°, ${s}%, ${l}%)`;

  document.getElementById('slider-hue').value        = h;
  document.getElementById('slider-saturation').value = s;
  document.getElementById('slider-lightness').value  = l;

  document.getElementById('value-hue').textContent        = `${h}°`;
  document.getElementById('value-saturation').textContent = `${s}%`;
  document.getElementById('value-lightness').textContent  = `${l}%`;

  updateSliderVars(h, s, l);
  renderShades(h, s, l);
}

function updateSliderVars(h, s, l) {
  const container = document.getElementById('hsl-sliders');
  if (!container) return;
  container.style.setProperty('--slider-h', h);
  container.style.setProperty('--slider-s', s + '%');
  container.style.setProperty('--slider-l', l + '%');
}

/* ============================================================
   Render — Shade strip
   ============================================================ */

function renderShades(h, s, l) {
  const strip = document.getElementById('shade-strip');
  if (!strip) return;

  const shades    = generateShades(h, s);
  const activeIdx = closestShadeIndex(l);

  strip.innerHTML = shades.map(({ step, hex }, i) => {
    const isActive = i === activeIdx;
    return `<div class="shade-item${isActive ? ' is-active' : ''}">
      <div class="shade-item__swatch" style="background:${hex};" title="${hex}"></div>
      <span class="shade-item__label"${isActive ? ` style="color:${hex};"` : ''}>${step}</span>
    </div>`;
  }).join('');
}

/* ============================================================
   Render — Contrast matrix
   ============================================================ */

function renderMatrix() {
  const container = document.getElementById('matrix-container');
  if (!container) return;

  if (state.palette.length < 2) {
    container.innerHTML = `<p class="matrix-empty">Add at least 2 colours to see the contrast matrix.</p>`;
    return;
  }

  const colHeaders = state.palette.map(c => `
    <th scope="col" class="matrix-col-header">
      <div class="matrix-col-header__swatch" style="background:${c.hex};" aria-hidden="true"></div>
      <div class="matrix-col-header__hex">${c.hex.toUpperCase()}</div>
    </th>`).join('');

  const bodyRows = state.palette.map(textColor => {
    const cells = state.palette.map(bgColor => {
      if (textColor.id === bgColor.id) {
        return `<td class="matrix-cell matrix-cell--diagonal"
                    aria-label="Same colour — no contrast value">
          <span aria-hidden="true">—</span>
        </td>`;
      }

      const ratio    = contrastRatio(textColor.hex, bgColor.hex);
      const rating   = wcagRating(ratio);
      const ratioFmt = ratio.toFixed(1) + ':1';
      const badge    = RATING_LABEL[rating];
      const metaCls  = RATING_META_CLASS[rating];
      const filtered = !state.filters[rating];

      return `<td class="matrix-cell${filtered ? ' is-filtered' : ''}"
                  style="background:${bgColor.hex};"
                  data-rating="${rating}"
                  aria-label="${escHtml(textColor.name)} on ${escHtml(bgColor.name)}: ${ratioFmt}, ${badge}">
        <span class="matrix-cell__text" style="color:${textColor.hex};">Text</span>
        <div class="matrix-cell__meta ${metaCls}" aria-hidden="true">
          <span class="matrix-cell__ratio">${ratioFmt}</span>
          <span class="matrix-cell__badge">${badge}</span>
        </div>
      </td>`;
    }).join('');

    return `<tr>
      <th scope="row" class="matrix-row-header">
        <div class="matrix-row-header__inner">
          <div class="matrix-row-header__swatch" style="background:${textColor.hex};"></div>
          <span class="matrix-row-header__hex">${textColor.hex.toUpperCase()}</span>
        </div>
      </th>
      ${cells}
    </tr>`;
  }).join('');

  container.innerHTML = `
    <div class="matrix-scroll"
         tabindex="0"
         role="region"
         aria-label="Colour contrast matrix, ${state.palette.length} colours">
      <table class="matrix-table">
        <thead>
          <tr>
            <th class="matrix-corner" scope="col">
              <p>Background →</p>
              <p>Text ↓</p>
            </th>
            ${colHeaders}
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

/* ============================================================
   Apply filter visibility (without rebuilding the matrix)
   ============================================================ */

function applyFilters() {
  document.querySelectorAll('.matrix-cell[data-rating]').forEach(cell => {
    cell.classList.toggle('is-filtered', !state.filters[cell.dataset.rating]);
  });
}

/* ============================================================
   Full re-render
   ============================================================ */

function renderAll() {
  renderPalette();
  renderColorEditor();
  renderMatrix();
}

/* ============================================================
   Event Handlers
   ============================================================ */

// ── Add colour ──
function handleAddColor() {
  const input = document.getElementById('hex-input');
  const raw   = input.value.trim();

  if (!raw) {
    showError('Please enter a hex colour (e.g. #00799E)');
    return;
  }
  if (!isValidHex(raw)) {
    showError('Invalid format — use 6-digit hex (e.g. #00799E)');
    return;
  }
  if (state.palette.length >= MAX_PALETTE) {
    showError(`Maximum ${MAX_PALETTE} colours in the palette`);
    return;
  }

  const hex  = normalizeHex(raw);

  if (state.palette.some(c => c.hex.toUpperCase() === hex.toUpperCase())) {
    showError('This colour is already in your palette');
    return;
  }
  const { h, s, l } = hexToHsl(hex);
  const name = generateColorName(h, s, l);
  const id   = 'c' + Date.now();

  state.palette.push({ id, name, hex });
  state.selectedId = id;
  input.value = '';
  clearError();

  renderAll();
  announce(`${name} added to palette`);
}

// ── Select colour ──
function handleSelectColor(id) {
  state.selectedId = id;
  document.querySelectorAll('.color-item').forEach(el => {
    const isThis = el.dataset.id === id;
    el.classList.toggle('is-selected', isThis);
    el.setAttribute('aria-selected', String(isThis));
  });
  renderColorEditor();
}

// ── Delete colour ──
function handleDeleteColor(id) {
  const idx = state.palette.findIndex(c => c.id === id);
  if (idx === -1) return;
  const name = state.palette[idx].name;
  state.palette.splice(idx, 1);

  if (state.selectedId === id) {
    state.selectedId = state.palette.length > 0
      ? state.palette[Math.min(idx, state.palette.length - 1)].id
      : null;
  }

  renderAll();
  announce(`${name} removed from palette`);
}

// ── HSL slider live update ──
function handleSliderInput() {
  const h = Number(document.getElementById('slider-hue').value);
  const s = Number(document.getElementById('slider-saturation').value);
  const l = Number(document.getElementById('slider-lightness').value);
  const hex = hslToHex(h, s, l);

  const idx = state.palette.findIndex(c => c.id === state.selectedId);
  if (idx === -1) return;
  state.palette[idx].hex = hex;

  // Update preview
  document.getElementById('preview-swatch').style.background = hex;
  document.getElementById('preview-hex').textContent         = hex;
  document.getElementById('preview-hsl').textContent         = `hsl(${h}°, ${s}%, ${l}%)`;

  // Update value labels
  document.getElementById('value-hue').textContent        = `${h}°`;
  document.getElementById('value-saturation').textContent = `${s}%`;
  document.getElementById('value-lightness').textContent  = `${l}%`;

  // Update slider gradients
  updateSliderVars(h, s, l);

  // Update sidebar colour item (partial DOM update — no full re-render)
  const itemSwatch = document.querySelector(`.color-item[data-id="${state.selectedId}"] .color-item__swatch`);
  const itemHex    = document.querySelector(`.color-item[data-id="${state.selectedId}"] .color-item__hex`);
  if (itemSwatch) itemSwatch.style.background = hex;
  if (itemHex)    itemHex.textContent          = hex.toUpperCase();

  // Regenerate shades and matrix
  renderShades(h, s, l);
  renderMatrix();
}

// ── Edit colour name ──
function handleStartEdit(id) {
  state.editingId = id;
  renderPalette();
  const input = document.querySelector(`.color-item__name-input[data-id="${id}"]`);
  if (input) { input.focus(); input.select(); }
}

function handleSaveEdit(id, rawValue) {
  const idx  = state.palette.findIndex(c => c.id === id);
  if (idx === -1) return;
  const name = rawValue.trim() || state.palette[idx].name;
  state.palette[idx].name = name;
  state.editingId = null;
  renderAll();
  announce(`Renamed to ${name}`);
}

function handleCancelEdit() {
  state.editingId = null;
  renderPalette();
}

// ── Copy hex ──
async function handleCopyHex() {
  const hex = document.getElementById('preview-hex').textContent;
  const btn = document.getElementById('copy-hex-btn');
  try {
    await navigator.clipboard.writeText(hex);
    btn.textContent = 'Copied!';
    btn.classList.add('btn--copied');
    btn.classList.remove('btn--secondary');
    announce(`${hex} copied to clipboard`);
  } catch (_) {
    announce('Could not copy — select and copy manually');
  }
  setTimeout(() => {
    btn.textContent = 'Copy hex';
    btn.classList.remove('btn--copied');
    btn.classList.add('btn--secondary');
  }, 2000);
}

// ── Export palette ──
function handleExport() {
  const data = state.palette.map(({ name, hex }) => {
    const { h, s, l } = hexToHsl(hex);
    const { r, g, b } = hexToRgb(hex);
    return { name, hex, hsl: { h, s, l }, rgb: { r, g, b } };
  });
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'palette.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  announce('Palette exported as palette.json');
}

// ── Save palette ──
function handleSavePalette() {
  saveToStorage();
  const btn = document.getElementById('save-btn');
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = 'Saved!';
  announce('Palette saved to browser');
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

// ── Filter change ──
function handleFilterChange(e) {
  const checkbox = e.target;
  if (!checkbox.matches('input[type="checkbox"]')) return;

  const id = checkbox.id;

  if (id === 'filter-all') {
    const checked = checkbox.checked;
    Object.keys(state.filters).forEach(key => {
      state.filters[key] = checked;
      const el = document.getElementById('filter-' + key);
      if (el) el.checked = checked;
    });
  } else {
    const key = id.replace('filter-', '');
    if (key in state.filters) state.filters[key] = checkbox.checked;
    // Sync "All" master checkbox
    const allChecked = Object.values(state.filters).every(Boolean);
    const allEl = document.getElementById('filter-all');
    if (allEl) allEl.checked = allChecked;
  }

  applyFilters();
}

// ── Hex input ↔ native picker sync ──
function handleHexInputChange() {
  const val = document.getElementById('hex-input').value.trim();
  clearError();
  if (isValidHex(val)) {
    const picker = document.getElementById('native-picker');
    if (picker) picker.value = normalizeHex(val).toLowerCase();
  }
}

function handlePickerChange(e) {
  const hex   = e.target.value.toUpperCase();
  const input = document.getElementById('hex-input');
  if (input) input.value = hex;
  clearError();
}

/* ============================================================
   Error helpers
   ============================================================ */

function showError(msg) {
  const err   = document.getElementById('input-error');
  const input = document.getElementById('hex-input');
  if (err)   { err.textContent = msg; err.classList.add('is-visible'); }
  if (input) input.classList.add('is-error');
  announce(msg);
}

function clearError() {
  const err   = document.getElementById('input-error');
  const input = document.getElementById('hex-input');
  if (err)   { err.textContent = ''; err.classList.remove('is-visible'); }
  if (input) input.classList.remove('is-error');
}

/* ============================================================
   Init
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Inject icons into static chip checkmarks
  document.querySelectorAll('.chip__checkmark').forEach(el => {
    el.innerHTML = ICON_CHECK;
  });

  // Inject color-picker icon
  const pickerIcon = document.getElementById('picker-icon');
  if (pickerIcon) pickerIcon.innerHTML = ICON_COLOR_PICKER;

  // Restore or apply defaults
  loadFromStorage();

  // First render
  renderAll();

  /* ── Palette list — event delegation ── */
  const paletteList = document.getElementById('palette-list');
  if (paletteList) {
    paletteList.addEventListener('click', e => {
      const deleteBtn = e.target.closest('.icon-btn--delete');
      const editBtn   = e.target.closest('.icon-btn--edit');
      const item      = e.target.closest('.color-item');

      if (deleteBtn) {
        e.stopPropagation();
        if (state.editingId) handleCancelEdit();
        handleDeleteColor(deleteBtn.dataset.id);
      } else if (editBtn) {
        e.stopPropagation();
        const id = editBtn.dataset.id;
        if (state.editingId === id) {
          // Clicking pencil again while editing — save
          const input = document.querySelector('.color-item__name-input');
          handleSaveEdit(id, input ? input.value : '');
        } else {
          handleStartEdit(id);
        }
      } else if (item && !e.target.closest('.color-item__name-input')) {
        if (state.editingId) {
          const input = document.querySelector('.color-item__name-input');
          handleSaveEdit(state.editingId, input ? input.value : '');
        }
        handleSelectColor(item.dataset.id);
      }
    });

    paletteList.addEventListener('keydown', e => {
      // Input field keyboard handling
      if (e.target.classList.contains('color-item__name-input')) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSaveEdit(e.target.dataset.id, e.target.value);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelEdit();
        }
        return;
      }
      // Colour item keyboard handling
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('.color-item');
      if (item && e.target === item) {
        e.preventDefault();
        handleSelectColor(item.dataset.id);
      }
    });

    // Save on blur (clicking outside the input)
    paletteList.addEventListener('focusout', e => {
      if (!e.target.classList.contains('color-item__name-input')) return;
      const id = e.target.dataset.id;
      const val = e.target.value;
      // Small delay so click events on buttons fire before we save
      setTimeout(() => {
        if (state.editingId === id) handleSaveEdit(id, val);
      }, 150);
    });
  }

  /* ── Add colour ── */
  const addBtn = document.getElementById('add-btn');
  const hexInp = document.getElementById('hex-input');
  const picker = document.getElementById('native-picker');

  if (addBtn) addBtn.addEventListener('click', handleAddColor);
  if (hexInp) {
    hexInp.addEventListener('input',   handleHexInputChange);
    hexInp.addEventListener('keydown', e => { if (e.key === 'Enter') handleAddColor(); });
  }
  if (picker) picker.addEventListener('input', handlePickerChange);

  /* ── HSL sliders ── */
  ['slider-hue', 'slider-saturation', 'slider-lightness'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', handleSliderInput);
  });

  /* ── Copy hex ── */
  const copyBtn = document.getElementById('copy-hex-btn');
  if (copyBtn) copyBtn.addEventListener('click', handleCopyHex);

  /* ── Header actions ── */
  const exportBtn = document.getElementById('export-btn');
  const saveBtn   = document.getElementById('save-btn');
  if (exportBtn) exportBtn.addEventListener('click', handleExport);
  if (saveBtn)   saveBtn.addEventListener('click', handleSavePalette);

  /* ── Color picker button — keyboard support ── */
  const pickerBtn = document.querySelector('.color-picker-btn');
  if (pickerBtn && picker) {
    pickerBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        picker.click();
      }
    });
  }

  /* ── Filters ── */
  const filterBar = document.getElementById('filter-bar');
  if (filterBar) filterBar.addEventListener('change', handleFilterChange);
});
