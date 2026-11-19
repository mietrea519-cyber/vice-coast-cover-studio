// The photo tray: the person's own photos plus the two built-in samples.
//
// Photos are never uploaded anywhere. A file the person picks is read on
// their own machine into an object URL and drawn straight from it; the
// built-in samples are plain files under app/samples/. Each photo is
// { id, name, src, image }: `image` is the loaded <img> the renderer draws,
// or null until it finishes loading.

/** The two samples shipped with the app, in tray order. */
export const SAMPLES = [
  { id: 'neon-driver', name: 'neon driver', src: 'samples/neon-driver.jpg' },
  { id: 'sunset-pier', name: 'sunset pier', src: 'samples/sunset-pier.jpg' },
];

/** Loads one image from a URL, resolving with the image once it can draw. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
}

/**
 * A photo tray. `onChange` runs after every add, so the editor can repaint
 * its thumbnails; `images` maps photo ids to loaded images for the renderer.
 */
export class PhotoTray {
  constructor(onChange) {
    this.photos = [];
    this.images = new Map();
    this.onChange = onChange;
    this.counter = 0;
  }

  /** The photo with this id, or undefined. */
  byId(id) {
    return this.photos.find((photo) => photo.id === id);
  }

  /** Adds a photo that is already loading from `src`; returns its record. */
  async addLoaded(id, name, src) {
    if (this.byId(id)) return this.byId(id);
    const record = { id, name, src, image: null };
    this.photos.push(record);
    try {
      record.image = await loadImage(src);
      this.images.set(id, record.image);
    } catch {
      // A photo that fails to load stays in the tray as an empty tile.
    }
    this.onChange();
    return record;
  }

  /** Loads both built-in samples into the tray. */
  async addSamples() {
    for (const sample of SAMPLES) await this.addLoaded(sample.id, sample.name, sample.src);
  }

  /** Adds files the person picked or dropped; returns the photos it added. */
  async addFiles(files) {
    const added = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      this.counter += 1;
      const id = `upload-${this.counter}`;
      const src = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^.]+$/, '') || `photo ${this.counter}`;
      added.push(await this.addLoaded(id, name, src));
    }
    return added;
  }

  /** The ids of the tray's photos, in tray order. */
  ids() {
    return this.photos.map((photo) => photo.id);
  }
}
