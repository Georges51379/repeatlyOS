import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Building2, Check, Ban, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import type { Business, City } from '../../types/domain';

export default function CityAdminDashboard() {
  const { cityId } = useParams<{ cityId: string }>();
  const { isPlatformAdmin, cityAdminOf, loading: rolesLoading } = useAdminRoles();
  const [city, setCity] = useState<City | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canManage = !rolesLoading && !!cityId && (isPlatformAdmin || cityAdminOf.includes(cityId));

  const load = useCallback(async () => {
    if (!cityId) return;
    const { data: cityRow } = await supabase.from('cities').select('*').eq('id', cityId).maybeSingle();
    setCity((cityRow ?? null) as City | null);
    setDescription((cityRow as City | null)?.description ?? '');

    const { data: businessRows } = await supabase
      .from('businesses')
      .select('*')
      .eq('city_id', cityId)
      .order('created_at', { ascending: false });
    setBusinesses((businessRows ?? []) as Business[]);
  }, [cityId]);

  useEffect(() => {
    if (canManage) load();
  }, [canManage, load]);

  if (rolesLoading) return null;
  if (!cityId || !canManage) return <Navigate to="/app" replace />;

  const counts = {
    total: businesses.length,
    active: businesses.filter((b) => b.status === 'active').length,
    pending: businesses.filter((b) => b.status === 'pending_approval').length,
    suspended: businesses.filter((b) => b.status === 'suspended').length,
  };

  const setStatus = async (id: string, status: 'active' | 'suspended' | 'rejected') => {
    await supabase.from('businesses').update({ status }).eq('id', id);
    await load();
  };

  const saveDescription = async () => {
    if (!cityId) return;
    setError(null);
    const { error: updateError } = await supabase.from('cities').update({ description }).eq('id', cityId);
    if (updateError) setError(updateError.message);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Building2 className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">{city?.display_name ?? city?.name ?? 'City'} — City Admin</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            ['Total', counts.total],
            ['Active', counts.active],
            ['Pending', counts.pending],
            ['Suspended', counts.suspended],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">{label}</p>
              <p className="text-white text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-3">Businesses in this city</h2>
          {businesses.length === 0 ? (
            <p className="text-slate-500 text-sm">No businesses yet.</p>
          ) : (
            <div className="space-y-2">
              {businesses.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-white text-sm">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {b.status !== 'active' && (
                      <button
                        onClick={() => setStatus(b.id, 'active')}
                        title="Approve / reactivate"
                        className="p-1.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'active' && (
                      <button
                        onClick={() => setStatus(b.id, 'suspended')}
                        title="Suspend"
                        className="p-1.5 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'suspended' && (
                      <button
                        onClick={() => setStatus(b.id, 'active')}
                        title="Reinstate"
                        className="p-1.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-medium text-sm mb-3">City description</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
          />
          <button onClick={saveDescription} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-semibold">
            Save
          </button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
