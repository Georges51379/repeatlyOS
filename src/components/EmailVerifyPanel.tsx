import { useState } from 'react';
import { Fingerprint, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  context: 'platform_admin' | 'city_admin' | 'business_owner';
  /** Called once a session exists AND a passkey has just been registered
   * for it — the caller decides where to navigate. */
  onDone: (redirectTo: string) => void;
}

/** The "first time, or lost your passkey" half of every login page —
 * type an email, click Verify, and (if eligible) register a passkey right
 * here, no code or link ever shown. Shared by SuperAdminLogin,
 * CityAdminLogin, and AppHome's signed-out state so the mechanic and its
 * states/errors stay in exactly one place. The "sign in with an existing
 * passkey" button on each of those pages is deliberately NOT part of this
 * component — that path doesn't need an email or eligibility check at all
 * (a passkey can only exist for an account that was already authorized to
 * register one), and what happens right after differs slightly per page. */
export default function EmailVerifyPanel({ context, onDone }: Props) {
  const { verifyAndAuthorize, registerPasskey } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'verified'>('email');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setVerifying(true);
    setError(null);
    const { redirectTo: to, error: verifyError } = await verifyAndAuthorize(email.trim(), context);
    setVerifying(false);
    if (verifyError || !to) {
      setError(verifyError ?? 'Could not verify this email.');
      return;
    }
    setRedirectTo(to);
    setStep('verified');
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    const { error: registerError } = await registerPasskey();
    setRegistering(false);
    if (registerError) {
      setError(registerError);
      return;
    }
    onDone(redirectTo ?? '/app');
  };

  if (step === 'verified') {
    return (
      <div className="mt-5 pt-5 border-t border-slate-800">
        <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 mb-3">
          Verified — set up a passkey to finish signing in.
        </p>
        <button
          onClick={handleRegister}
          disabled={registering}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          <Fingerprint className="w-4 h-4" />
          {registering ? 'Registering…' : 'Register your passkey'}
        </button>
        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="mt-5 pt-5 border-t border-slate-800">
      <p className="text-xs text-slate-500 mb-3">First time, or lost your passkey? Enter your email.</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={verifying || !email.trim()}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          {verifying ? 'Verifying…' : 'Verify'}
          {!verifying && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
    </form>
  );
}
