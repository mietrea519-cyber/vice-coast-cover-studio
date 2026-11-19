// Vice Coast Cover Studio: wires the editor page together.
//
// The page holds one state object — title, tagline, grade, export size, the
// selected panel and the five panels' framing — and one preview canvas that
// repaints from that state on every change. Photos come from the tray
// (./photos.js), the layout from ./panels.js, the painting from ./render.js,
// and the fixed screenshot scenes from ./shots.js. A ?shot= query swaps the
// live editor for a deterministic scene instead.

import { GRADE_IDS, GRADES } from './grades.js';
import { clampShift, clampZoom, fillPanels, freshPanels, panelAt, panelRects, patchPanel, resetPanels } from './panels.js';
import { PhotoTray } from './photos.js';
import { drawCover } from './render.js';
import { runShot } from './shots.js';

/** The export sizes the editor offers, as [label, width, height]. */
export const EXPORT_SIZES = [
  { id: '1080x1080', label: '1080 × 1080 · square post', w: 1080, h: 1080 },
  { id: '1080x1350', label: '1080 × 1350 · portrait post', w: 1080, h: 1350 },
  { id: '1920x1080', label: '1920 × 1080 · wide post', w: 1920, h: 1080 },
];

/** Looks an export size up by id, falling back to the wide size. */
export function sizeById(id) {
  return EXPORT_SIZES.find((size) => size.id === id) ?? EXPORT_SIZES[2];
}

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');

const state = {
  title: 'NEON COAST',
  tagline: 'One city, no rules',
  grade: 'neon',
  size: '1920x1080',
  selected: 0,
  panels: freshPanels('neon-driver'),
  activePhoto: 'neon-driver',
};

let coverMode = false;
let dragging = null;

const tray = new PhotoTray(renderTray);

/** The preview canvas size for the chosen export size, kept near 720px. */
function previewSize() {
  const size = sizeById(state.size);
  if (coverMode) return { w: window.innerWidth, h: window.innerHeight };
  const scale = Math.min(760 / size.w, 560 / size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

/** Paints the preview: the cover, then the selected panel's ring and number. */
function redraw() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(ctx, w, h, state, tray.images);
  if (coverMode) return;
  const rects = panelRects(w, h);
  const rect = rects[state.selected];
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(rect[0] + 2, rect[1] + 2, rect[2] - 4, rect[3] - 4);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ff2d95';
  ctx.beginPath();
  ctx.arc(rect[0] + 26, rect[1] + 26, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(state.selected + 1), rect[0] + 26, rect[1] + 27);
  ctx.restore();
}

/** Copies the selected panel's framing into the sliders and the status line. */
function syncControls() {
  const framing = state.panels[state.selected];
  $('zoom').value = framing.zoom;
  $('shift-x').value = framing.x;
  $('shift-y').value = framing.y;
  $('zoom-value').textContent = `${framing.zoom.toFixed(2)}×`;
  $('panel-status').textContent =
    `Panel ${state.selected + 1} selected — drag it on the cover, scroll to zoom.`;
}

/** Marks the grade buttons with the current grade. */
function syncGrades() {
  for (const id of GRADE_IDS) {
    $(`grade-${id}`).setAttribute('aria-pressed', String(state.grade === id));
    $(`grade-${id}`).classList.toggle('picked', state.grade === id);
  }
}

/** Marks the export size buttons with the current size. */
function syncSizes() {
  for (const size of EXPORT_SIZES) {
    $(`size-${size.id}`).setAttribute('aria-pressed', String(state.size === size.id));
    $(`size-${size.id}`).classList.toggle('picked', state.size === size.id);
  }
}

/** Rebuilds the photo tray thumbnails from the tray's photos. */
function renderTray() {
  const box = $('tray');
  box.replaceChildren();
  for (const photo of tray.photos) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = `Drop ${photo.name} into panel ${state.selected + 1}`;
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.name;
    button.append(img);
    button.addEventListener('click', () => assignPhoto(photo.id));
    box.append(button);
  }
  redraw();
}

/** Drops a photo into the selected panel and makes it the active photo. */
function assignPhoto(photoId) {
  state.activePhoto = photoId;
  state.panels = patchPanel(state.panels, state.selected, { photo: photoId });
  renderTray();
  syncControls();
}

/** Applies a scene from ./shots.js: title, grade, size, panels, selection. */
async function applyScene(scene) {
  await tray.addSamples();
  state.title = scene.title;
  state.tagline = scene.tagline;
  state.grade = scene.grade;
  state.size = scene.size;
  state.selected = scene.selected ?? 0;
  state.panels = scene.panels.map((panel) => ({ ...panel }));
  state.activePhoto = scene.panels[0].photo;
  coverMode = scene.mode === 'cover';
  document.body.classList.toggle('shot-cover', coverMode);
  $('title').value = state.title;
  $('tagline').value = state.tagline;
  syncGrades();
  syncSizes();
  syncControls();
  redraw();
}

/** Renders the cover at full export size and downloads it as a PNG. */
function exportPng() {
  const size = sizeById(state.size);
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, state, tray.images);
  off.toBlob((blob) => {
    if (!blob) {
      $('export-status').textContent = 'Export failed — try again.';
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vice-coast-${size.id}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    $('export-status').textContent = `Saved vice-coast-${size.id}.png — ${size.w} × ${size.h}.`;
  }, 'image/png');
}

// --- Step 1: photos -------------------------------------------------------

$('pick-photos').addEventListener('click', () => $('file-picker').click());
$('file-picker').addEventListener('change', async (event) => {
  const added = await tray.addFiles([...event.target.files]);
  if (added.length > 0) assignPhoto(added[0].id);
  event.target.value = '';
});
for (const sample of ['neon-driver', 'sunset-pier']) {
  $(`sample-${sample}`).addEventListener('click', () => assignPhoto(sample));
}

window.addEventListener('dragover', (event) => {
  event.preventDefault();
  document.body.classList.add('dropping');
});
window.addEventListener('dragleave', (event) => {
  if (event.target === document.body) document.body.classList.remove('dropping');
});
window.addEventListener('drop', async (event) => {
  event.preventDefault();
  document.body.classList.remove('dropping');
  const added = await tray.addFiles([...event.dataTransfer.files]);
  if (added.length > 0) assignPhoto(added[0].id);
});

// --- Step 2: frame the panel ----------------------------------------------

function frameSelected(patch) {
  state.panels = patchPanel(state.panels, state.selected, patch);
  syncControls();
  redraw();
}

$('zoom').addEventListener('input', (event) => {
  const zoom = clampZoom(Number(event.target.value));
  frameSelected({ zoom, x: clampShift(state.panels[state.selected].x, zoom), y: clampShift(state.panels[state.selected].y, zoom) });
});
$('shift-x').addEventListener('input', (event) => {
  frameSelected({ x: clampShift(Number(event.target.value), state.panels[state.selected].zoom) });
});
$('shift-y').addEventListener('input', (event) => {
  frameSelected({ y: clampShift(Number(event.target.value), state.panels[state.selected].zoom) });
});
$('reset-framing').addEventListener('click', () => {
  state.panels = resetPanels(state.panels);
  syncControls();
  redraw();
});
$('fill-all').addEventListener('click', () => {
  state.panels = fillPanels(state.panels, state.activePhoto);
  redraw();
});

canvas.addEventListener('pointerdown', (event) => {
  const box = canvas.getBoundingClientRect();
  const px = ((event.clientX - box.left) / box.width) * canvas.width;
  const py = ((event.clientY - box.top) / box.height) * canvas.height;
  const hit = panelAt(canvas.width, canvas.height, px, py);
  if (hit === -1) return;
  state.selected = hit;
  syncControls();
  canvas.setPointerCapture(event.pointerId);
  dragging = { px, py };
  redraw();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const px = ((event.clientX - box.left) / box.width) * canvas.width;
  const py = ((event.clientY - box.top) / box.height) * canvas.height;
  const rect = panelRects(canvas.width, canvas.height)[state.selected];
  const framing = state.panels[state.selected];
  frameSelected({
    x: clampShift(framing.x + (px - dragging.px) / rect[2], framing.zoom),
    y: clampShift(framing.y + (py - dragging.py) / rect[3], framing.zoom),
  });
  dragging = { px, py };
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('pointercancel', () => { dragging = null; });
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const framing = state.panels[state.selected];
  const zoom = clampZoom(framing.zoom * Math.exp(-event.deltaY * 0.0012));
  frameSelected({ zoom, x: clampShift(framing.x, zoom), y: clampShift(framing.y, zoom) });
}, { passive: false });

// --- Step 3: caption ------------------------------------------------------

$('title').addEventListener('input', (event) => { state.title = event.target.value; redraw(); });
$('tagline').addEventListener('input', (event) => { state.tagline = event.target.value; redraw(); });
for (const id of GRADE_IDS) {
  const button = $(`grade-${id}`);
  button.textContent = GRADES[id].label;
  button.title = GRADES[id].hint;
  button.addEventListener('click', () => {
    state.grade = id;
    syncGrades();
    redraw();
  });
}

// --- Step 4: export -------------------------------------------------------

for (const size of EXPORT_SIZES) {
  const button = $(`size-${size.id}`);
  button.textContent = size.label;
  button.addEventListener('click', () => {
    state.size = size.id;
    syncSizes();
    redraw();
  });
}
$('export').addEventListener('click', exportPng);

window.addEventListener('resize', () => { if (coverMode) redraw(); });

// --- Start ----------------------------------------------------------------

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, applyScene);
} else {
  tray.addSamples().then(() => {
    state.panels = [
      { photo: 'neon-driver', zoom: 1.05, x: 0, y: 0.02 },
      { photo: 'sunset-pier', zoom: 1.7, x: 0, y: -0.16 },
      { photo: 'sunset-pier', zoom: 1.05, x: 0, y: 0 },
      { photo: 'neon-driver', zoom: 1.4, x: 0, y: -0.12 },
      { photo: 'neon-driver', zoom: 1.2, x: 0.04, y: -0.02 },
    ];
    syncGrades();
    syncSizes();
    syncControls();
    redraw();
  });
  if (document.fonts?.load) {
    document.fonts.load('80px Anton').then(() => redraw()).catch(() => {});
  }
}
