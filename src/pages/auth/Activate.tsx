import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminRoles } from '../../hooks/useAdminRoles';

// The ONE bootstrap path in an otherwise passkey-only app: registering a
// passkey requires an existing session (verified directly against the
// installed @supabase/auth-js source — there is no "create my very first
// credential with zero prior auth" method). A platform admin generates
// the one-time code shown here (PlatformAdminDashboard's "Create city
// admin" and "Approve" actions) and relays it to the person themselves —
// nothing is emailed automatically by RepeatlyOS. This page just verifies
// whatever code they were given; it never sends anything itself.
export default function Activate() {
  const { user, verifyCode, configured } = useAuth();
  const { isPlatformAdmin, cityAdminOf, loading: rolesLoading } = useAdminRoles();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Single redirect path for BOTH ways of getting here (clicking the
  // admin's link, or typing the code by hand): once a session exists, wait
  // for role lookup to resolve, then send a city/platform admin straight
  // to /app (their role is already granted, nothing to onboard) and
  // everyone else — a brand-new business owner — to /onboarding. Fixes a
  // real bug: this used to hardcode /app for both paths, which worked for
  // the "click the link" case (whose generated redirectTo already points
  // at /onboarding when there's no cityId) but sent a business owner who
  // typed the code by hand to /app instead, where they'd see an empty "no
  // businesses yet" screen and need one extra click to find /onboarding.
  useEffect(() => {
    if (!user || rolesLoading) return;
    const next = isPlatformAdmin || cityAdminOf.length > 0 ? '/app' : '/onboarding';
    navigate(`/account/security?next=${next}&mandatory=1`);
  }, [user, rolesLoading, isPlatformAdmin, cityAdminOf, navigate]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: verifyError } = await verifyCode(email, code);
    setSubmitting(false);
    if (verifyError) {
      setError(verifyError);
      return;
    }
    // Redirect happens via the useEffect above once `user` updates —
    // verifyCode() establishes the session through Supabase's own
    // onAuthStateChange, which AuthContext already listens for.
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">RepeatlyOS</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-blue-400" />
            <h1 className="text-white font-semibold text-lg">Activate your account</h1>
          </div>
          <p className="text-slate-500 text-sm mb-5">
            Enter your email and the activation code you were given — you'll set up a passkey right
            after, and use that from then on.
          </p>

          {!configured && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Supabase is not configured yet.
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              placeholder="you@business.com"
            />
            <input
              type="text"
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white tracking-widest text-center focus:outline-none focus:border-blue-500"
              placeholder="Activation code"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !configured}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? 'Verifying…' : 'Verify & continue'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 flex justify-center gap-4">
          <Link to="/login" className="text-xs text-slate-600 hover:text-slate-400">
            ← Back to sign in
          </Link>
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-400">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
