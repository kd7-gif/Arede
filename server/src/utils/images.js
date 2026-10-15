import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// On a live host, point UPLOAD_DIR at the permanent storage volume so photos survive restarts.
export const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

export const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const EXT_TO_TYPE = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// "sharp" resizes and compresses photos so pages load fast on mobile data, and it strips hidden
// camera data such as GPS location. It is optional: without it the original file is kept.
let sharpLoader;
const loadSharp = () => (sharpLoader ??= import('sharp').then((m) => m.default).catch(() => null));

/**
 * Saves an uploaded photo into /uploads and returns its public path (for example "/uploads/ab12.webp").
 * Throws an Error with a readable message if the file is not a real image.
 */
export async function saveProductImage(buffer, mimeType) {
  const sharp = await loadSharp();
  const id = crypto.randomBytes(12).toString('hex');

  if (sharp) {
    let out;
    try {
      out = await sharp(buffer)
        .rotate() // respect the phone's orientation, then drop the metadata
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new Error('That file is not a valid image.');
    }
    await fs.promises.writeFile(path.join(uploadDir, `${id}.webp`), out);
    return `/uploads/${id}.webp`;
  }

  const ext = IMAGE_TYPES[mimeType];
  if (!ext) throw new Error('Use a JPG, PNG or WebP image.');
  await fs.promises.writeFile(path.join(uploadDir, `${id}${ext}`), buffer);
  return `/uploads/${id}${ext}`;
}
