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
  name: string;
  price: number;
  sale_price: number | null;
  business: { slug: string; name: string; city_id: string };
}

async function runProductQuery(cityIds: string[], facets: { key: string; value: string }[], keywords: string) {
  let query = supabase
    .from('products')
    .select(
      `id, name, price, sale_price,
       business:businesses!inner(slug, name, city_id, marketplace_visible, status)${facets
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
  return (data ?? []) as unknown as SearchResultProduct[];
}

export interface SmartSearchResult {
  parsed: ParsedQuery;
  inCity: SearchResultProduct[];
  nearby: SearchResultProduct[];
  nearbyCities: City[];
  allCities: City[];
}

// Searches the matched city first; if that comes up empty and the city has
// a region, falls back to other marketplace-enabled cities in the same
// region ("near Shekka" -> other North Lebanon cities). With no city
// detected in the query at all, searches every marketplace-enabled city at
// once.
export async function smartSearch(rawQuery: string): Promise<SmartSearchResult> {
  const { cities, attrValues } = await loadSearchVocabulary();
  const parsed = parseQuery(rawQuery, cities, attrValues);

  if (!parsed.city) {
    const allCityIds = cities.map((c) => c.id);
    const inCity = allCityIds.length > 0 ? await runProductQuery(allCityIds, parsed.facets, parsed.keywords) : [];
    return { parsed, inCity, nearby: [], nearbyCities: [], allCities: cities };
  }

  const inCity = await runProductQuery([parsed.city.id], parsed.facets, parsed.keywords);
  if (inCity.length > 0) {
    return { parsed, inCity, nearby: [], nearbyCities: [], allCities: cities };
  }

  const nearbyCities = parsed.city.region
    ? cities.filter((c) => c.region === parsed.city!.region && c.id !== parsed.city!.id)
    : [];
  const nearby =
    nearbyCities.length > 0 ? await runProductQuery(nearbyCities.map((c) => c.id), parsed.facets, parsed.keywords) : [];

  return { parsed, inCity: [], nearby, nearbyCities, allCities: cities };
}
