import { describe, expect, it } from 'vitest';
import { parseQuery } from './smartSearch';
import type { City } from '../types/domain';

function city(name: string, region: string | null = 'North Lebanon'): City {
  return {
    id: name,
    name,
    slug: name.toLowerCase(),
    display_name: name,
    country: 'Lebanon',
    region,
    active: true,
    marketplace_enabled: true,
    logo_url: null,
    cover_image_url: null,
    description: null,
    seo_title: null,
    seo_description: null,
    custom_domain: null,
    created_at: '',
    updated_at: '',
  };
}

// The exact scenario from the product report: "nike basketball shoes in
// shekka" — this is the actual parser behind the marketplace's signature
// search feature, so it's worth pinning down with a real test rather than
// only exercising it by hand through the UI.
describe('parseQuery', () => {
  const cities = [city('Shekka'), city('Batroun')];
  const attrValues = [
    { key: 'brand', value: 'Nike' },
    { key: 'category', value: 'Basketball' },
  ];

  it('extracts the city, matched facets, and leftover keywords', () => {
    const result = parseQuery('nike basketball shoes in shekka', cities, attrValues);
    expect(result.city?.name).toBe('Shekka');
    expect(result.facets).toEqual(
      expect.arrayContaining([
        { key: 'brand', value: 'Nike' },
        { key: 'category', value: 'Basketball' },
      ]),
    );
    expect(result.keywords).toBe('shoes');
  });

  it('returns no city when none is named', () => {
    const result = parseQuery('nike basketball shoes', cities, attrValues);
    expect(result.city).toBeNull();
    expect(result.keywords).toBe('shoes');
  });

  it('prefers the longer city name match when one city name is a substring of another', () => {
    const overlapping = [city('Beirut'), city('Beirut South')];
    const result = parseQuery('looking for a laptop in beirut south', overlapping, []);
    expect(result.city?.name).toBe('Beirut South');
  });

  it('strips stopwords from the leftover keywords', () => {
    const result = parseQuery('i want a laptop please', [], []);
    expect(result.keywords).toBe('laptop');
  });
});
