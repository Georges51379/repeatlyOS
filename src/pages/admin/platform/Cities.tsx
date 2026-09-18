import { useCallback, useEffect, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import Toast from '../../../components/Toast';
import type { City } from '../../../types/domain';

export default function Cities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCityName, setNewCityName] = useState('');
  const [newCitySlug, setNewCitySlug] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('cities').select('*').order('name');
    setCities((data ?? []) as City[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCity = async () => {
    if (!newCityName.trim() || !newCitySlug.trim()) return;
    setError(null);
    setAdding(true);
    const { error: insertError } = await supabase.from('cities').insert({
      name: newCityName.trim(),
      slug: newCitySlug.trim().toLowerCase(),
      display_name: newCityName.trim(),
    });
    setAdding(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setToast({ message: `${newCityName.trim()} added.`, type: 'success' });
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

  return (
    <div className="max-w-3xl">
      <PageHeader title="Cities" subtitle="Where merchants can register, and where the public marketplace is live." />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-medium text-sm mb-3">Add a city</h2>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">City name</label>
            <input
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="e.g. Jounieh"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Slug</label>
            <input
              value={newCitySlug}
              onChange={(e) => setNewCitySlug(e.target.value)}
              placeholder="e.g. jounieh"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addCity}
              disabled={adding || !newCityName.trim() || !newCitySlug.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-medium text-sm mb-3">All cities</h2>
        {loading ? null : cities.length === 0 ? (
          <EmptyState type="generic" />
        ) : (
          <div className="space-y-2">
            {cities.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                  <p className="text-white text-sm">{c.display_name ?? c.name}</p>
                </div>
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
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
