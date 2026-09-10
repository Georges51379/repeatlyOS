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
export default function Search() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [city, setCity] = useState<City | null>(null);
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [services, setServices] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!citySlug || !q.trim()) {
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

      const [{ data: productRows }, { data: serviceRows }] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price, sale_price, business:businesses!inner(slug, name, city_id, marketplace_visible, status)')
          .eq('active', true)
          .eq('marketplace_visible', true)
          .eq('business.city_id', cityRow.id)
          .eq('business.marketplace_visible', true)
          .eq('business.status', 'active')
          .ilike('name', `%${q}%`)
          .limit(24),
        supabase
          .from('services')
          .select('id, name, price, duration_minutes, business:businesses!inner(slug, name, city_id, marketplace_visible, status)')
          .eq('active', true)
          .eq('booking_enabled', true)
          .eq('business.city_id', cityRow.id)
          .eq('business.marketplace_visible', true)
          .eq('business.status', 'active')
          .ilike('name', `%${q}%`)
          .limit(24),
      ]);
      setProducts((productRows ?? []) as unknown as ProductResult[]);
      setServices((serviceRows ?? []) as unknown as ServiceResult[]);
      setLoading(false);
    })();
  }, [citySlug, q]);

  if (loading) return null;

  return (
    <div>
      <h1 className="text-white font-semibold text-lg mb-1">Search results for "{q}"</h1>
      <p className="text-slate-500 text-sm mb-6">in {city?.display_name ?? citySlug}</p>

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
