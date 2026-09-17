import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  Search,
  Store,
  MapPin,
  Calendar,
  Package,
  CreditCard,
  Users,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { City } from '../types/domain';

const businessFeatures = [
  { icon: Store, label: 'Products & orders', desc: 'List what you sell, take orders online or in person.' },
  { icon: Calendar, label: 'Bookings', desc: 'Customers book services directly; no more back-and-forth.' },
  { icon: Package, label: 'Inventory', desc: 'Stock levels tracked automatically as you sell.' },
  { icon: CreditCard, label: 'Payments', desc: 'Cash, Whish, OMT, or bank transfer — all logged in one place.' },
  { icon: Users, label: 'Customers & staff', desc: 'Every customer\'s history, and a task board for your team.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('cities')
        .select('*')
        .eq('marketplace_enabled', true)
        .order('name')
        .limit(6);
      setCities((data ?? []) as City[]);
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 h-14 border-b border-slate-800/60 sticky top-0 bg-slate-950/95 backdrop-blur-md z-20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">RepeatlyOS</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/cities" className="text-xs text-slate-400 hover:text-white transition-colors">
            Browse cities
          </Link>
          <Link to="/app" className="text-xs text-slate-400 hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
        <Link
          to="/signup"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Register your business
        </Link>
      </nav>

      {/* Hero — say what this is in 5 seconds */}
      <section className="px-6 lg:px-12 pt-20 pb-14 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
          <MapPin size={11} className="text-blue-400" />
          <span className="text-xs text-blue-300 font-medium">Live now in Batroun &amp; Shekka, Lebanon</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight mb-4">
          Find local shops by city.
          <br />
          <span className="text-blue-400">Run yours end to end.</span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
          RepeatlyOS is a city marketplace where shoppers find real local businesses — and the operating
          system those businesses run on: orders, bookings, payments, and customers, all in one place.
        </p>

        {/* The unique feature: describe what you want, get matched */}
        <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try: "nike basketball shoes in shekka"'
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-28 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/cities"
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <MapPin size={15} /> Browse all cities
          </Link>
          <Link
            to="/signup"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Register your business <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* City directory teaser — real cities, right on the homepage */}
      <section className="px-6 lg:px-12 py-14 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Pick your city</h2>
            <Link to="/cities" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              See all →
            </Link>
          </div>
          {cities.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <MapPin className="w-7 h-7 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No cities open yet — check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cities.map((c) => (
                <Link
                  key={c.id}
                  to={`/${c.slug}`}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-xl p-4 transition-colors group"
                >
                  <div className="w-8 h-8 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600/20 transition-colors">
                    <Store className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-white font-semibold text-sm">{c.display_name ?? c.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{c.region ?? c.country}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* For business owners — condensed, one section, not a full pitch deck */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-blue-400" />
            <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider">For business owners</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">Sell on the marketplace. Run your whole business.</h2>
          <p className="text-slate-400 mb-8 max-w-xl">
            Register once — get a storefront shoppers in your city can find, plus the tools to manage every
            order, booking, and customer that comes from it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            {businessFeatures.map((f) => (
              <div key={f.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center mb-3">
                  <f.icon size={15} className="text-blue-400" />
                </div>
                <p className="text-white font-bold text-xs mb-1">{f.label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              Register your business <ArrowRight size={15} />
            </Link>
            <span className="flex items-center gap-1.5 text-slate-500 text-xs">
              <CheckCircle size={12} className="text-emerald-500" /> Free to start
            </span>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 lg:px-12 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span className="text-slate-500 text-xs font-medium">RepeatlyOS</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/cities" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Browse cities
            </Link>
            <Link to="/signup" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Register a business
            </Link>
            <Link to="/app" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
