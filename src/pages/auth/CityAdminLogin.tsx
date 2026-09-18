import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import EmailVerifyPanel from '../../components/EmailVerifyPanel';

// City admins don't self-register: a platform admin adds their email
// against a specific city (the /platform-admin "City Admins" page,
// backed by migration 20260917000001's city_admin_invites), and from then
// on they sign in here — no cityId in the URL, since eligibility (and
// which city) is resolved server-side by email, not guessed from a link.
export default function CityAdminLogin() {
  const { user, signInWithPasskey, configured } = useAuth();
  const { cityAdminOf, loading: rolesLoading } = useAdminRoles();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);

  useEffect(() => {
    if (!user || rolesLoading) return;
    if (cityAdminOf.length === 1) navigate(`/city-admin/${cityAdminOf[0]}`);
    else if (cityAdminOf.length > 1) navigate('/app');
  }, [user, cityAdminOf, rolesLoading, navigate]);

  const handlePasskey = async () => {
    setPasskeySubmitting(true);
    setError(null);
    const { error: passkeyError } = await signInWithPasskey();
    setPasskeySubmitting(false);
    if (passkeyError) setError(passkeyError);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="orb w-96 h-96 bg-blue-600 -top-24 -left-24" />
      <div className="orb w-96 h-96 bg-emerald-600 -bottom-24 -right-24" />

      <div className="w-full max-w-sm relative animate-in">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/25 flex items-center justify-center shadow-glow-blue">
            <Building2 className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-white font-bold text-lg">RepeatlyOS City Admin</span>
        </div>

        <div className="glass border border-slate-800 rounded-2xl p-6 shadow-card">
          <h1 className="text-white font-semibold text-lg mb-1">City admin access</h1>
          <p className="text-slate-500 text-sm mb-5">Manage businesses in your city.</p>

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

          <EmailVerifyPanel context="city_admin" onDone={(to) => navigate(to)} />
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
