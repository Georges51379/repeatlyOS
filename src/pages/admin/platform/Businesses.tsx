import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/PageHeader';
import SearchInput from '../../../components/SearchInput';
import StatusBadge from '../../../components/StatusBadge';
import { SkeletonTable } from '../../../components/Skeletons';
import EmptyState from '../../../components/EmptyState';
import type { Business, BusinessSaasSubscription, SaasPlan } from '../../../types/domain';

export default function Businesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, BusinessSaasSubscription>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [{ data: businessRows }, { data: planRows }, { data: subRows }] = await Promise.all([
      supabase.from('businesses').select('*').order('name'),
      supabase.from('saas_plans').select('*').order('sort_order'),
      supabase.from('business_saas_subscriptions').select('*'),
    ]);
    setBusinesses((businessRows ?? []) as Business[]);
    setPlans((planRows ?? []) as SaasPlan[]);
    const subsByBusiness: Record<string, BusinessSaasSubscription> = {};
    for (const s of (subRows ?? []) as BusinessSaasSubscription[]) subsByBusiness[s.business_id] = s;
    setSubscriptions(subsByBusiness);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter((b) => b.name.toLowerCase().includes(q) || (b.business_type_key ?? '').includes(q));
  }, [businesses, search]);

  const toggleVerified = async (business: Business) => {
    await supabase.from('businesses').update({ verified: !business.verified }).eq('id', business.id);
    await load();
  };

  const toggleVisible = async (business: Business) => {
    await supabase.from('businesses').update({ marketplace_visible: !business.marketplace_visible }).eq('id', business.id);
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

  return (
    <div className="max-w-4xl">
      <PageHeader title="Businesses" subtitle="Every business on the platform — plans, verification, and marketplace visibility." />

      {businesses.length > 0 && (
        <div className="mb-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or type…" className="max-w-sm" />
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-slate-500 text-xs">
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Visible</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Billing</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={4} cols={6} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {businesses.length === 0 ? <EmptyState type="generic" /> : <EmptyState type="generic" search={search} onClear={() => setSearch('')} />}
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const sub = subscriptions[b.id];
                return (
                  <tr key={b.id} className="border-b border-slate-800/60 last:border-0 tr-hover">
                    <td className="px-4 py-3">
                      <p className="text-white truncate max-w-[12rem]">{b.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{b.business_type_key?.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleVerified(b)} className="focus-ring rounded" title="Toggle verified badge">
                        <BadgeCheck className={`w-4 h-4 ${b.verified ? 'text-blue-400' : 'text-slate-700'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={b.marketplace_visible}
                          onChange={() => toggleVisible(b)}
                          className="accent-emerald-500"
                        />
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
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
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
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
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
