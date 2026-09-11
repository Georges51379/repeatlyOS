import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// The ONE bootstrap path in an otherwise passkey-only app: registering a
// passkey requires an existing session (verified directly against the
// installed @supabase/auth-js source — registerPasskey's underlying
// _startPasskeyRegistration call hard-requires an active session, there is
// no "create my very first credential with zero prior auth" method). So a
// brand-new account, or an existing one with no passkey yet, has no way to
// get its first session except through this one-time emailed code/link —
// deliberately kept separate from /login and /super-admin (which show only
// the passkey button) rather than offered there as a parallel "or sign in
// with email" option, so it reads as "first-time setup," not an ongoing
// alternative login method.
export default function Activate() {
  const { user, requestLoginCode, verifyCode, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Covers clicking the link in the email instead of typing the code —
  // requestLoginCode's emailRedirectTo already points straight at
  // /account/security, but if they land back here first (e.g. the link
  // opened a new tab that already had this page loaded), send them on.
  useEffect(() => {
    if (user) navigate('/account/security?next=/app&mandatory=1');
  }, [user, navigate]);

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
    if (verifyError) {
      setError(verifyError);
      return;
    }
    navigate('/account/security?next=/app&mandatory=1');
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
            First time signing in, or lost access to your passkey? Verify your email once — you'll
            set up a passkey right after, and use that from then on.
          </p>

          {!configured && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Supabase is not configured yet.
            </div>
          )}

          {!codeSent ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="you@business.com"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting || !configured}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {submitting ? 'Sending code…' : 'Send activation code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-xs text-slate-400">
                We sent a code (and a link) to <span className="text-white">{email}</span>. Enter
                the code below, or click the link in the email.
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
                {submitting ? 'Verifying…' : 'Verify & continue'}
              </button>
            </form>
          )}
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
