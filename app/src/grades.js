// The three colour grades of Vice Coast Cover Studio.
//
// A grade is a small recipe the renderer applies to every panel photo: a
// canvas filter that shifts saturation, contrast and brightness, then one or
// two translucent colour washes laid over the panel. The washes use the
// "overlay" blend so they tint the light and the shade instead of painting
// flat colour on top. Nothing here reaches the network; every value is a
// number or a colour string in this file.

export const GRADES = {
  neon: {
    label: 'Neon Nights',
    hint: 'Hot pink and cyan, after dark on the strip.',
    filter: 'saturate(1.45) contrast(1.14) brightness(1.06)',
    washes: [
      { from: 'rgba(255, 45, 149, 0.20)', to: 'rgba(0, 229, 255, 0.16)', angle: 'top' },
      { from: 'rgba(120, 0, 255, 0.10)', to: 'rgba(255, 45, 149, 0.10)', angle: 'bottom' },
    ],
  },
  sunset: {
    label: 'Sunset Gold',
    hint: 'Warm golden hour, long shadows, orange sky.',
    filter: 'saturate(1.28) contrast(1.09) brightness(1.05) sepia(0.18)',
    washes: [
      { from: 'rgba(255, 140, 40, 0.20)', to: 'rgba(255, 60, 120, 0.12)', angle: 'top' },
      { from: 'rgba(255, 190, 90, 0.10)', to: 'rgba(140, 30, 80, 0.14)', angle: 'bottom' },
    ],
  },
  pastel: {
    label: 'Pastel Vice',
    hint: 'Soft art-deco pastels: powder pink and seafoam.',
    filter: 'saturate(1.12) contrast(1.02) brightness(1.10)',
    washes: [
      { from: 'rgba(255, 180, 200, 0.16)', to: 'rgba(120, 220, 200, 0.14)', angle: 'top' },
      { from: 'rgba(255, 220, 170, 0.08)', to: 'rgba(90, 140, 200, 0.10)', angle: 'bottom' },
    ],
  },
};

/** The grade ids in the order the editor offers them. */
export const GRADE_IDS = ['neon', 'sunset', 'pastel'];

/** Looks a grade up by id, falling back to the neon grade for unknown ids. */
export function gradeById(id) {
  return GRADES[id] ?? GRADES.neon;
}

/**
 * Paints one grade wash across a rectangle of a 2D context. `angle` picks
 * whether the wash runs from the top of the panel or rises from its bottom.
 */
export function paintWash(ctx, x, y, w, h, wash) {
  const gradient =
    wash.angle === 'bottom'
      ? ctx.createLinearGradient(0, y + h, 0, y)
      : ctx.createLinearGradient(0, y, 0, y + h);
  gradient.addColorStop(0, wash.from);
  gradient.addColorStop(1, wash.to);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Darkens the corners of a rectangle a little, so the caption sits on shade. */
export function paintVignette(ctx, x, y, w, h) {
  const glow = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
  );
  glow.addColorStop(0, 'rgba(10, 4, 24, 0)');
  glow.addColorStop(1, 'rgba(10, 4, 24, 0.38)');
  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}
