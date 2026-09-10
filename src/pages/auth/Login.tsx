import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { signIn, signInWithPasskey, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate('/dashboard');
  };

  const handlePasskey = async () => {
    setPasskeySubmitting(true);
    setError(null);
    // Opens the browser's native passkey picker — on most platforms this
    // includes a "use another device" option that shows a QR code for
    // scanning with a phone. RepeatlyOS doesn't render that UI itself; the
    // browser does, as standard WebAuthn behavior.
    const { error: passkeyError } = await signInWithPasskey();
    setPasskeySubmitting(false);
    if (passkeyError) {
      setError(passkeyError);
      return;
    }
    navigate('/dashboard');
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
              Supabase is not configured yet. Copy <code>.env.example</code> to{' '}
              <code>.env</code> and set your project URL/anon key before signing in works.
            </div>
          )}

          <button
            type="button"
            onClick={handlePasskey}
            disabled={passkeySubmitting || !configured}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mb-4"
          >
            <Fingerprint className="w-4 h-4" />
            {passkeySubmitting ? 'Waiting for passkey…' : 'Sign in with a passkey'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] uppercase tracking-wide text-slate-600">or with email</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="you@business.com"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !configured}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-5 text-center">
            No account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300">
              Create one
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
