import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import Toast from '../../../components/Toast';
import type { City } from '../../../types/domain';

interface CityAdminInvite {
  id: string;
  city_id: string;
  email: string;
  active: boolean;
  verified: boolean;
  created_at: string;
}

export default function CityAdmins() {
  const [cities, setCities] = useState<City[]>([]);
  const [invites, setInvites] = useState<CityAdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminCityId, setNewAdminCityId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    const [{ data: cityRows }, { data: inviteRows }] = await Promise.all([
      supabase.from('cities').select('*').order('name'),
      supabase.from('city_admin_invites').select('*').order('created_at', { ascending: false }),
    ]);
    setCities((cityRows ?? []) as City[]);
    setInvites((inviteRows ?? []) as CityAdminInvite[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cityName = (id: string) => cities.find((c) => c.id === id)?.name ?? '—';

  // Grants city-admin access by email alone — no account needs to exist
  // yet. The person signs in themselves at /city-admin-login; verify-login
  // matches this row (active + verified) and promotes it into a real
  // city_admins grant on their first successful sign-in.
  const addInvite = async () => {
    if (!newAdminEmail.trim() || !newAdminCityId) {
      setError('Email and city are both required.');
      return;
    }
    setError(null);
    setCreating(true);
    const { error: insertError } = await supabase.from('city_admin_invites').insert({
      city_id: newAdminCityId,
      email: newAdminEmail.trim().toLowerCase(),
    });
    setCreating(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setToast({ message: `${newAdminEmail.trim()} can now sign in at /city-admin-login with that email.`, type: 'success' });
    setNewAdminEmail('');
    setNewAdminCityId('');
    await load();
  };

  const toggleActive = async (invite: CityAdminInvite) => {
    await supabase.from('city_admin_invites').update({ active: !invite.active }).eq('id', invite.id);
    await load();
  };

  const remove = async (invite: CityAdminInvite) => {
    await supabase.from('city_admin_invites').delete().eq('id', invite.id);
    setToast({ message: 'City admin removed.', type: 'success' });
    await load();
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="City Admins" subtitle="Grant city-admin access by email — no password, no invite link." />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-medium text-sm mb-1">Add a city admin</h2>
        <p className="text-xs text-slate-500 mb-3">
          They sign in themselves at <code>/city-admin-login</code> with just this email — no code or link needed.
        </p>
        <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">City</label>
            <select
              value={newAdminCityId}
              onChange={(e) => setNewAdminCityId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={addInvite}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold whitespace-nowrap"
            >
              {creating ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-medium text-sm mb-3">All city admins</h2>
        {loading ? null : invites.length === 0 ? (
          <EmptyState type="generic" />
        ) : (
          <div className="space-y-2">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{inv.email}</p>
                  <p className="text-xs text-slate-500">{cityName(inv.city_id)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-slate-400">
                    <input type="checkbox" checked={inv.active} onChange={() => toggleActive(inv)} className="accent-blue-500" />
                    Active
                  </label>
                  <button onClick={() => remove(inv)} className="text-slate-500 hover:text-red-400 p-1" aria-label="Remove city admin">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
