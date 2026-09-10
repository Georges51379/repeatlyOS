import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Check, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import type { Business, City } from '../../types/domain';

interface Counts {
  cities: number;
  businesses: number;
  activeBusinesses: number;
  pendingApproval: number;
  orders: number;
  bookings: number;
}

async function countAll(table: string) {
  const { count: n } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return n ?? 0;
}

async function countBusinessesByStatus(status: string) {
  const { count: n } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);
  return n ?? 0;
}

export default function PlatformAdminDashboard() {
  const { isPlatformAdmin, loading: rolesLoading } = useAdminRoles();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [pending, setPending] = useState<Business[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [newCityName, setNewCityName] = useState('');
  const [newCitySlug, setNewCitySlug] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignCityId, setAssignCityId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [citiesCount, businessesCount, activeCount, pendingCount, ordersCount, bookingsCount] = await Promise.all([
      countAll('cities'),
      countAll('businesses'),
      countBusinessesByStatus('active'),
      countBusinessesByStatus('pending_approval'),
      countAll('orders'),
      countAll('bookings'),
    ]);
    setCounts({
      cities: citiesCount,
      businesses: businessesCount,
      activeBusinesses: activeCount,
      pendingApproval: pendingCount,
      orders: ordersCount,
      bookings: bookingsCount,
    });

    const { data: pendingRows } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: true });
    setPending((pendingRows ?? []) as Business[]);

    const { data: cityRows } = await supabase.from('cities').select('*').order('name');
    setCities((cityRows ?? []) as City[]);
  }, []);

  useEffect(() => {
    if (isPlatformAdmin) load();
  }, [isPlatformAdmin, load]);

  if (rolesLoading) return null;
  if (!isPlatformAdmin) return <Navigate to="/app" replace />;

  const setBusinessStatus = async (id: string, status: 'active' | 'rejected') => {
    await supabase.from('businesses').update({ status }).eq('id', id);
    await load();
  };

  const addCity = async () => {
    if (!newCityName.trim() || !newCitySlug.trim()) return;
    setError(null);
    const { error: insertError } = await supabase.from('cities').insert({
      name: newCityName.trim(),
      slug: newCitySlug.trim().toLowerCase(),
      display_name: newCityName.trim(),
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setNewCityName('');
    setNewCitySlug('');
    await load();
  };

  const toggleCityActive = async (city: City) => {
    await supabase.from('cities').update({ active: !city.active }).eq('id', city.id);
    await load();
  };

  const toggleMarketplace = async (city: City) => {
    await supabase.from('cities').update({ marketplace_enabled: !city.marketplace_enabled }).eq('id', city.id);
    await load();
  };

  const assignCityAdmin = async () => {
    if (!assignEmail.trim() || !assignCityId) {
      setError('Email and city are both required.');
      return;
    }
    setError(null);
    setNotice(null);
    const { data: profileRows, error: lookupError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', assignEmail.trim())
      .maybeSingle();
    if (lookupError || !profileRows) {
      setError('No user found with that email (they must have signed up at least once).');
      return;
    }
    const { error: insertError } = await supabase
      .from('city_admins')
      .insert({ user_id: profileRows.id, city_id: assignCityId });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setNotice(`Granted city admin to ${assignEmail.trim()}.`);
    setAssignEmail('');
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">Platform Admin</span>
        </div>

        {counts && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              ['Cities', counts.cities],
              ['Businesses', counts.businesses],
              ['Active businesses', counts.activeBusinesses],
              ['Pending approval', counts.pendingApproval],
              ['Orders', counts.orders],
              ['Bookings', counts.bookings],
            ].map(([label, value]) => (
              <div key={label as string} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-500 text-xs mb-1">{label}</p>
                <p className="text-white text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-600 mb-8">
          MRR, trials, and churn aren't shown — no billing/subscription system exists yet (Phase 8). Showing
          placeholder numbers here would be misleading.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-3">Pending business approvals</h2>
          {pending.length === 0 ? (
            <p className="text-slate-500 text-sm">Nothing pending.</p>
          ) : (
            <div className="space-y-2">
              {pending.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-white text-sm">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.business_type_key}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBusinessStatus(b.id, 'active')}
                      className="p-1.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setBusinessStatus(b.id, 'rejected')}
                      className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-3">Cities</h2>
          <div className="space-y-2 mb-4">
            {cities.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                <p className="text-white text-sm">{c.display_name ?? c.name}</p>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-400">
                    <input type="checkbox" checked={c.active} onChange={() => toggleCityActive(c)} className="accent-blue-500" />
                    Open for merchants
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-400">
                    <input
                      type="checkbox"
                      checked={c.marketplace_enabled}
                      onChange={() => toggleMarketplace(c)}
                      className="accent-blue-500"
                    />
                    Public marketplace
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="City name"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <input
              value={newCitySlug}
              onChange={(e) => setNewCitySlug(e.target.value)}
              placeholder="slug"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button onClick={addCity} className="px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-medium text-sm mb-3">Grant city admin</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              placeholder="User's email (must have signed up already)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <select
              value={assignCityId}
              onChange={(e) => setAssignCityId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">City…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button onClick={assignCityAdmin} className="px-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-semibold py-2">
              Grant
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          {notice && <p className="text-xs text-emerald-400 mt-2">{notice}</p>}
        </div>
      </div>
    </div>
  );
}
