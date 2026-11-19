// The five-panel cover layout and the framing of the photo inside each panel.
//
// The cover is one large hero panel plus four smaller ones, split by a dark
// gutter. Landscape and square covers put the hero down the whole left side
// with the four small panels in a grid on the right; portrait covers put the
// hero across the top-left and the last two panels in a row along the foot,
// because a tall cover needs its title zone at the bottom. Every rectangle
// here is a fraction of the cover's width and height, so the same layout
// draws at 1080 by 1080, 1080 by 1350 and 1920 by 1080.
//
// A panel's framing is { photo, zoom, x, y }: which photo it shows, how far
// it is zoomed in, and how far its centre is shifted across (x) and up-down
// (y), each shift as a fraction of the panel's own size.

/** How many panels a cover has. */
export const PANEL_COUNT = 5;

/** The gutter between panels, as a fraction of the cover's width. */
export const GUTTER = 0.008;

/**
 * The five panel rectangles for a cover of width `w` and height `h`, each as
 * [x, y, width, height] in pixels. The first rectangle is the hero panel.
 */
export function panelRects(w, h) {
  const g = Math.round(w * GUTTER);
  if (h > w) {
    // Portrait: hero top-left, two stacked panels top-right, two along the foot.
    const midX = Math.round(w * 0.575);
    const midY = Math.round(h * 0.315);
    const footY = Math.round(h * 0.628);
    return [
      [0, 0, midX - g, footY - g],
      [midX, 0, w - midX, midY - g],
      [midX, midY, w - midX, footY - midY - g],
      [0, footY, Math.round(w * 0.494) - g, h - footY],
      [Math.round(w * 0.506), footY, w - Math.round(w * 0.506), h - footY],
    ];
  }
  // Landscape and square: hero down the left, four small panels on the right.
  const midX = Math.round(w * 0.502);
  const midY = Math.round(h * 0.502);
  return [
    [0, 0, midX - g, h],
    [midX, 0, Math.round(w * 0.246) - g, midY - g],
    [Math.round(w * 0.754), 0, w - Math.round(w * 0.754), midY - g],
    [midX, midY, Math.round(w * 0.246) - g, h - midY],
    [Math.round(w * 0.754), midY, w - Math.round(w * 0.754), h - midY],
  ];
}

/** One panel's untouched framing: its photo, at natural zoom, centred. */
export function freshFraming(photo) {
  return { photo, zoom: 1, x: 0, y: 0 };
}

/** Five fresh panels, every one showing `photo`. */
export function freshPanels(photo) {
  return Array.from({ length: PANEL_COUNT }, () => freshFraming(photo));
}

/** A copy of a panel list with one panel's framing replaced by `patch`. */
export function patchPanel(panels, index, patch) {
  return panels.map((panel, i) => (i === index ? { ...panel, ...patch } : panel));
}

/** A copy of a panel list with every panel showing `photo`, keeping its zoom. */
export function fillPanels(panels, photo) {
  return panels.map((panel) => ({ ...panel, photo }));
}

/** A copy of a panel list with every framing reset to centred, natural zoom. */
export function resetPanels(panels) {
  return panels.map((panel) => freshFraming(panel.photo));
}

/**
 * The shift that still keeps a zoomed photo covering its panel: the drawn
 * photo is wider than the panel by (zoom - 1), so the centre may wander by
 * at most half that surplus in each direction, measured in panel fractions.
 */
export function shiftLimit(zoom) {
  return Math.max(0, (zoom - 1) / 2);
}

/** Keeps a shift inside the range that still covers the panel at this zoom. */
export function clampShift(value, zoom) {
  const limit = shiftLimit(zoom);
  return Math.max(-limit, Math.min(limit, value));
}

/** Keeps a zoom inside the slider's range. */
export function clampZoom(zoom) {
  return Math.max(1, Math.min(2.6, zoom));
}

/**
 * Finds which panel, if any, contains the point (px, py) on a cover of
 * width `w` and height `h`. Returns the panel index, or -1 when the point
 * falls in a gutter or outside the cover.
 */
export function panelAt(w, h, px, py) {
  const rects = panelRects(w, h);
  for (let i = 0; i < rects.length; i++) {
    const [x, y, pw, ph] = rects[i];
    if (px >= x && px < x + pw && py >= y && py < y + ph) return i;
  }
  return -1;
}
