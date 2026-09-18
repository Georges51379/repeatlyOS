import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Package, Store, MapPin, Zap, LocateFixed, Clock, X } from 'lucide-react';
import {
  smartSearch,
  searchNearMe,
  type SmartSearchResult,
  type SearchResultItem,
  type NearbyProduct,
} from '../../lib/smartSearch';
import { getCurrentPosition, formatDistance } from '../../lib/geo';
import { placeholderImage, businessTypeToImageKind } from '../../lib/placeholderImage';
import PriceTag from '../../components/PriceTag';
import LazyImage from '../../components/LazyImage';

const RECENT_KEY = 'repeatlyos_recent_searches';
const MAX_RECENT = 6;
const DEBOUNCE_MS = 400;

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const existing = loadRecent().filter((q) => q.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...existing].slice(0, MAX_RECENT)));
  } catch {
    // localStorage unavailable (private browsing, etc.) — recent chips just won't persist
  }
}

const EXAMPLE_QUERIES = ['nike basketball shoes in shekka', 'haircut in jounieh', 'iphone charger tripoli', 'birthday cake beirut'];

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(q);
  const [result, setResult] = useState<SmartSearchResult | null>(null);
  const [nearbyProducts, setNearbyProducts] = useState<NearbyProduct[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    setInputValue(q);
    setNearbyProducts(null);
    if (!q.trim()) {
      setResult(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    smartSearch(q).then((r) => {
      setResult(r);
      setLoading(false);
      saveRecent(q.trim());
      setRecent(loadRecent());
    });
  }, [q]);

  // Live, debounced search-as-you-type — the URL (and thus the effect
  // above) only updates 400ms after the shopper stops typing, so a fast
  // typist doesn't fire a query per keystroke. `replace: true` keeps the
  // browser back-button from having to step through every partial query.
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        setSearchParams({ q: value.trim() }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, DEBOUNCE_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.trim()) setSearchParams({ q: inputValue.trim() }, { replace: true });
  };

  const runQuery = (value: string) => {
    setInputValue(value);
    setSearchParams({ q: value }, { replace: true });
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    setLocationDenied(false);
    const pos = await getCurrentPosition();
    setLocating(false);
    if (!pos) {
      setLocationDenied(true);
      return;
    }
    const results = await searchNearMe(pos.lat, pos.lng, inputValue);
    setNearbyProducts(results);
  };

  const citySlugFor = (cityId: string) => result?.allCities.find((c) => c.id === cityId)?.slug ?? '';

  const renderResult = (item: SearchResultItem) => {
    if (item.kind === 'business') {
      const citySlug = citySlugFor(item.city_id);
      return (
        <Link
          key={`b-${item.id}`}
          to={`/${citySlug}/business/${item.slug}`}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-3 flex items-center gap-3 transition-colors card-hover"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
            <LazyImage
              src={item.cover_image_url || placeholderImage(businessTypeToImageKind(item.business_type_key), item.id, { w: 96, h: 96 })}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {item.name}
            </p>
            <p className="text-xs text-slate-500 capitalize">{item.business_type_key?.replace(/_/g, ' ') ?? 'Business'}</p>
          </div>
        </Link>
      );
    }
    if (item.kind === 'service') {
      const citySlug = citySlugFor(item.business.city_id);
      return (
        <Link
          key={`s-${item.id}`}
          to={`/${citySlug}/business/${item.business.slug}/service/${item.id}`}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-3 flex items-center gap-3 transition-colors card-hover"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
            <LazyImage src={placeholderImage('service', item.id, { w: 96, h: 96 })} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-slate-500">
              {item.business.name} · {item.duration_minutes} min{item.price != null ? <> · <PriceTag usd={item.price} /></> : ''}
            </p>
          </div>
        </Link>
      );
    }
    const citySlug = citySlugFor(item.business.city_id);
    return (
      <Link
        key={`p-${item.id}`}
        to={`/${citySlug}/business/${item.business.slug}/product/${item.id}`}
        className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-3 flex items-center gap-3 transition-colors card-hover"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
          <LazyImage src={item.image_url || placeholderImage('product', item.id, { w: 96, h: 96 })} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{item.name}</p>
          <p className="text-xs text-slate-500">
            {item.business.name} · <PriceTag usd={item.sale_price ?? item.price} />
          </p>
        </div>
      </Link>
    );
  };

  const renderNearby = (p: NearbyProduct) => (
    <Link
      key={p.id}
      to={`/${citySlugFor(p.city_id)}/business/${p.business_slug}/product/${p.id}`}
      className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-4 flex items-center gap-3 transition-colors card-hover"
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <LazyImage src={placeholderImage('product', p.id, { w: 96, h: 96 })} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{p.name}</p>
        <p className="text-xs text-slate-500">
          {p.business_name} · <PriceTag usd={p.sale_price ?? p.price} />
        </p>
      </div>
      <span className="text-xs text-blue-400 shrink-0">{formatDistance(p.distance_km)}</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-white font-bold text-gradient">RepeatlyOS Discover</span>
        </div>

        <form onSubmit={handleSubmit} className="mb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='Try: "nike basketball shoes in shekka"'
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-10 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              autoFocus
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  setSearchParams({}, { replace: true });
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Describe what you want and where — products, services, and businesses all match as you type.
          </p>
        </form>

        {!q.trim() && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {(recent.length > 0 ? recent : EXAMPLE_QUERIES).map((ex) => (
              <button
                key={ex}
                onClick={() => runQuery(ex)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {recent.length > 0 && <Clock className="w-3 h-3" />}
                {ex}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center mb-8">
          <button
            onClick={handleUseMyLocation}
            disabled={locating}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            {locating ? 'Locating…' : 'Use my location — search nearby'}
          </button>
        </div>
        {locationDenied && (
          <p className="text-xs text-amber-400 text-center mb-6">
            Couldn't get your location — check your browser's location permission and try again.
          </p>
        )}

        {nearbyProducts && (
          <div className="mb-8">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Nearest to you
            </p>
            {nearbyProducts.length === 0 ? (
              <p className="text-slate-500 text-sm">Nothing within range yet.</p>
            ) : (
              <div className="space-y-2">{nearbyProducts.map(renderNearby)}</div>
            )}
          </div>
        )}

        {!q.trim() && !nearbyProducts && (
          <p className="text-slate-500 text-sm text-center">Type a request above to get started.</p>
        )}

        {loading && q.trim() && <p className="text-slate-500 text-sm text-center">Searching…</p>}

        {!loading && result && (
          <div>
            {result.parsed.city && (
              <p className="text-xs text-slate-500 mb-4 text-center">
                Understood as: {result.parsed.facets.map((f) => f.value).join(', ') || result.parsed.keywords || 'anything'}
                {' '}
                in <span className="text-slate-300">{result.parsed.city.name}</span>
              </p>
            )}

            {result.inCity.length > 0 && (
              <div className="space-y-2 mb-8">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  {result.parsed.city ? `In ${result.parsed.city.name}` : 'Results'}
                </p>
                {result.inCity.map(renderResult)}
              </div>
            )}

            {result.inCity.length === 0 && result.nearby.length > 0 && (
              <div className="space-y-2 mb-8">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    Nothing in {result.parsed.city?.name} yet — here's what's nearby
                    {result.parsed.city?.region ? ` in ${result.parsed.city.region}` : ''}:
                  </span>
                </div>
                {result.nearby.map(renderResult)}
              </div>
            )}

            {result.inCity.length === 0 && result.nearby.length === 0 && (
              <div className="text-center py-10">
                <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">No matches yet.</p>
                <p className="text-slate-600 text-xs mb-4">
                  Try fewer or different words, or browse cities directly.
                </p>
                <Link to="/cities" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                  Browse all cities →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
