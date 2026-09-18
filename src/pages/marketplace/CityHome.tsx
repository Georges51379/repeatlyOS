import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, Store } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../lib/i18n';
import VerifiedBadge from '../../components/VerifiedBadge';
import LazyImage from '../../components/LazyImage';
import { placeholderImage, businessTypeToImageKind } from '../../lib/placeholderImage';
import type { Business, City } from '../../types/domain';

export default function CityHome() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [city, setCity] = useState<City | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [notOpenYet, setNotOpenYet] = useState(false);

  useEffect(() => {
    if (!citySlug) return;
    (async () => {
      const { data: cityRow } = await supabase.from('cities').select('*').eq('slug', citySlug).maybeSingle();
      if (!cityRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!(cityRow as City).marketplace_enabled) {
        setNotOpenYet(true);
        setLoading(false);
        return;
      }
      setCity(cityRow as City);

      const { data: businessRows } = await supabase
        .from('businesses')
        .select('*')
        .eq('city_id', cityRow.id)
        .eq('status', 'active')
        .eq('marketplace_visible', true)
        .order('name');
      setBusinesses((businessRows ?? []) as Business[]);
      setLoading(false);
    })();
  }, [citySlug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/${citySlug}/search?q=${encodeURIComponent(search.trim())}`);
  };

  const filtered = businesses.filter(
    (b) =>
      search.trim() === '' ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.category ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const categories = Array.from(new Set(businesses.map((b) => b.business_type_key).filter(Boolean)));

  if (loading) return null;
  if (notFound) {
    return <p className="text-slate-400 text-center py-20">This city marketplace doesn't exist.</p>;
  }
  if (notOpenYet) {
    return <p className="text-slate-400 text-center py-20">This city's marketplace isn't open to the public yet.</p>;
  }

  return (
    <div>
      <div className="text-center py-8">
        <h1 className="text-white font-bold text-2xl mb-2">Buy {city?.display_name ?? city?.name}</h1>
        <p className="text-slate-500 text-sm mb-6">{city?.description}</p>
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((c) => (
            <span key={c} className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 capitalize">
              {c?.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Store className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">{t('browse.noBusinesses')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <Link
              key={b.id}
              to={`/${citySlug}/business/${b.slug}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-colors"
            >
              <div className="w-full aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden">
                <LazyImage
                  src={b.cover_image_url || placeholderImage(businessTypeToImageKind(b.business_type_key), b.id)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white font-medium text-sm">{b.name}</p>
                {b.verified && <VerifiedBadge />}
              </div>
              <p className="text-xs text-slate-500 capitalize">{b.business_type_key?.replace(/_/g, ' ')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
