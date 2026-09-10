import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/** Which modules are enabled for a business — drives both sidebar nav
 * visibility and the Settings toggle panel, so both stay in sync with the
 * same source of truth (the `business_modules` table) rather than each
 * re-fetching independently out of step. */
export function useEnabledModules(businessId: string | undefined) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from('business_modules')
      .select('module_key, enabled')
      .eq('business_id', businessId);
    setEnabled(new Set((data ?? []).filter((m) => m.enabled).map((m) => m.module_key)));
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { enabled, loading, refresh };
}
