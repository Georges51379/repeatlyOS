import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Check, X, Plus, Fingerprint, Trash2, BadgeCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import type {
  Business,
  BusinessSaasSubscription,
  City,
  SaasPlan,
  SignupRequest,
  ExchangeRate,
} from '../../types/domain';
import type { PasskeyListItem } from '@supabase/supabase-js';

interface CityAdminInvite {
  id: string;
  city_id: string;
  email: string;
  active: boolean;
  verified: boolean;
  created_at: string;
}

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
  const { adminListPasskeys, adminRevokePasskey } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [pending, setPending] = useState<Business[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, BusinessSaasSubscription>>({});
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [cityAdminInvites, setCityAdminInvites] = useState<CityAdminInvite[]>([]);
  const [newCityName, setNewCityName] = useState('');
  const [newCitySlug, setNewCitySlug] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminCityId, setNewAdminCityId] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [passkeyEmail, setPasskeyEmail] = useState('');
  const [passkeyUser, setPasskeyUser] = useState<{ id: string; email: string } | null>(null);
  const [managedPasskeys, setManagedPasskeys] = useState<PasskeyListItem[]>([]);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [rateInput, setRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);

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

    const { data: businessRows } = await supabase.from('businesses').select('*').order('name');
    setAllBusinesses((businessRows ?? []) as Business[]);

    const { data: planRows } = await supabase.from('saas_plans').select('*').order('sort_order');
    setPlans((planRows ?? []) as SaasPlan[]);

    const { data: subRows } = await supabase.from('business_saas_subscriptions').select('*');
    const subsByBusiness: Record<string, BusinessSaasSubscription> = {};
    for (const s of (subRows ?? []) as BusinessSaasSubscription[]) {
      subsByBusiness[s.business_id] = s;
    }
    setSubscriptions(subsByBusiness);

    const { data: requestRows } = await supabase
      .from('signup_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setSignupRequests((requestRows ?? []) as SignupRequest[]);

    const { data: inviteRows } = await supabase
      .from('city_admin_invites')
      .select('*')
      .order('created_at', { ascending: false });
    setCityAdminInvites((inviteRows ?? []) as CityAdminInvite[]);

    const { data: rateRow } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('base_currency', 'USD')
      .eq('quote_currency', 'LBP')
      .maybeSingle();
    if (rateRow) {
      setExchangeRate(rateRow as ExchangeRate);
      setRateInput(String((rateRow as ExchangeRate).rate));
    }
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

  const changePlan = async (businessId: string, planKey: string) => {
    await supabase.from('business_saas_subscriptions').update({ plan_key: planKey }).eq('business_id', businessId);
    await load();
  };

  const changeSubscriptionStatus = async (businessId: string, status: string) => {
    await supabase.from('business_saas_subscriptions').update({ status }).eq('business_id', businessId);
    await load();
  };

  const toggleVerified = async (business: Business) => {
    await supabase.from('businesses').update({ verified: !business.verified }).eq('id', business.id);
    await load();
  };

  const saveExchangeRate = async () => {
    const rate = Number(rateInput);
    if (!Number.isFinite(rate) || rate <= 0) {
      setError('Enter a valid exchange rate.');
      return;
    }
    setSavingRate(true);
    setError(null);
    if (exchangeRate) {
      await supabase.from('exchange_rates').update({ rate }).eq('id', exchangeRate.id);
    } else {
      await supabase.from('exchange_rates').insert({ base_currency: 'USD', quote_currency: 'LBP', rate });
    }
    setSavingRate(false);
    await load();
  };

  // No account is created and nothing is generated here anymore
  // (2026-09-17 rework) — approval just flips the status. The applicant
  // signs in themselves later at /app with the same email; verify-login
  // checks for exactly this 'approved' status.
  const approveSignup = async (request: SignupRequest) => {
    setError(null);
    setNotice(null);
    await supabase
      .from('signup_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', request.id);
    setNotice(`Approved — ${request.email} can now sign in at /app with that email.`);
    await load();
  };

  const rejectSignup = async (request: SignupRequest) => {
    await supabase
      .from('signup_requests')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', request.id);
    await load();
  };

  // Grants city-admin access by email alone — no account needs to exist
  // yet. The person signs in themselves at /city-admin-login; verify-login
  // matches this row (active + verified, both true by default here since
  // only a platform admin can create one at all) and promotes it into a
  // real city_admins grant on their first successful sign-in.
  const addCityAdminInvite = async () => {
    if (!newAdminEmail.trim() || !newAdminCityId) {
      setError('Email and city are both required.');
      return;
    }
    setError(null);
    setNotice(null);
    setCreatingAdmin(true);
    const { error: insertError } = await supabase.from('city_admin_invites').insert({
      city_id: newAdminCityId,
      email: newAdminEmail.trim().toLowerCase(),
    });
    setCreatingAdmin(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setNotice(`${newAdminEmail.trim()} can now sign in at /city-admin-login with that email.`);
    setNewAdminEmail('');
    setNewAdminCityId('');
    await load();
  };

  const toggleCityAdminInviteActive = async (invite: CityAdminInvite) => {
    await supabase.from('city_admin_invites').update({ active: !invite.active }).eq('id', invite.id);
    await load();
  };

  const removeCityAdminInvite = async (invite: CityAdminInvite) => {
    await supabase.from('city_admin_invites').delete().eq('id', invite.id);
    await load();
  };

  const lookupPasskeyUser = async () => {
    if (!passkeyEmail.trim()) return;
    setError(null);
    setPasskeyUser(null);
    setManagedPasskeys([]);
    const { data: profileRow, error: lookupError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', passkeyEmail.trim())
      .maybeSingle();
    if (lookupError || !profileRow || !profileRow.email) {
      setError('No user found with that email.');
      return;
    }
    setPasskeyBusy(true);
    const { data, error: listError } = await adminListPasskeys(profileRow.id);
    setPasskeyBusy(false);
    if (listError) {
      setError(listError);
      return;
    }
    setPasskeyUser({ id: profileRow.id, email: profileRow.email });
    setManagedPasskeys(data);
  };

  const revokeManagedPasskey = async (passkeyId: string) => {
    if (!passkeyUser) return;
    setPasskeyBusy(true);
    setError(null);
    const { error: revokeError } = await adminRevokePasskey(passkeyUser.id, passkeyId);
    setPasskeyBusy(false);
    if (revokeError) {
      setError(revokeError);
      return;
    }
    setManagedPasskeys((prev) => prev.filter((pk) => pk.id !== passkeyId));
  };

  const cityName = (id: string) => cities.find((c) => c.id === id)?.name ?? '—';

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
          MRR/churn aren't shown here — there's no payment gateway, so a plan is assigned manually below rather
          than through real billing history. Showing a computed "revenue" number without real transactions behind
          it would be misleading.
        </p>

        {notice && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-emerald-300">{notice}</p>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-3">Pending signup requests</h2>
          {signupRequests.length === 0 ? (
            <p className="text-slate-500 text-sm">Nothing pending.</p>
          ) : (
            <div className="space-y-2">
              {signupRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-white text-sm">{r.full_name}</p>
                    <p className="text-xs text-slate-500">{r.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveSignup(r)}
                      className="p-1.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                      title="Approve — they'll sign in themselves at /app with this email"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rejectSignup(r)}
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

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-1">USD → LBP exchange rate</h2>
          <p className="text-xs text-slate-500 mb-3">
            Manually set — the real parallel-market rate shoppers/merchants actually use doesn't reliably match any
            single live API. Shown as a second price everywhere the marketplace renders USD.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={saveExchangeRate}
              disabled={savingRate}
              className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold"
            >
              {savingRate ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-3">Businesses &amp; plans</h2>
          {allBusinesses.length === 0 ? (
            <p className="text-slate-500 text-sm">No businesses yet.</p>
          ) : (
            <div className="space-y-2">
              {allBusinesses.map((b) => {
                const sub = subscriptions[b.id];
                return (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.status}</p>
                    </div>
                    {sub && (
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-xs text-blue-400" title="Verified badge — an explicit trust signal beyond listing approval">
                          <input type="checkbox" checked={b.verified} onChange={() => toggleVerified(b)} className="accent-blue-500" />
                          <BadgeCheck className="w-3.5 h-3.5" />
                        </label>
                        <select
                          value={sub.plan_key}
                          onChange={(e) => changePlan(b.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          {plans.map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={sub.status}
                          onChange={(e) => changeSubscriptionStatus(b.id, e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          {['trialing', 'active', 'past_due', 'canceled'].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-medium text-sm mb-1">City admins</h2>
          <p className="text-xs text-slate-500 mb-3">
            City admins never self-register — add their email here and they sign in themselves at{' '}
            <code>/city-admin-login</code> with just that email, no code or link needed.
          </p>
          {cityAdminInvites.length > 0 && (
            <div className="space-y-2 mb-4">
              {cityAdminInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-slate-500">{cityName(inv.city_id)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        checked={inv.active}
                        onChange={() => toggleCityAdminInviteActive(inv)}
                        className="accent-blue-500"
                      />
                      Active
                    </label>
                    <button onClick={() => removeCityAdminInvite(inv)} className="text-slate-500 hover:text-red-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <select
              value={newAdminCityId}
              onChange={(e) => setNewAdminCityId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">City…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={addCityAdminInvite}
              disabled={creatingAdmin}
              className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold py-2 whitespace-nowrap"
            >
              {creatingAdmin ? 'Adding…' : 'Add'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-medium text-sm mb-3">Manage a user's passkeys</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={passkeyEmail}
              onChange={(e) => setPasskeyEmail(e.target.value)}
              placeholder="User's email"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={lookupPasskeyUser}
              disabled={passkeyBusy}
              className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold"
            >
              Look up
            </button>
          </div>
          {passkeyUser && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Passkeys for {passkeyUser.email}:</p>
              {managedPasskeys.length === 0 ? (
                <p className="text-sm text-slate-500 mb-2">No passkeys registered.</p>
              ) : (
                <div className="space-y-2">
                  {managedPasskeys.map((pk) => (
                    <div key={pk.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Fingerprint className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{pk.friendly_name || 'Passkey'}</p>
                          <p className="text-xs text-slate-500">Added {new Date(pk.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => revokeManagedPasskey(pk.id)}
                        disabled={passkeyBusy}
                        className="text-slate-500 hover:text-red-400 disabled:opacity-50 p-1.5"
                        aria-label="Revoke passkey"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
