import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { placeholderImage } from '../lib/placeholderImage';
import LazyImage from '../components/LazyImage';
import type { City } from '../types/domain';

export default function CityDirectory() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('cities').select('*').eq('marketplace_enabled', true).order('name');
      setCities((data ?? []) as City[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back home
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-white font-bold">RepeatlyOS</span>
        </div>
        <h1 className="text-white font-black text-2xl mb-1">Choose your city</h1>
        <p className="text-slate-500 text-sm mb-8">Pick a city to browse the local businesses selling there.</p>

        {loading ? null : cities.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
            <MapPin className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No cities open yet.</p>
            <p className="text-slate-500 text-sm">Check back soon — we're expanding city by city.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {cities.map((c) => (
              <Link
                key={c.id}
                to={`/${c.slug}`}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-colors card-hover group"
              >
                <div className="w-full aspect-[16/9] overflow-hidden relative">
                  <LazyImage
                    src={c.cover_image_url || placeholderImage('city', c.id, { w: 640, h: 360 })}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/0 to-transparent" />
                </div>
                <div className="p-5">
                  <p className="text-white font-bold text-lg mb-1">{c.display_name ?? c.name}</p>
                  <p className="text-slate-500 text-xs mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {c.region ? `${c.region}, ` : ''}
                    {c.country}
                  </p>
                  {c.description && <p className="text-slate-400 text-sm line-clamp-2 mb-3">{c.description}</p>}
                  <span className="inline-flex items-center gap-1 text-blue-400 text-sm font-medium group-hover:text-blue-300">
                    See shops <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
