// Fixed scenes for screenshots: ?shot=cover, ?shot=cover-portrait and
// ?shot=editor. Each scene names its title, tagline, grade, export size and
// the framing of every panel, so the same query always paints the same
// picture. `window.__shotReady` is set once the scene has been painted, so
// a screenshot can wait for it.
//
// The query may override the title (?title=), tagline (?tagline=) and grade
// (?grade=neon|sunset|pastel); anything else stays as the scene defines it.

/** The neon landscape cover: NEON COAST, hero neon driver, sunset pier beside her. */
const NEON_COVER = {
  mode: 'cover',
  title: 'NEON COAST',
  tagline: 'One city, no rules',
  grade: 'neon',
  size: '1920x1080',
  panels: [
    { photo: 'neon-driver', zoom: 1.05, x: 0, y: 0.02 },
    { photo: 'sunset-pier', zoom: 1.7, x: 0, y: -0.16 },
    { photo: 'sunset-pier', zoom: 1.05, x: 0, y: 0 },
    { photo: 'neon-driver', zoom: 1.4, x: 0, y: -0.12 },
    { photo: 'neon-driver', zoom: 1.2, x: 0.04, y: -0.02 },
  ],
};

/** The sunset portrait cover: SUNSET KING, hero sunset pier, neon driver beside him. */
const SUNSET_COVER = {
  mode: 'cover',
  title: 'SUNSET KING',
  tagline: 'Golden hour forever',
  grade: 'sunset',
  size: '1080x1350',
  panels: [
    { photo: 'sunset-pier', zoom: 1.05, x: 0, y: 0 },
    { photo: 'neon-driver', zoom: 1.15, x: 0, y: -0.04 },
    { photo: 'sunset-pier', zoom: 1.55, x: 0, y: -0.14 },
    { photo: 'neon-driver', zoom: 1.35, x: 0, y: -0.1 },
    { photo: 'sunset-pier', zoom: 1.65, x: 0, y: -0.16 },
  ],
};

/** The editor open on the sunset cover, ready to frame panel 1. */
const SUNSET_EDITOR = {
  ...SUNSET_COVER,
  mode: 'editor',
  size: '1920x1080',
  selected: 0,
};

/** The editor open on the neon cover, ready to frame panel 1. */
const NEON_EDITOR = {
  ...NEON_COVER,
  mode: 'editor',
  selected: 0,
};

/** The scenes by their ?shot= name. */
export const SCENES = {
  cover: NEON_COVER,
  'cover-portrait': SUNSET_COVER,
  editor: SUNSET_EDITOR,
  'editor-neon': NEON_EDITOR,
};

/** Builds a scene from a ?shot= name and its query, applying the overrides. */
export function sceneFor(shot, query) {
  const base = SCENES[shot] ?? SCENES.editor;
  const scene = {
    ...base,
    panels: base.panels.map((panel) => ({ ...panel })),
  };
  const title = query.get('title');
  const tagline = query.get('tagline');
  const grade = query.get('grade');
  if (title) scene.title = title;
  if (tagline) scene.tagline = tagline;
  if (grade && ['neon', 'sunset', 'pastel'].includes(grade)) scene.grade = grade;
  return scene;
}

/**
 * Runs a shot scene: hands the scene to `apply` (the editor's own setup),
 * waits for the Anton font and one paint, then flags the page ready.
 */
export async function runShot(shot, query, apply) {
  const scene = sceneFor(shot, query);
  await apply(scene);
  try {
    await document.fonts.ready;
  } catch {
    // The cover still draws with its fallback face when fonts fail.
  }
  await apply(scene);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
  return scene;
}
