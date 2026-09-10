import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Package, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { City } from '../../types/domain';

interface ProductResult {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  business: { slug: string; name: string };
}

interface ServiceResult {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number;
  business: { slug: string; name: string };
}

// Master-prompt §17: real database queries (ILIKE for this scale), not
// client-side filtering of an already-loaded list, and explicitly NOT a
// paid search provider (Elasticsearch/Algolia/Typesense) for a first
// single-city launch.
//
// Faceted attribute filters (brand/size/color/…) added 2026-09-10, scoped
// into Phase 8 per user request — "Nike Kobe basketball shoes, size 43,
// black" previously could only match if that whole phrase sat inside a
// product's name. Facets come from `product_attributes` (free-form
// key/value set by the merchant), scoped to what's actually in this city
// rather than a hardcoded global list, since different business types use
// different attributes.
const MAX_FACETS = 4;

export default function Search() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [city, setCity] = useState<City | null>(null);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [services, setServices] = useState<ServiceResult[]>([]);
  const [facetOptions, setFacetOptions] = useState<Record<string, string[]>>({});
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Facet options are scoped to the city and loaded once (independent of
  // the text query / selected facets), so the dropdowns don't reshuffle as
  // the shopper narrows their search.
  useEffect(() => {
    if (!citySlug) return;
    (async () => {
      const { data: cityRow } = await supabase.from('cities').select('*').eq('slug', citySlug).maybeSingle();
      if (!cityRow) return;

      const { data: attrRows } = await supabase
        .from('product_attributes')
        .select('key, value, product:products!inner(business_id, active, marketplace_visible, business:businesses!inner(city_id, status, marketplace_visible))')
        .eq('product.active', true)
        .eq('product.marketplace_visible', true)
        .eq('product.business.city_id', cityRow.id)
        .eq('product.business.status', 'active')
        .eq('product.business.marketplace_visible', true);

      const grouped: Record<string, Set<string>> = {};
      for (const row of (attrRows ?? []) as { key: string; value: string }[]) {
        if (!grouped[row.key]) grouped[row.key] = new Set();
        grouped[row.key].add(row.value);
      }
      const options: Record<string, string[]> = {};
      Object.entries(grouped)
        .slice(0, MAX_FACETS)
        .forEach(([key, values]) => {
          options[key] = Array.from(values).sort();
        });
      setFacetOptions(options);
    })();
  }, [citySlug]);

  useEffect(() => {
    if (!citySlug) return;
    const activeFacets = Object.entries(selectedFacets).filter(([, v]) => v !== '');
    if (!q.trim() && activeFacets.length === 0) {
      setProducts([]);
      setServices([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data: cityRow } = await supabase.from('cities').select('*').eq('slug', citySlug).maybeSingle();
      if (!cityRow) {
        setLoading(false);
        return;
      }
      setCity(cityRow as City);

      let productQuery = supabase
        .from('products')
        .select(
          `id, name, price, sale_price,
           business:businesses!inner(slug, name, city_id, marketplace_visible, status)${activeFacets
             .map((_, i) => `, attr_${i}:product_attributes!inner(key, value)`)
             .join('')}`,
        )
        .eq('active', true)
        .eq('marketplace_visible', true)
        .eq('business.city_id', cityRow.id)
        .eq('business.marketplace_visible', true)
        .eq('business.status', 'active')
        .limit(24);

      if (q.trim()) productQuery = productQuery.ilike('name', `%${q}%`);
      activeFacets.forEach(([key, value], i) => {
        productQuery = productQuery.eq(`attr_${i}.key`, key).eq(`attr_${i}.value`, value);
      });

      // Facets are product-only (they come from product_attributes), so a
      // facet-only browse (no text query) has no meaningful service search
      // to run — only query services when there's an actual text query.
      const [{ data: productRows }, { data: serviceRows }] = await Promise.all([
        productQuery,
        q.trim()
          ? supabase
              .from('services')
              .select('id, name, price, duration_minutes, business:businesses!inner(slug, name, city_id, marketplace_visible, status)')
              .eq('active', true)
              .eq('booking_enabled', true)
              .eq('business.city_id', cityRow.id)
              .eq('business.marketplace_visible', true)
              .eq('business.status', 'active')
              .ilike('name', `%${q}%`)
              .limit(24)
          : Promise.resolve({ data: [] as ServiceResult[] }),
      ]);
      setProducts((productRows ?? []) as unknown as ProductResult[]);
      setServices((serviceRows ?? []) as unknown as ServiceResult[]);
      setLoading(false);
    })();
  }, [citySlug, q, selectedFacets]);

  if (loading) return null;

  const facetEntries = Object.entries(facetOptions);

  return (
    <div>
      <h1 className="text-white font-semibold text-lg mb-1">{q ? `Search results for "${q}"` : 'Browse'}</h1>
      <p className="text-slate-500 text-sm mb-4">in {city?.display_name ?? citySlug}</p>

      {facetEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {facetEntries.map(([key, values]) => (
            <select
              key={key}
              value={selectedFacets[key] ?? ''}
              onChange={(e) => setSelectedFacets({ ...selectedFacets, [key]: e.target.value })}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white capitalize focus:outline-none focus:border-blue-500"
            >
              <option value="">{key.replace(/_/g, ' ')}</option>
              {values.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {products.length === 0 && services.length === 0 && (
        <p className="text-slate-500 text-sm">No products or services matched.</p>
      )}

      {products.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Products</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <Link
                key={p.id}
                to={`/${citySlug}/business/${p.business.slug}/product/${p.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {p.business.name} · ${p.sale_price ?? p.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Services</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((s) => (
              <Link
                key={s.id}
                to={`/${citySlug}/business/${s.business.slug}/service/${s.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {s.business.name} · {s.duration_minutes} min
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
