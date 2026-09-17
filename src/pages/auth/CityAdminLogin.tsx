import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Fingerprint } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminRoles } from '../../hooks/useAdminRoles';
import EmailVerifyPanel from '../../components/EmailVerifyPanel';

// City admins don't self-register: a platform admin adds their email
// against a specific city (PlatformAdminDashboard's "City admins" panel,
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Building2 className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">RepeatlyOS City Admin</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
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
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Fingerprint className="w-4 h-4" />
            {passkeySubmitting ? 'Waiting for passkey…' : 'Sign in with a passkey'}
          </button>

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          <EmailVerifyPanel context="city_admin" onDone={(to) => navigate(to)} />
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
