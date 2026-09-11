import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Session, User, PasskeyListItem } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { BusinessMembershipWithBusiness } from '../types/domain';

interface AuthContextType {
  /** False until Supabase env vars are configured — see .env.example. */
  configured: boolean;
  /** True while the initial session/membership fetch is in flight. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  memberships: BusinessMembershipWithBusiness[];
  refreshMemberships: () => Promise<void>;
  /** Sends a one-time sign-in code/link to an email that may not have an
   * account yet, creating the account on first use (populating
   * `full_name`). Called by a platform admin approving a signup request
   * (see PlatformAdminDashboard) — signup itself only submits a request,
   * it doesn't call this directly. */
  requestSignupCode: (email: string, fullName: string) => Promise<{ error: string | null }>;
  /** Same one-time code/link, but for an email that must already have an
   * account — used by the login page, so a typo'd or new email gets a
   * clear "no account" error instead of silently creating one. */
  requestLoginCode: (email: string) => Promise<{ error: string | null }>;
  /** Verifies the 6-digit code from either email above. (If the shopper
   * clicks the link in the email instead of typing the code, the session
   * is established automatically when the app reloads — no action needed
   * here for that path.) */
  verifyCode: (email: string, code: string) => Promise<{ error: string | null }>;
  /** Passwordless sign-in with an existing passkey. Triggers the browser's
   * native WebAuthn picker — cross-device sign-in (scan a QR code with your
   * phone) is offered automatically there when available; RepeatlyOS doesn't
   * render that UI itself. Beta Supabase Auth feature — see supabase.ts. */
  signInWithPasskey: () => Promise<{ error: string | null }>;
  /** Adds a passkey to the CURRENTLY signed-in account. Supabase requires an
   * existing confirmed account first — a passkey cannot be a brand new
   * user's first credential. */
  registerPasskey: () => Promise<{ error: string | null }>;
  listPasskeys: () => Promise<{ data: PasskeyListItem[]; error: string | null }>;
  deletePasskey: (passkeyId: string) => Promise<{ error: string | null }>;
  /** Platform-admin-only: list/revoke ANOTHER user's passkeys (e.g. if
   * their device was lost or stolen). Runs through the
   * `admin-manage-passkeys` Edge Function since the client-side passkey
   * API only ever operates on the caller's own account — see that
   * function for why this needs a server-side call at all. */
  adminListPasskeys: (userId: string) => Promise<{ data: PasskeyListItem[]; error: string | null }>;
  adminRevokePasskey: (userId: string, passkeyId: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [memberships, setMemberships] = useState<BusinessMembershipWithBusiness[]>([]);

  const refreshMemberships = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      setMemberships([]);
      return;
    }
    const { data, error } = await supabase
      .from('business_memberships')
      .select('*, business:businesses(*)')
      .eq('user_id', userId)
      .eq('status', 'active');
    if (error) {
      console.error('Failed to load business memberships', error);
      setMemberships([]);
      return;
    }
    setMemberships((data ?? []) as unknown as BusinessMembershipWithBusiness[]);
  }, []);

  useEffect(() => {
    // When Supabase isn't configured, `loading` was already initialized to
    // `false` above (via useState(isSupabaseConfigured)) — nothing to fetch.
    if (!isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await refreshMemberships();
      if (active) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      refreshMemberships();
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [refreshMemberships]);

  const requestSignupCode = async (email: string, fullName: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet. See .env.example.' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };

  const requestLoginCode = async (email: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet. See .env.example.' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    return { error: error?.message ?? null };
  };

  const verifyCode = async (email: string, code: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet. See .env.example.' };
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    return { error: error?.message ?? null };
  };

  const signInWithPasskey = async () => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet. See .env.example.' };
    const { error } = await supabase.auth.signInWithPasskey();
    return { error: error?.message ?? null };
  };

  const registerPasskey = async () => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet. See .env.example.' };
    const { error } = await supabase.auth.registerPasskey();
    return { error: error?.message ?? null };
  };

  const listPasskeys = async () => {
    if (!isSupabaseConfigured) return { data: [], error: 'Supabase is not configured yet. See .env.example.' };
    const { data, error } = await supabase.auth.passkey.list();
    return { data: data ?? [], error: error?.message ?? null };
  };

  const deletePasskey = async (passkeyId: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet. See .env.example.' };
    const { error } = await supabase.auth.passkey.delete({ passkeyId });
    return { error: error?.message ?? null };
  };

  const adminListPasskeys = async (userId: string) => {
    if (!isSupabaseConfigured) return { data: [], error: 'Supabase is not configured yet. See .env.example.' };
    const { data, error } = await supabase.functions.invoke<{ data: PasskeyListItem[] }>('admin-manage-passkeys', {
      body: { action: 'list', userId },
    });
    if (error) return { data: [], error: error.message };
    return { data: data?.data ?? [], error: null };
  };

  const adminRevokePasskey = async (userId: string, passkeyId: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet. See .env.example.' };
    const { error } = await supabase.functions.invoke('admin-manage-passkeys', {
      body: { action: 'delete', userId, passkeyId },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setMemberships([]);
  };

  return (
    <AuthContext.Provider
      value={{
        configured: isSupabaseConfigured,
        loading,
        session,
        user: session?.user ?? null,
        memberships,
        refreshMemberships,
        requestSignupCode,
        requestLoginCode,
        verifyCode,
        signInWithPasskey,
        registerPasskey,
        listPasskeys,
        deletePasskey,
        adminListPasskeys,
        adminRevokePasskey,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
