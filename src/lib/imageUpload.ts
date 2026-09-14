// New feature: client-side image compression before upload — resizes to a
// sane max dimension and re-encodes as JPEG at a fixed quality using a
// plain <canvas>, no extra dependency. Applied at the upload boundary
// (wherever a merchant picks a product/business photo) rather than only
// lazy-loading on the read side (LazyImage.tsx) — the goal is smaller
// files both for the merchant's own upload (often on mobile data) and for
// every shopper who later loads that image.
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.75;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file; // nothing sensible to re-encode
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob || blob.size >= file.size) return file; // don't "compress" into something bigger

  const newName = file.name.replace(/\.[a-zA-Z0-9]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}
