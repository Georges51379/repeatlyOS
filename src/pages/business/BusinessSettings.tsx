import { useEffect, useState } from 'react';
import { BadgeCheck, Zap, Eye, EyeOff } from 'lucide-react';
import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import { supabase } from '../../lib/supabase';
import ModulesPanel from '../../components/ModulesPanel';
import PlanPanel from '../../components/PlanPanel';
import type { BusinessAvailabilityStatus } from '../../types/domain';

const AVAILABILITY_OPTIONS: { value: BusinessAvailabilityStatus; label: string }[] = [
  { value: 'normal', label: 'Normal (follow opening hours)' },
  { value: 'closed_power_cut', label: 'Closed — power cut' },
  { value: 'cash_only', label: 'Cash only right now' },
  { value: 'closed_temporary', label: 'Temporarily closed' },
];

export default function BusinessSettings() {
  const { business, membership } = useCurrentBusiness();
  const [availability, setAvailability] = useState<BusinessAvailabilityStatus>('normal');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [inPool, setInPool] = useState(false);
  const [poolLoaded, setPoolLoaded] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [visible, setVisible] = useState(false);
  const [togglingVisible, setTogglingVisible] = useState(false);

  useEffect(() => {
    if (!business) return;
    setAvailability(business.availability_override);
    setAvailabilityNote(business.availability_note ?? '');
    setVisible(business.marketplace_visible);
    supabase
      .from('delivery_pool_members')
      .select('id, active')
      .eq('business_id', business.id)
      .maybeSingle()
      .then(({ data }) => {
        setInPool(Boolean(data?.active));
        setPoolLoaded(true);
      });
  }, [business]);

  if (!business || !membership) return null;

  const saveAvailability = async () => {
    setSavingAvailability(true);
    await supabase
      .from('businesses')
      .update({ availability_override: availability, availability_note: availabilityNote.trim() || null })
      .eq('id', business.id);
    setSavingAvailability(false);
  };

  const toggleVisible = async () => {
    if (business.status !== 'active') return;
    setTogglingVisible(true);
    await supabase.from('businesses').update({ marketplace_visible: !visible }).eq('id', business.id);
    setTogglingVisible(false);
    setVisible(!visible);
  };

  const togglePool = async () => {
    if (inPool) {
      await supabase.from('delivery_pool_members').update({ active: false }).eq('business_id', business.id);
    } else {
      await supabase
        .from('delivery_pool_members')
        .upsert({ business_id: business.id, city_id: business.city_id, active: true }, { onConflict: 'city_id,business_id' });
    }
    setInPool(!inPool);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-white font-semibold text-lg">Settings</h1>
        {business.verified && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
            <BadgeCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm mb-6">{business.name}</p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            {visible ? (
              <Eye className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            )}
            <div>
              <h2 className="text-white font-medium text-sm">Marketplace visibility</h2>
              <p className="text-slate-500 text-xs max-w-sm">
                {business.status !== 'active'
                  ? 'Visible to shoppers automatically once a platform admin approves this business.'
                  : visible
                    ? 'Shoppers can find you on your city page and in search right now.'
                    : "Hidden from your city's marketplace — your dashboard still works normally."}
              </p>
            </div>
          </div>
          <button
            onClick={toggleVisible}
            disabled={business.status !== 'active' || togglingVisible}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              visible ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {togglingVisible ? 'Saving…' : visible ? 'Hide from marketplace' : 'Show in marketplace'}
          </button>
        </div>
      </div>

      <PlanPanel businessId={business.id} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-medium text-sm mb-1">Live availability</h2>
        <p className="text-slate-500 text-xs mb-3">
          Override your regular opening hours for a scheduled power cut, a cash-only moment, or a short closure —
          shown immediately on your storefront and in search.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as BusinessAvailabilityStatus)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={availabilityNote}
            onChange={(e) => setAvailabilityNote(e.target.value)}
            placeholder="Optional note (e.g. 'back by 6pm')"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={saveAvailability}
          disabled={savingAvailability}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-3 py-2 rounded-lg"
        >
          {savingAvailability ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-2 mb-1">
          <Zap className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-white font-medium text-sm">Shared city delivery pool</h2>
            <p className="text-slate-500 text-xs">
              Coordinate delivery capacity with other businesses in your city rather than needing your own courier.
            </p>
          </div>
        </div>
        {poolLoaded && (
          <label className="flex items-center gap-2 text-sm text-slate-300 mt-3">
            <input type="checkbox" checked={inPool} onChange={togglePool} className="accent-emerald-500" />
            Join the shared delivery pool for this city
          </label>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-medium text-sm mb-1">Modules</h2>
        <p className="text-slate-500 text-xs mb-4">
          {membership.role === 'owner'
            ? 'Enable or disable features for this business.'
            : 'Only the business owner can change these.'}
        </p>
        <ModulesPanel businessId={business.id} canEdit={membership.role === 'owner'} />
      </div>
    </div>
  );
}
