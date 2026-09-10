import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/** Self-check, not the security boundary: RLS decides what a platform/city
 * admin can actually do regardless of what this hook reports. `platform_admins`
 * can only be read by an existing platform admin (its own RLS policy), so an
 * empty result here is indistinguishable from "not an admin" by design —
 * which is exactly the correct self-check behavior. */
export function useAdminRoles() {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [cityAdminOf, setCityAdminOf] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsPlatformAdmin(false);
      setCityAdminOf([]);
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: platformRows }, { data: cityRows }] = await Promise.all([
        supabase.from('platform_admins').select('user_id').eq('user_id', user.id),
        supabase.from('city_admins').select('city_id').eq('user_id', user.id),
      ]);
      setIsPlatformAdmin((platformRows ?? []).length > 0);
      setCityAdminOf((cityRows ?? []).map((r) => r.city_id));
      setLoading(false);
    })();
  }, [user]);

  return { isPlatformAdmin, cityAdminOf, loading };
}
