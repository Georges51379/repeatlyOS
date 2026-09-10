import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useEnabledModules } from '../hooks/useEnabledModules';
import { MODULE_KEYS } from '../data/moduleKeys';

export default function ModulesPanel({
  businessId,
  canEdit,
}: {
  businessId: string;
  canEdit: boolean;
}) {
  const { enabled, loading, refresh } = useEnabledModules(businessId);
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = async (key: string) => {
    if (!canEdit || saving) return;
    setSaving(key);
    const nowEnabled = !enabled.has(key);
    const { error } = await supabase
      .from('business_modules')
      .upsert({ business_id: businessId, module_key: key, enabled: nowEnabled }, { onConflict: 'business_id,module_key' });
    setSaving(null);
    if (error) return;
    await refresh();
  };

  if (loading) return <p className="text-xs text-slate-500 py-2">Loading modules…</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {MODULE_KEYS.map((key) => (
        <label
          key={key}
          className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg border ${
            enabled.has(key) ? 'border-blue-500/40 bg-blue-600/10 text-blue-300' : 'border-slate-800 text-slate-500'
          } ${canEdit ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
        >
          <input
            type="checkbox"
            checked={enabled.has(key)}
            onChange={() => toggle(key)}
            disabled={!canEdit || saving === key}
            className="accent-blue-500"
          />
          {key}
        </label>
      ))}
    </div>
  );
}
