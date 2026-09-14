import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Package, MapPin, Zap, LocateFixed } from 'lucide-react';
import { smartSearch, searchNearMe, type SmartSearchResult, type SearchResultProduct, type NearbyProduct } from '../../lib/smartSearch';
import { getCurrentPosition, formatDistance } from '../../lib/geo';
import PriceTag from '../../components/PriceTag';

export default function Discover() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(q);
  const [result, setResult] = useState<SmartSearchResult | null>(null);
  const [nearbyProducts, setNearbyProducts] = useState<NearbyProduct[] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);

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
    });
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) navigate(`/discover?q=${encodeURIComponent(inputValue.trim())}`);
  };

  // True GPS-radius search (migration 20260914000005 / src/lib/geo.ts) —
  // an alternative to the region-string "nearby city" fallback `smartSearch`
  // falls back to, for a shopper who wants "actually near where I am right
  // now" rather than "in whichever city I typed".
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

  const renderProduct = (p: SearchResultProduct) => (
    <Link
      key={p.id}
      to={`/${citySlugFor(p.business.city_id)}/business/${p.business.slug}/product/${p.id}`}
      className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-4 flex items-center gap-3 transition-colors"
    >
      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
        <Package className="w-5 h-5 text-slate-600" />
      </div>
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">{p.name}</p>
        <p className="text-xs text-slate-500">
          {p.business.name} · <PriceTag usd={p.sale_price ?? p.price} />
        </p>
      </div>
    </Link>
  );

  const renderNearby = (p: NearbyProduct) => (
    <Link
      key={p.id}
      to={`/${citySlugFor(p.city_id)}/business/${p.business_slug}/product/${p.id}`}
      className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-4 flex items-center gap-3 transition-colors"
    >
      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
        <Package className="w-5 h-5 text-slate-600" />
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
          <span className="text-white font-bold">RepeatlyOS Discover</span>
        </div>

        <form onSubmit={handleSubmit} className="mb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder='Try: "nike basketball shoes in shekka"'
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Describe what you want and where — we'll match it against real listings.
          </p>
        </form>

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
                {result.inCity.map(renderProduct)}
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
                {result.nearby.map(renderProduct)}
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
