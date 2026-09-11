import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminRoles } from '../../hooks/useAdminRoles';

// A separate entry point from the regular business/city-admin /login, per
// the user's explicit request — same underlying auth (passkey or emailed
// code), just its own page rather than shared with everyone else. The
// actual authorization boundary is still the platform_admins grant (RLS),
// not this page's existence — reaching this URL grants nothing by itself.
export default function SuperAdminLogin() {
  const { user, requestLoginCode, verifyCode, signInWithPasskey, signOut, configured } = useAuth();
  const { isPlatformAdmin, loading: rolesLoading } = useAdminRoles();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: sendError } = await requestLoginCode(email);
    setSubmitting(false);
    if (sendError) {
      setError(sendError);
      return;
    }
    setCodeSent(true);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: verifyError } = await verifyCode(email, code);
    setSubmitting(false);
    if (verifyError) setError(verifyError);
  };

  const notAdmin = user && !rolesLoading && !isPlatformAdmin;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">RepeatlyOS Super Admin</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          {notAdmin ? (
            <>
              <h1 className="text-white font-semibold text-lg mb-1">Not a platform admin</h1>
              <p className="text-slate-500 text-sm mb-5">
                {user?.email} is signed in, but doesn't hold platform-admin access.
              </p>
              <button
                onClick={() => signOut()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
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
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mb-4"
              >
                <Fingerprint className="w-4 h-4" />
                {passkeySubmitting ? 'Waiting for passkey…' : 'Sign in with a passkey'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] uppercase tracking-wide text-slate-600">or with email</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {!codeSent ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    placeholder="admin email"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting || !configured}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {submitting ? 'Sending code…' : 'Send sign-in code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Code sent to <span className="text-white">{email}</span>.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white tracking-widest text-center focus:outline-none focus:border-blue-500"
                    placeholder="123456"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {submitting ? 'Verifying…' : 'Verify & sign in'}
                  </button>
                </form>
              )}
            </>
          )}
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
