import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Check, Ban, Play, Store, CheckCircle2, Clock3, ShieldOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Breadcrumbs from '../../components/Breadcrumbs';
import Toast from '../../components/Toast';
import type { Business, City } from '../../types/domain';

export default function CityAdminDashboard() {
  const { cityId } = useParams<{ cityId: string }>();
  const { isPlatformAdmin, cityAdminOf, loading: rolesLoading } = useAdminRoles();
  const [city, setCity] = useState<City | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savingDescription, setSavingDescription] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  // Activating must ALSO turn on marketplace_visible, mirroring the same
  // fix on the platform-admin approvals flow — otherwise a business a city
  // admin approves/reinstates here can silently stay invisible in the
  // public marketplace despite being "active".
  const setStatus = async (id: string, status: 'active' | 'suspended' | 'rejected') => {
    const payload = status === 'active' ? { status, marketplace_visible: true } : { status };
    await supabase.from('businesses').update(payload).eq('id', id);
    setToast({
      message: status === 'active' ? 'Business is now active and visible in this city.' : status === 'suspended' ? 'Business suspended.' : 'Business rejected.',
      type: 'success',
    });
    await load();
  };

  const saveDescription = async () => {
    if (!cityId) return;
    setError(null);
    setSavingDescription(true);
    const { error: updateError } = await supabase.from('cities').update({ description }).eq('id', cityId);
    setSavingDescription(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setToast({ message: 'City description saved.', type: 'success' });
  };

  const cityLabel = city?.display_name ?? city?.name ?? 'City';

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 md:py-10">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={[{ label: 'City Admin' }, { label: cityLabel }]} />

        <PageHeader title={`${cityLabel} — City Admin`} subtitle="Manage businesses registered in this city." />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total" value={counts.total} icon={Store} />
          <StatCard title="Active" value={counts.active} icon={CheckCircle2} accent="emerald" />
          <StatCard title="Pending" value={counts.pending} icon={Clock3} accent="amber" />
          <StatCard title="Suspended" value={counts.suspended} icon={ShieldOff} accent="orange" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-3">Businesses in this city</h2>
          {businesses.length === 0 ? (
            <EmptyState type="generic" />
          ) : (
            <div className="space-y-2">
              {businesses.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{b.name}</p>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex gap-2 shrink-0">
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
          <h2 className="text-white font-medium text-sm mb-1">City description</h2>
          <p className="text-xs text-slate-500 mb-3">Shown to shoppers browsing this city in the public marketplace.</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="A short description of what makes this city's marketplace worth browsing…"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
          />
          <button
            onClick={saveDescription}
            disabled={savingDescription}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold"
          >
            {savingDescription ? 'Saving…' : 'Save'}
          </button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
