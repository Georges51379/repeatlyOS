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
  bar: ['bar1', 'bar2', 'bar3'],
  bakery: ['bakery1', 'bakery2', 'bakery3'],
  grocery: ['grocery1', 'grocery2'],
  fashion: ['fashion1', 'fashion2', 'fashion3', 'fashion4'],
  jewelry: ['jewelry1', 'jewelry2'],
  toys: ['toy1', 'toy2'],
  books: ['book1', 'book2'],
  furniture: ['furniture1', 'furniture2'],
  hardware: ['hardware1', 'hardware2'],
  florist: ['flower1', 'flower2'],
  stationery: ['stationery1', 'stationery2'],
  electronics: ['tech1', 'tech2', 'tech3'],
  mobile: ['phone1', 'phone2'],
  salon: ['salon1', 'salon2', 'salon3'],
  makeup: ['makeup1', 'makeup2'],
  spa: ['spa1', 'spa2'],
  gym: ['gym1', 'gym2', 'gym3'],
  gaming: ['gaming1', 'gaming2'],
  automotive: ['car1', 'car2', 'car3'],
  bike: ['bike1', 'bike2'],
  home_services: ['home1', 'home2'],
  pharmacy: ['pharmacy1', 'pharmacy2'],
  medical: ['medical1', 'medical2'],
  pet: ['pet1', 'pet2'],
  education: ['study1', 'study2'],
  photography: ['photo1', 'photo2'],
  events: ['event1', 'event2'],
  laundry: ['laundry1', 'laundry2'],
  print: ['print1', 'print2'],
  real_estate: ['realestate1', 'realestate2'],
  travel: ['travel1', 'travel2'],
  office: ['office1', 'office2'],
  tailor: ['tailor1', 'tailor2'],
  childcare: ['childcare1', 'childcare2'],
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
  if (/\bbar\b|pub|alcohol/.test(key)) return 'bar';
  if (/bak(e|ing)/.test(key)) return 'bakery';
  if (/butcher|grocery|minimarket|market|supermarket/.test(key)) return 'grocery';
  if (/jewelry/.test(key)) return 'jewelry';
  if (/toy/.test(key)) return 'toys';
  if (/book|library/.test(key)) return 'books';
  if (/furniture/.test(key)) return 'furniture';
  if (/hardware/.test(key)) return 'hardware';
  if (/florist|flower/.test(key)) return 'florist';
  if (/stationery|print/.test(key)) return 'stationery';
  if (/tailor/.test(key)) return 'tailor';
  if (/fashion|cloth|boutique|shoe|apparel/.test(key)) return 'fashion';
  if (/mobile.?shop|mobile.?phone/.test(key)) return 'mobile';
  if (/gaming/.test(key)) return 'gaming';
  if (/electronic|computer|tech/.test(key)) return 'electronics';
  if (/makeup/.test(key)) return 'makeup';
  if (/salon|barber|hair|nail/.test(key)) return 'salon';
  if (/spa|wellness|yoga/.test(key)) return 'spa';
  if (/gym|fitness|trainer/.test(key)) return 'gym';
  if (/bike|bicycle/.test(key)) return 'bike';
  if (/auto|car.?wash|car.?dealer|garage|mechanic/.test(key)) return 'automotive';
  if (/clean|repair|plumb|electric/.test(key)) return 'home_services';
  if (/pharma/.test(key)) return 'pharmacy';
  if (/dentist|clinic|health|medical/.test(key)) return 'medical';
  if (/pet|vet/.test(key)) return 'pet';
  if (/school|tutor|academy|education|daycare|nursery/.test(key)) return 'education';
  if (/photo/.test(key)) return 'photography';
  if (/event/.test(key)) return 'events';
  if (/laundry|dry.?clean/.test(key)) return 'laundry';
  if (/real.?estate/.test(key)) return 'real_estate';
  if (/travel/.test(key)) return 'travel';
  if (/law|legal|accounting/.test(key)) return 'office';
  return 'generic';
}
