import type { ImgHTMLAttributes } from 'react';

/** New feature: low-bandwidth-friendly image rendering — `loading="lazy"`
 * (skip the network request entirely for anything off-screen) and
 * `decoding="async"` (don't block rendering on image decode), applied
 * consistently everywhere the marketplace renders a merchant-supplied
 * image. Pairs with `compressImage` (src/lib/imageUpload.ts), which shrinks
 * an image BEFORE it's ever uploaded — the two together mean less data
 * both at upload time and at every subsequent page view, which matters
 * more outside well-connected areas than in central Beirut. */
export default function LazyImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  return <img loading="lazy" decoding="async" {...props} />;
}
