import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronDown, ChevronUp, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MODULE_KEYS } from '../../data/moduleKeys';
import type { BusinessStatus } from '../../types/domain';

const STATUS_STYLES: Record<BusinessStatus, string> = {
  draft: 'bg-slate-700/40 text-slate-300',
  pending_approval: 'bg-amber-500/15 text-amber-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  suspended: 'bg-red-500/15 text-red-400',
  rejected: 'bg-red-500/15 text-red-400',
  archived: 'bg-slate-700/40 text-slate-400',
};

const STATUS_LABEL: Record<BusinessStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  active: 'Active',
  suspended: 'Suspended',
  rejected: 'Rejected',
  archived: 'Archived',
};

function ModulesPanel({ businessId, canEdit }: { businessId: string; canEdit: boolean }) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('business_modules')
        .select('module_key, enabled')
        .eq('business_id', businessId);
      setEnabled(new Set((data ?? []).filter((m) => m.enabled).map((m) => m.module_key)));
      setLoading(false);
    })();
  }, [businessId]);

  const toggle = async (key: string) => {
    if (!canEdit || saving) return;
    setSaving(key);
    const nowEnabled = !enabled.has(key);
    const { error } = await supabase
      .from('business_modules')
      .upsert(
        { business_id: businessId, module_key: key, enabled: nowEnabled },
        { onConflict: 'business_id,module_key' },
      );
    setSaving(null);
    if (error) return;
    setEnabled((prev) => {
      const next = new Set(prev);
      if (nowEnabled) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  if (loading) return <p className="text-xs text-slate-500 py-2">Loading modules…</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
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

export default function AppHome() {
  const { user, memberships, signOut } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            <span className="text-white font-bold text-lg">RepeatlyOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/account/security" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Security
            </Link>
            <button
              onClick={signOut}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6">Signed in as {user?.email}</p>

        {memberships.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <h1 className="text-white font-semibold text-lg mb-2">No businesses yet</h1>
            <p className="text-slate-500 text-sm mb-5">
              Register your business to start using RepeatlyOS.
            </p>
            <Link
              to="/onboarding"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Register a business
            </Link>
          </div>
        )}

        {memberships.length > 0 && (
          <div className="space-y-3">
            {memberships.map((m) => (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-white font-semibold">{m.business.name}</h2>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[m.business.status]}`}
                      >
                        {STATUS_LABEL[m.business.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {m.business.business_type_key ?? 'Business'} · You are {m.role}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === m.business_id ? null : m.business_id)}
                    className="text-slate-500 hover:text-slate-300 shrink-0"
                  >
                    {expanded === m.business_id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {m.business.status === 'pending_approval' && (
                  <p className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                    Your business is awaiting platform approval before it's fully active.
                  </p>
                )}
                {m.business.status === 'suspended' && (
                  <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                    This business has been suspended.
                  </p>
                )}

                {expanded === m.business_id && (
                  <div className="mt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-400 pt-3">Modules</p>
                    <ModulesPanel businessId={m.business_id} canEdit={m.role === 'owner'} />
                  </div>
                )}
              </div>
            ))}

            <Link
              to="/onboarding"
              className="block text-center text-sm text-blue-400 hover:text-blue-300 border border-dashed border-slate-800 hover:border-slate-700 rounded-xl py-3 transition-colors"
            >
              + Register another business
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
