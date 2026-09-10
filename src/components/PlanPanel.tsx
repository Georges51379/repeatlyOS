import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { BusinessSaasSubscription, SaasPlan } from '../types/domain';

const STATUS_LABEL: Record<string, string> = {
  trialing: 'Trialing',
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Canceled',
};

export default function PlanPanel({ businessId }: { businessId: string }) {
  const [subscription, setSubscription] = useState<BusinessSaasSubscription | null>(null);
  const [plan, setPlan] = useState<SaasPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sub } = await supabase
        .from('business_saas_subscriptions')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();
      setSubscription((sub ?? null) as BusinessSaasSubscription | null);

      if (sub) {
        const { data: planRow } = await supabase
          .from('saas_plans')
          .select('*')
          .eq('key', (sub as BusinessSaasSubscription).plan_key)
          .maybeSingle();
        setPlan((planRow ?? null) as SaasPlan | null);
      }
      setLoading(false);
    })();
  }, [businessId]);

  if (loading) return null;
  if (!subscription || !plan) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-medium text-sm">Plan</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">
          {STATUS_LABEL[subscription.status] ?? subscription.status}
        </span>
      </div>
      <p className="text-slate-300 text-sm mb-1">
        {plan.name} {plan.price_monthly_usd > 0 ? `— $${plan.price_monthly_usd}/mo` : '— Free'}
      </p>
      <p className="text-xs text-slate-500 mb-3">
        Includes: {plan.included_modules.join(', ')}
        {plan.max_branches !== null ? ` · up to ${plan.max_branches} branch${plan.max_branches === 1 ? '' : 'es'}` : ' · unlimited branches'}
      </p>
      <p className="text-xs text-slate-600">
        To change plans, contact RepeatlyOS support — there's no self-serve billing yet.
      </p>
    </div>
  );
}
