import { useEffect, useState } from 'react';
import { Fingerprint, Trash2, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import PageHeader from '../../../components/PageHeader';
import Toast from '../../../components/Toast';
import type { ExchangeRate } from '../../../types/domain';
import type { PasskeyListItem } from '@supabase/supabase-js';

export default function Settings() {
  const { adminListPasskeys, adminRevokePasskey } = useAuth();
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [rateInput, setRateInput] = useState('');
  const [savingRate, setSavingRate] = useState(false);
  const [passkeyEmail, setPasskeyEmail] = useState('');
  const [passkeyUser, setPasskeyUser] = useState<{ id: string; email: string } | null>(null);
  const [managedPasskeys, setManagedPasskeys] = useState<PasskeyListItem[]>([]);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: rateRow } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('base_currency', 'USD')
        .eq('quote_currency', 'LBP')
        .maybeSingle();
      if (rateRow) {
        setExchangeRate(rateRow as ExchangeRate);
        setRateInput(String((rateRow as ExchangeRate).rate));
      }
    })();
  }, []);

  const saveExchangeRate = async () => {
    const rate = Number(rateInput);
    if (!Number.isFinite(rate) || rate <= 0) {
      setError('Enter a valid exchange rate.');
      return;
    }
    setSavingRate(true);
    setError(null);
    if (exchangeRate) {
      await supabase.from('exchange_rates').update({ rate }).eq('id', exchangeRate.id);
    } else {
      const { data } = await supabase
        .from('exchange_rates')
        .insert({ base_currency: 'USD', quote_currency: 'LBP', rate })
        .select()
        .maybeSingle();
      if (data) setExchangeRate(data as ExchangeRate);
    }
    setSavingRate(false);
    setToast({ message: 'Exchange rate saved.', type: 'success' });
  };

  const lookupPasskeyUser = async () => {
    if (!passkeyEmail.trim()) return;
    setError(null);
    setPasskeyUser(null);
    setManagedPasskeys([]);
    const { data: profileRow, error: lookupError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', passkeyEmail.trim())
      .maybeSingle();
    if (lookupError || !profileRow || !profileRow.email) {
      setError('No user found with that email.');
      return;
    }
    setPasskeyBusy(true);
    const { data, error: listError } = await adminListPasskeys(profileRow.id);
    setPasskeyBusy(false);
    if (listError) {
      setError(listError);
      return;
    }
    setPasskeyUser({ id: profileRow.id, email: profileRow.email });
    setManagedPasskeys(data);
  };

  const revokeManagedPasskey = async (passkeyId: string) => {
    if (!passkeyUser) return;
    setPasskeyBusy(true);
    setError(null);
    const { error: revokeError } = await adminRevokePasskey(passkeyUser.id, passkeyId);
    setPasskeyBusy(false);
    if (revokeError) {
      setError(revokeError);
      return;
    }
    setManagedPasskeys((prev) => prev.filter((pk) => pk.id !== passkeyId));
    setToast({ message: 'Passkey revoked.', type: 'success' });
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Platform-wide configuration and account recovery tools." />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-medium text-sm mb-1">USD → LBP exchange rate</h2>
        <p className="text-xs text-slate-500 mb-3">
          Manually set — the real parallel-market rate shoppers/merchants actually use doesn't reliably match any
          single live API. Shown as a second price everywhere the marketplace renders USD.
        </p>
        <div className="flex gap-2 max-w-xs">
          <input
            type="number"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={saveExchangeRate}
            disabled={savingRate}
            className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold"
          >
            {savingRate ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-medium text-sm mb-1">Manage a user's passkeys</h2>
        <p className="text-xs text-slate-500 mb-3">Look someone up by email to revoke a lost or compromised passkey.</p>
        <div className="flex gap-2 mb-3">
          <input
            value={passkeyEmail}
            onChange={(e) => setPasskeyEmail(e.target.value)}
            placeholder="User's email"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={lookupPasskeyUser}
            disabled={passkeyBusy}
            className="px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" /> Look up
          </button>
        </div>
        {passkeyUser && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Passkeys for {passkeyUser.email}:</p>
            {managedPasskeys.length === 0 ? (
              <p className="text-sm text-slate-500 mb-2">No passkeys registered.</p>
            ) : (
              <div className="space-y-2">
                {managedPasskeys.map((pk) => (
                  <div key={pk.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Fingerprint className="w-4 h-4 text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{pk.friendly_name || 'Passkey'}</p>
                        <p className="text-xs text-slate-500">Added {new Date(pk.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => revokeManagedPasskey(pk.id)}
                      disabled={passkeyBusy}
                      className="text-slate-500 hover:text-red-400 disabled:opacity-50 p-1.5"
                      aria-label="Revoke passkey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
