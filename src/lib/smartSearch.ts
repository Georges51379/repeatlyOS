import { supabase } from './supabase';
import type { City } from '../types/domain';

// Rule-based (no LLM call) parser for a free-text shopping request like
// "I want nike basketball shoes in shekka". No AI API dependency — matches
// words in the query against real city names and real product_attributes
// values already tagged by merchants, then runs the result through the
// same faceted-query pattern `Search.tsx` already uses. Chosen over an
// LLM-based parser (2026-09-10) to avoid needing an API key/billing setup
// and to keep results instant and free.

const STOPWORDS = new Set([
  'i', 'want', 'a', 'an', 'the', 'in', 'near', 'me', 'for', 'to', 'with', 'of', 'on', 'at',
  'looking', 'find', 'get', 'some', 'please', 'show', 'buy', 'any', 'is', 'there', 'are',
]);

export interface ParsedQuery {
  city: City | null;
  facets: { key: string; value: string }[];
  keywords: string;
}

interface AttrValue {
  key: string;
  value: string;
}

export async function loadSearchVocabulary() {
  const [{ data: cities }, { data: attrs }] = await Promise.all([
    supabase.from('cities').select('*').eq('marketplace_enabled', true),
    supabase.from('product_attributes').select('key, value'),
  ]);
  const uniqueAttrs = new Map<string, AttrValue>();
  for (const a of (attrs ?? []) as AttrValue[]) {
    uniqueAttrs.set(`${a.key}:${a.value.toLowerCase()}`, a);
  }
  return {
    cities: (cities ?? []) as City[],
    attrValues: Array.from(uniqueAttrs.values()),
  };
}

export function parseQuery(raw: string, cities: City[], attrValues: AttrValue[]): ParsedQuery {
  const lower = raw.toLowerCase();
  const consumedWords = new Set<string>();

  let matchedCity: City | null = null;
  for (const c of cities) {
    const name = c.name.toLowerCase();
    if (lower.includes(name) && (!matchedCity || name.length > matchedCity.name.length)) {
      matchedCity = c;
    }
  }
  if (matchedCity) {
    matchedCity.name.toLowerCase().split(/\s+/).forEach((w) => consumedWords.add(w));
  }

  const facets: { key: string; value: string }[] = [];
  const seenKeys = new Set<string>();
  const sortedAttrs = [...attrValues].sort((a, b) => b.value.length - a.value.length);
  for (const av of sortedAttrs) {
    if (seenKeys.has(av.key)) continue;
    const val = av.value.toLowerCase();
    if (val.length < 2) continue;
    const pattern = new RegExp(`\\b${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (pattern.test(lower)) {
      facets.push(av);
      seenKeys.add(av.key);
      val.split(/\s+/).forEach((w) => consumedWords.add(w));
      if (facets.length >= 3) break;
    }
  }

  const keywords = lower
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w && !STOPWORDS.has(w) && !consumedWords.has(w))
    .join(' ')
    .trim();

  return { city: matchedCity, facets, keywords };
}

export interface SearchResultProduct {
  id: string;
  kind: 'product';
  name: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  business: { slug: string; name: string; city_id: string; business_type_key: string | null };
}

export interface SearchResultService {
  id: string;
  kind: 'service';
  name: string;
  price: number | null;
  duration_minutes: number;
  business: { slug: string; name: string; city_id: string; business_type_key: string | null };
}

export interface SearchResultBusiness {
  id: string;
  kind: 'business';
  name: string;
  slug: string;
  business_type_key: string | null;
  cover_image_url: string | null;
  city_id: string;
}

export type SearchResultItem = SearchResultProduct | SearchResultService | SearchResultBusiness;

async function runProductQuery(cityIds: string[], facets: { key: string; value: string }[], keywords: string) {
  let query = supabase
    .from('products')
    .select(
      `id, name, price, sale_price, image_url,
       business:businesses!inner(slug, name, city_id, marketplace_visible, status, business_type_key)${facets
         .map((_, i) => `, attr_${i}:product_attributes!inner(key, value)`)
         .join('')}`,
    )
    .eq('active', true)
    .eq('marketplace_visible', true)
    .in('business.city_id', cityIds)
    .eq('business.marketplace_visible', true)
    .eq('business.status', 'active')
    .limit(24);

  facets.forEach((f, i) => {
    query = query.eq(`attr_${i}.key`, f.key).eq(`attr_${i}.value`, f.value);
  });
  if (keywords) {
    // Full-text search (not ILIKE) so English stemming matches "shoes"
    // against a product named "Shoe" and vice versa — found live during
    // verification: a leftover keyword phrase taken verbatim from the
    // shopper's own wording ("basketball shoes") failed a plain ILIKE
    // against a product literally named "Basketball Shoe".
    query = query.or(`name.plfts(english).${keywords},category.plfts(english).${keywords}`);
  }

  const { data } = await query;
  return ((data ?? []) as unknown as Omit<SearchResultProduct, 'kind'>[]).map((p) => ({ ...p, kind: 'product' as const }));
}

// Services have no facet system of their own (product_attributes is
// product-only), so a facet-bearing query narrows to products only — but a
// plain keyword query ("haircut in jounieh") should surface bookable
// services too, not just physical goods. Added alongside businesses below
// so "more advanced" search actually covers everything a shopper can find
// browsing a city by hand.
async function runServiceQuery(cityIds: string[], keywords: string) {
  if (!keywords) return [];
  const { data } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, business:businesses!inner(slug, name, city_id, marketplace_visible, status, business_type_key)')
    .eq('active', true)
    .eq('booking_enabled', true)
    .in('business.city_id', cityIds)
    .eq('business.marketplace_visible', true)
    .eq('business.status', 'active')
    .ilike('name', `%${keywords}%`)
    .limit(12);
  return ((data ?? []) as unknown as Omit<SearchResultService, 'kind'>[]).map((s) => ({ ...s, kind: 'service' as const }));
}

// A shopper typing the business's own name ("elite carwash") or a category
// word that only appears on the business row itself (not on any one
// product) previously got zero results even though browsing that city by
// hand would have found it immediately.
async function runBusinessQuery(cityIds: string[], keywords: string) {
  if (!keywords) return [];
  const { data } = await supabase
    .from('businesses')
    .select('id, name, slug, business_type_key, cover_image_url, city_id')
    .in('city_id', cityIds)
    .eq('marketplace_visible', true)
    .eq('status', 'active')
    .or(`name.ilike.%${keywords}%,business_type_key.ilike.%${keywords}%,category.ilike.%${keywords}%`)
    .limit(8);
  return ((data ?? []) as unknown as Omit<SearchResultBusiness, 'kind'>[]).map((b) => ({ ...b, kind: 'business' as const }));
}

async function runCombinedQuery(cityIds: string[], facets: { key: string; value: string }[], keywords: string) {
  const [products, services, businesses] = await Promise.all([
    runProductQuery(cityIds, facets, keywords),
    facets.length === 0 ? runServiceQuery(cityIds, keywords) : Promise.resolve([]),
    facets.length === 0 ? runBusinessQuery(cityIds, keywords) : Promise.resolve([]),
  ]);
  // Rank: exact/near-exact name matches first, then everything else in the
  // order the DB returned it — without this a 40-character product whose
  // description happens to contain the keyword outranks a product NAMED
  // exactly what was typed, which reads as broken to a shopper.
  const lowerKeywords = keywords.toLowerCase();
  const score = (name: string) => {
    const lower = name.toLowerCase();
    if (lower === lowerKeywords) return 0;
    if (lower.startsWith(lowerKeywords)) return 1;
    if (lower.includes(lowerKeywords)) return 2;
    return 3;
  };
  const all: SearchResultItem[] = [...businesses, ...services, ...products];
  if (lowerKeywords) all.sort((a, b) => score(a.name) - score(b.name));
  return all;
}

export interface SmartSearchResult {
  parsed: ParsedQuery;
  inCity: SearchResultItem[];
  nearby: SearchResultItem[];
  nearbyCities: City[];
  allCities: City[];
}

export interface NearbyProduct {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  business_id: string;
  business_name: string;
  business_slug: string;
  city_id: string;
  distance_km: number;
}

// True GPS-radius search (closes the limitation documented at the top of
// this file) — calls the `products_near` function from migration
// 20260914000005 rather than the region-string fallback `smartSearch`
// above uses. A plain client-side substring match on `name` narrows by
// keyword, since `products_near` itself only does distance — good enough
// for "near me" queries, which tend to be short and product-type-specific
// rather than needing full-text stemming.
export async function searchNearMe(
  lat: number,
  lng: number,
  rawQuery: string,
  radiusKm = 25,
): Promise<NearbyProduct[]> {
  const { data } = await supabase.rpc('products_near', {
    origin_lat: lat,
    origin_lng: lng,
    radius_km: radiusKm,
    result_limit: 50,
  });
  const results = (data ?? []) as NearbyProduct[];

  const keywords = rawQuery
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w && !STOPWORDS.has(w));
  if (keywords.length === 0) return results.slice(0, 24);

  return results.filter((r) => keywords.some((k) => r.name.toLowerCase().includes(k))).slice(0, 24);
}

// Plain Levenshtein distance — used only for fuzzy city-name matching
// below, on strings short enough (city names) that an O(n*m) table is
// irrelevant for perf.
function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// A typo'd city name ("shekaa" instead of "shekka") previously fell all
// the way through to "search every city" with no acknowledgement anything
// was misspelled. Only kicks in when parseQuery found no exact substring
// match at all, and only accepts a close single-word match (distance <= 2,
// and not on very short names where that'd be too loose to mean anything).
function fuzzyMatchCity(raw: string, cities: City[]): City | null {
  const words = raw.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, '')).filter(Boolean);
  let best: { city: City; dist: number } | null = null;
  for (const word of words) {
    if (word.length < 4) continue;
    for (const c of cities) {
      const name = c.name.toLowerCase();
      if (name.length < 4) continue;
      const dist = editDistance(word, name);
      if (dist <= 2 && (!best || dist < best.dist)) best = { city: c, dist };
    }
  }
  return best?.city ?? null;
}

// Searches the matched city first; if that comes up empty and the city has
// a region, falls back to other marketplace-enabled cities in the same
// region ("near Shekka" -> other North Lebanon cities). With no city
// detected in the query at all, searches every marketplace-enabled city at
// once. Now also matches services and businesses, not just products (see
// runCombinedQuery), and tolerates a small typo in the city name.
export async function smartSearch(rawQuery: string): Promise<SmartSearchResult> {
  const { cities, attrValues } = await loadSearchVocabulary();
  let parsed = parseQuery(rawQuery, cities, attrValues);

  if (!parsed.city) {
    const fuzzy = fuzzyMatchCity(rawQuery, cities);
    if (fuzzy) parsed = { ...parsed, city: fuzzy };
  }

  if (!parsed.city) {
    const allCityIds = cities.map((c) => c.id);
    const inCity = allCityIds.length > 0 ? await runCombinedQuery(allCityIds, parsed.facets, parsed.keywords) : [];
    return { parsed, inCity, nearby: [], nearbyCities: [], allCities: cities };
  }

  const inCity = await runCombinedQuery([parsed.city.id], parsed.facets, parsed.keywords);
  if (inCity.length > 0) {
    return { parsed, inCity, nearby: [], nearbyCities: [], allCities: cities };
  }

  const nearbyCities = parsed.city.region
    ? cities.filter((c) => c.region === parsed.city!.region && c.id !== parsed.city!.id)
    : [];
  const nearby =
    nearbyCities.length > 0 ? await runCombinedQuery(nearbyCities.map((c) => c.id), parsed.facets, parsed.keywords) : [];

  return { parsed, inCity: [], nearby, nearbyCities, allCities: cities };
}
