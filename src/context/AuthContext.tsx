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
  /** Platform-admin-only: creates (or reactivates) an account and returns
   * a one-time code + link — WITHOUT sending any automated email. The
   * admin relays it to the person themselves however they choose. Runs
   * through the `admin-generate-invite` Edge Function since only the
   * service-role Admin API can generate a credential without also
   * sending it. Optionally grants city_admin for `cityId` in the same
   * call. */
  adminGenerateInvite: (
    email: string,
    fullName: string,
    cityId?: string,
  ) => Promise<{ code: string | null; link: string | null; error: string | null }>;
  /** Verifies the one-time code an admin gave the user out of band (see
   * `adminGenerateInvite`). If they were given the link instead and
   * clicked it, the session is established automatically on page load —
   * no action needed here for that path. */
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

  const adminGenerateInvite = async (email: string, fullName: string, cityId?: string) => {
    if (!isSupabaseConfigured) {
      return { code: null, link: null, error: 'Supabase is not configured yet. See .env.example.' };
    }
    // Business-owner activations land on /onboarding to register their
    // business; city-admin activations land straight on /app, since the
    // role is already granted. Either way it's passkey setup first
    // (`mandatory=1` — skipping would mean the account has no way to ever
    // sign in again, since login is passkey-only).
    const next = cityId ? '/app' : '/onboarding';
    const redirectTo = `${window.location.origin}/account/security?next=${next}&mandatory=1`;
    const { data, error } = await supabase.functions.invoke<{ code: string; link: string }>(
      'admin-generate-invite',
      { body: { email, fullName, cityId, redirectTo } },
    );
    if (error) return { code: null, link: null, error: error.message };
    return { code: data?.code ?? null, link: data?.link ?? null, error: null };
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
        adminGenerateInvite,
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
