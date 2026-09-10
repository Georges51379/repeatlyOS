import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Store, Zap, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cities.map((c) => (
              <Link
                key={c.id}
                to={`/${c.slug}`}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-6 transition-colors group"
              >
                <div className="w-11 h-11 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/20 transition-colors">
                  <Store className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-white font-bold text-lg mb-1">{c.display_name ?? c.name}</p>
                <p className="text-slate-500 text-xs mb-3">
                  {c.region ? `${c.region}, ` : ''}
                  {c.country}
                </p>
                {c.description && <p className="text-slate-400 text-sm line-clamp-2">{c.description}</p>}
                <span className="inline-block mt-4 text-blue-400 text-sm font-medium group-hover:text-blue-300">
                  See shops →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
