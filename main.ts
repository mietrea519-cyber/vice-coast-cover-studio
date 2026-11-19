// Vice Coast Cover Studio's entrypoint (Node 22, standard library only).
// It hands the app in: it copies this repository's app/ and screenshots/
// into the output directory and writes /output/dossier.json, the summary the
// judge reads, using the vendored make.fun library in vendor/makefun-app.ts.
//
// The app is plain static files — app/index.html and the modules it loads,
// no build step and no network request — so copying the two folders is the
// whole handover. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The caps passed to buildDossier are the gate's own: the text cap shapes
// the dossier's bytes, the rest only refuse an entry the scorer would
// refuse (more than 4 screenshots, one over 256 KiB, app/ past 993 entries
// or 48 MiB, or a path under app/ past 1000 bytes).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
