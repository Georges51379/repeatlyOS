import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, ChevronDown, ChevronUp, LogOut, ShieldCheck, LayoutDashboard, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import ModulesPanel from '../../components/ModulesPanel';
import EmailVerifyPanel from '../../components/EmailVerifyPanel';
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

// /app is the business-owner login page AND the dashboard-list page,
// depending on whether a session exists — deliberately not gated by
// RequireAuth (see App.tsx) so a signed-out visitor typing this URL lands
// on a real sign-in form here instead of bouncing through a separate
// /login. See EmailVerifyPanel for the email+Verify+passkey mechanic
// (2026-09-17 rework, replacing the old code/link activation flow).
function SignedOutView() {
  const { signInWithPasskey, configured } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);

  const handlePasskey = async () => {
    setPasskeySubmitting(true);
    setError(null);
    const { error: passkeyError } = await signInWithPasskey();
    setPasskeySubmitting(false);
    if (passkeyError) {
      setError(passkeyError);
      return;
    }
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">RepeatlyOS</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-white font-semibold text-lg mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm mb-5">Access your business dashboard</p>

          {!configured && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Supabase is not configured yet.
            </div>
          )}

          <button
            type="button"
            onClick={handlePasskey}
            disabled={passkeySubmitting || !configured}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Fingerprint className="w-4 h-4" />
            {passkeySubmitting ? 'Waiting for passkey…' : 'Sign in with a passkey'}
          </button>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <EmailVerifyPanel context="business_owner" onDone={(to) => navigate(to)} />

          <p className="text-xs text-slate-500 mt-5 text-center">
            No account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300">
              Register your business
            </Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-400">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

function SignedInView() {
  const { user, memberships, signOut } = useAuth();
  const { isPlatformAdmin, cityAdminOf } = useAdminRoles();
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

        {(isPlatformAdmin || cityAdminOf.length > 0) && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-wrap items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            {isPlatformAdmin && (
              <Link to="/platform-admin" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                Platform Admin dashboard
              </Link>
            )}
            {cityAdminOf.map((cityId) => (
              <Link
                key={cityId}
                to={`/city-admin/${cityId}`}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                City Admin dashboard
              </Link>
            ))}
          </div>
        )}

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

                <div className="mt-3 flex items-center gap-3">
                  <Link
                    to={`/app/${m.business_id}/customers`}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" /> Open dashboard
                  </Link>
                </div>

                {expanded === m.business_id && (
                  <div className="mt-2 border-t border-slate-800">
                    <p className="text-xs text-slate-400 pt-3 pb-2">Modules</p>
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

export default function AppHome() {
  const { user, loading } = useAuth();

  if (loading) return null;
  return user ? <SignedInView /> : <SignedOutView />;
}
