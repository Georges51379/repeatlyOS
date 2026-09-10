import { useEffect, useState, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Fingerprint, Trash2, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { PasskeyListItem } from '@supabase/supabase-js';

export default function AccountSecurity() {
  const { user, loading, configured, registerPasskey, listPasskeys, deletePasskey } = useAuth();
  const [passkeys, setPasskeys] = useState<PasskeyListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error: listError } = await listPasskeys();
    setPasskeys(data);
    if (listError) setError(listError);
  }, [listPasskeys]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const handleRegister = async () => {
    setBusy(true);
    setError(null);
    const { error: registerError } = await registerPasskey();
    setBusy(false);
    if (registerError) {
      setError(registerError);
      return;
    }
    await refresh();
  };

  const handleDelete = async (passkeyId: string) => {
    setBusy(true);
    setError(null);
    const { error: deleteError } = await deletePasskey(passkeyId);
    setBusy(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    await refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">RepeatlyOS</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-white font-semibold text-lg mb-1">Passkeys</h1>
          <p className="text-slate-500 text-sm mb-5">
            Add a passkey to sign in with Face ID, Touch ID, Windows Hello, a hardware key, or by
            scanning a QR code with your phone — no password needed.
          </p>

          {!configured && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Supabase is not configured yet — passkeys can't be registered until it is.
            </div>
          )}

          {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

          <div className="space-y-2 mb-5">
            {passkeys.length === 0 && (
              <p className="text-sm text-slate-500">No passkeys registered yet.</p>
            )}
            {passkeys.map((pk) => (
              <div
                key={pk.id}
                className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Fingerprint className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{pk.friendly_name || 'Passkey'}</p>
                    <p className="text-xs text-slate-500">
                      Added {new Date(pk.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(pk.id)}
                  disabled={busy}
                  className="text-slate-500 hover:text-red-400 disabled:opacity-50 p-1.5"
                  aria-label="Remove passkey"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleRegister}
            disabled={busy || !configured}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            <Fingerprint className="w-4 h-4" />
            {busy ? 'Working…' : 'Add a passkey'}
          </button>
        </div>

        <p className="text-center mt-6">
          <Link to="/dashboard" className="text-xs text-slate-600 hover:text-slate-400">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
