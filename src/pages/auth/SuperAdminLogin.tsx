import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import EmailVerifyPanel from '../../components/EmailVerifyPanel';

// A separate entry point from the regular business/city-admin login, per
// the user's explicit request — same underlying auth (passkey only), just
// its own page rather than shared with everyone else. The actual
// authorization boundary is still the platform_admins grant (RLS), not
// this page's existence — reaching this URL grants nothing by itself.
//
// Two independent ways in, same as every login page in the app now
// (2026-09-17 rework — replaces the old code/link activation flow):
//   1. "Sign in with a passkey" — for a device that already has one.
//   2. Email + Verify (EmailVerifyPanel) — for first time, or a lost
//      passkey; only proceeds if this email actually holds a
//      platform_admins grant (checked server-side by verify-login).
export default function SuperAdminLogin() {
  const { user, signInWithPasskey, signOut, configured } = useAuth();
  const { isPlatformAdmin, loading: rolesLoading } = useAdminRoles();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);

  useEffect(() => {
    if (!user || rolesLoading) return;
    if (isPlatformAdmin) navigate('/platform-admin');
  }, [user, isPlatformAdmin, rolesLoading, navigate]);

  const handlePasskey = async () => {
    setPasskeySubmitting(true);
    setError(null);
    const { error: passkeyError } = await signInWithPasskey();
    setPasskeySubmitting(false);
    if (passkeyError) setError(passkeyError);
    // On success, the useEffect above redirects once isPlatformAdmin resolves.
  };

  const notAdmin = user && !rolesLoading && !isPlatformAdmin;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="orb w-96 h-96 bg-blue-600 -top-24 -left-24" />
      <div className="orb w-96 h-96 bg-indigo-600 -bottom-24 -right-24" />

      <div className="w-full max-w-sm relative animate-in">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/25 flex items-center justify-center shadow-glow-blue">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-white font-bold text-lg">RepeatlyOS Super Admin</span>
        </div>

        <div className="glass border border-slate-800 rounded-2xl p-6 shadow-card">
          {notAdmin ? (
            <>
              <h1 className="text-white font-semibold text-lg mb-1">Not a platform admin</h1>
              <p className="text-slate-500 text-sm mb-5">
                {user?.email} is signed in, but doesn't hold platform-admin access.
              </p>
              <button
                onClick={() => signOut()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors press focus-ring"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <h1 className="text-white font-semibold text-lg mb-1">Super admin access</h1>
              <p className="text-slate-500 text-sm mb-5">Platform administration only.</p>

              {!configured && (
                <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  Supabase is not configured yet.
                </div>
              )}

              <button
                type="button"
                onClick={handlePasskey}
                disabled={passkeySubmitting || !configured}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-all press focus-ring shadow-glow-blue"
              >
                <Fingerprint className="w-4 h-4" />
                {passkeySubmitting ? 'Waiting for passkey…' : 'Sign in with a passkey'}
              </button>

              {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

              <EmailVerifyPanel context="platform_admin" onDone={(to) => navigate(to)} />
            </>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-400 link-underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
