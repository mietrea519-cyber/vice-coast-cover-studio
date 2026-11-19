// Draws a finished cover onto a 2D canvas context.
//
// drawCover is the one place a cover is ever painted, so the live preview
// and the exported PNG are the same drawing at different sizes: panels
// first, then the grade washes and vignette, then the title and tagline in
// Anton with a heavy dark outline, sitting low across the foot of the cover
// like the posters this app imitates. Photos arrive as a lookup from photo
// id to a drawable image; a panel whose photo has not loaded yet paints as
// a flat plum tile so the layout still reads.

import { gradeById, paintVignette, paintWash } from './grades.js';
import { clampShift, panelRects } from './panels.js';

/** The dark plum the cover's background and empty panels are painted. */
export const COVER_BACKGROUND = '#1a0b28';

/** The near-black outline drawn around the title lettering. */
const TITLE_OUTLINE = '#150820';

/**
 * Draws one photo into one panel rectangle, cover-fitting it: the photo is
 * scaled until it fills the panel, then shifted by the framing and zoomed
 * about its centre. The grade's filter is applied to the draw itself.
 */
export function drawPanelPhoto(ctx, image, rect, framing, grade) {
  const [x, y, w, h] = rect;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const base = Math.max(w / iw, h / ih);
  const scale = base * framing.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const shiftX = clampShift(framing.x, framing.zoom) * w;
  const shiftY = clampShift(framing.y, framing.zoom) * h;
  const dx = x + (w - dw) / 2 + shiftX;
  const dy = y + (h - dh) / 2 + shiftY;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.filter = 'none';
  for (const wash of grade.washes) paintWash(ctx, x, y, w, h, wash);
  paintVignette(ctx, x, y, w, h);
  ctx.restore();
}

/**
 * Draws the title and tagline across the foot of the cover. The title is
 * shrunk until it fits the cover's width, stroked thick in dark plum and
 * filled white; the tagline sits beneath it in widely spaced small capitals.
 */
export function drawCaption(ctx, w, h, title, tagline) {
  const words = (title ?? '').trim().toUpperCase();
  const sub = (tagline ?? '').trim().toUpperCase();
  if (!words && !sub) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const foot = h * 0.045;
  let titleSize = h * 0.115;
  if (words) {
    ctx.font = `${titleSize}px Anton, "Arial Narrow", sans-serif`;
    while (ctx.measureText(words).width > w * 0.93 && titleSize > 16) {
      titleSize -= 2;
      ctx.font = `${titleSize}px Anton, "Arial Narrow", sans-serif`;
    }
    const titleBaseline = h - foot - (sub ? titleSize * 0.42 : 0);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, titleSize * 0.17);
    ctx.strokeStyle = TITLE_OUTLINE;
    ctx.shadowColor = 'rgba(255, 45, 149, 0.55)';
    ctx.shadowBlur = titleSize * 0.12;
    ctx.strokeText(words, w / 2, titleBaseline);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(words, w / 2, titleBaseline);
  }
  if (sub) {
    const subSize = Math.max(12, titleSize * 0.17);
    ctx.font = `${subSize}px Anton, "Arial Narrow", sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(subSize * 0.42)}px`;
    } catch {
      // Older engines have no canvas letter spacing; the text still draws.
    }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = subSize * 0.4;
    ctx.fillText(sub, w / 2, h - foot * 0.45);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Nothing to reset when letter spacing was never set.
    }
  }
  ctx.restore();
}

/**
 * Draws the whole cover: background, the five panels, then the caption.
 * `state` carries { panels, title, tagline, grade } and `photos` maps a
 * photo id to its loaded image.
 */
export function drawCover(ctx, w, h, state, photos) {
  const grade = gradeById(state.grade);
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COVER_BACKGROUND;
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(w, h);
  state.panels.forEach((framing, i) => {
    const rect = rects[i];
    const image = photos.get(framing.photo);
    if (!image) {
      ctx.fillStyle = i === 0 ? '#3a1d52' : '#2c1540';
      ctx.fillRect(rect[0], rect[1], rect[2], rect[3]);
      return;
    }
    drawPanelPhoto(ctx, image, rect, framing, grade);
  });
  // A soft shade behind the caption so white lettering reads on bright photos.
  const shade = ctx.createLinearGradient(0, h * 0.68, 0, h);
  shade.addColorStop(0, 'rgba(16, 5, 28, 0)');
  shade.addColorStop(1, 'rgba(16, 5, 28, 0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, Math.round(h * 0.68), w, h - Math.round(h * 0.68));
  drawCaption(ctx, w, h, state.title, state.tagline);
  ctx.restore();
}
