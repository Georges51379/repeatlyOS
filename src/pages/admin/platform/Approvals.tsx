import { useCallback, useEffect, useState } from 'react';
import { Check, X, UserCheck, Store } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import PageHeader from '../../../components/PageHeader';
import Toast from '../../../components/Toast';
import EmptyState from '../../../components/EmptyState';
import type { Business, SignupRequest } from '../../../types/domain';

export default function Approvals() {
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    const [{ data: requestRows }, { data: pendingRows }] = await Promise.all([
      supabase.from('signup_requests').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('businesses').select('*').eq('status', 'pending_approval').order('created_at', { ascending: true }),
    ]);
    setSignupRequests((requestRows ?? []) as SignupRequest[]);
    setPendingBusinesses((pendingRows ?? []) as Business[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // No account is created and nothing is generated here (2026-09-17 rework)
  // — approval just flips the status. The applicant signs in themselves
  // later at /app with the same email; verify-login checks for exactly
  // this 'approved' status.
  const approveSignup = async (request: SignupRequest) => {
    await supabase.from('signup_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', request.id);
    setToast({ message: `Approved — ${request.email} can now sign in at /app.`, type: 'success' });
    await load();
  };

  const rejectSignup = async (request: SignupRequest) => {
    await supabase.from('signup_requests').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', request.id);
    setToast({ message: 'Signup request rejected.', type: 'success' });
    await load();
  };

  // Approving must ALSO turn on marketplace_visible — separate flags, but
  // "Approve" here means "let shoppers see this in its city," and leaving
  // marketplace_visible at its default false meant an approved business
  // silently never appeared anywhere public. Found live (2026-09-18).
  const setBusinessStatus = async (id: string, status: 'active' | 'rejected') => {
    const payload = status === 'active' ? { status, marketplace_visible: true } : { status };
    await supabase.from('businesses').update(payload).eq('id', id);
    setToast({ message: status === 'active' ? 'Business approved and now visible in its city.' : 'Business rejected.', type: 'success' });
    await load();
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Approvals" subtitle="Review new signups and business listings before they go live." />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="w-4 h-4 text-blue-400" />
          <h2 className="text-white font-medium text-sm">Signup requests</h2>
          {signupRequests.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{signupRequests.length}</span>
          )}
        </div>
        {!loading && signupRequests.length === 0 ? (
          <EmptyState type="generic" />
        ) : (
          <div className="space-y-2">
            {signupRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-white text-sm">{r.full_name}</p>
                  <p className="text-xs text-slate-500">{r.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveSignup(r)}
                    className="p-1.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                    title="Approve — they'll sign in themselves at /app with this email"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => rejectSignup(r)} className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-4 h-4 text-purple-400" />
          <h2 className="text-white font-medium text-sm">Business listings</h2>
          {pendingBusinesses.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{pendingBusinesses.length}</span>
          )}
        </div>
        {!loading && pendingBusinesses.length === 0 ? (
          <EmptyState type="generic" />
        ) : (
          <div className="space-y-2">
            {pendingBusinesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-white text-sm">{b.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{b.business_type_key?.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBusinessStatus(b.id, 'active')}
                    className="p-1.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                    title="Approve — makes it visible in its city marketplace"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBusinessStatus(b.id, 'rejected')}
                    className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
