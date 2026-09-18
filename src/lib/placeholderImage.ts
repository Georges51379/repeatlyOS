// Deterministic stock-photo fallbacks for anything a merchant hasn't
// uploaded a real photo for yet — cities, businesses, products, services.
// A blank gray box with just an icon (the previous fallback everywhere)
// makes every empty listing look broken/unfinished, especially for demo
// data. Picsum's seeded endpoint returns the SAME photo for the same seed
// every time (no API key, no rate limit issues), so a given city/product
// keeps the same "random" photo across renders and reloads instead of
// visibly reshuffling — this is a stand-in for a real photo, not a
// decoration that should change on its own.
//
// Categories get a curated seed *pool* per kind (rather than one seed per
// literal id) so visually related items don't all collide on one image
// while still keeping some topical variety (a "restaurant" always lands on
// a food-ish photo, a "salon" on a salon-ish one, etc.) — picsum has no
// content tagging, so "topical" here just means a hand-picked seed list
// per kind rather than the entire picsum catalog.
const SEED_POOLS: Record<string, string[]> = {
  city: ['beirut1', 'beirut2', 'beirut3', 'beirut4', 'beirut5', 'beirut6'],
  restaurant: ['food1', 'food2', 'food3', 'food4', 'food5'],
  cafe: ['coffee1', 'coffee2', 'coffee3'],
  bakery: ['bakery1', 'bakery2', 'bakery3'],
  grocery: ['grocery1', 'grocery2'],
  fashion: ['fashion1', 'fashion2', 'fashion3', 'fashion4'],
  electronics: ['tech1', 'tech2', 'tech3'],
  salon: ['salon1', 'salon2', 'salon3'],
  spa: ['spa1', 'spa2'],
  gym: ['gym1', 'gym2', 'gym3'],
  automotive: ['car1', 'car2', 'car3'],
  home_services: ['home1', 'home2'],
  pharmacy: ['pharmacy1', 'pharmacy2'],
  pet: ['pet1', 'pet2'],
  education: ['study1', 'study2'],
  product: ['product1', 'product2', 'product3', 'product4', 'product5', 'product6'],
  service: ['service1', 'service2', 'service3', 'service4'],
  generic: ['generic1', 'generic2', 'generic3', 'generic4', 'generic5'],
};

function hashToIndex(key: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

/**
 * Returns a stable placeholder photo URL for `id` within `kind`. Same
 * (kind, id) always returns the same URL — pass the row's own id (or slug)
 * as `id` so a specific city/product/service never appears to change photo.
 */
export function placeholderImage(
  kind: keyof typeof SEED_POOLS | (string & {}),
  id: string,
  size: { w: number; h: number } = { w: 640, h: 400 },
): string {
  const pool = SEED_POOLS[kind] ?? SEED_POOLS.generic;
  const seed = `${kind}-${pool[hashToIndex(id, pool.length)]}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${size.w}/${size.h}`;
}

/** Maps a business_type_key (e.g. "fast_food", "hair_salon") to the closest
 * seed-pool kind above — falls back to "generic" for anything unrecognized. */
export function businessTypeToImageKind(businessTypeKey: string | null | undefined): string {
  const key = (businessTypeKey ?? '').toLowerCase();
  if (/food|restaurant|kitchen/.test(key)) return 'restaurant';
  if (/cafe|coffee/.test(key)) return 'cafe';
  if (/bak(e|ing)/.test(key)) return 'bakery';
  if (/grocery|market|supermarket/.test(key)) return 'grocery';
  if (/fashion|cloth|boutique|shoe|apparel/.test(key)) return 'fashion';
  if (/electronic|phone|computer|tech/.test(key)) return 'electronics';
  if (/salon|barber|hair|beauty/.test(key)) return 'salon';
  if (/spa|wellness/.test(key)) return 'spa';
  if (/gym|fitness/.test(key)) return 'gym';
  if (/auto|car|garage|mechanic/.test(key)) return 'automotive';
  if (/clean|repair|plumb|electric/.test(key)) return 'home_services';
  if (/pharma|health/.test(key)) return 'pharmacy';
  if (/pet|vet/.test(key)) return 'pet';
  if (/school|tutor|academy|education/.test(key)) return 'education';
  return 'generic';
}
