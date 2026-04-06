import { create } from 'zustand';
import { assertSupabaseConfigured, supabase } from '../supabaseClient';

const initialAuthState = {
  session: null,
  user: null,
  profile: null,
  role: null,
  teamId: null,
  authLoading: true,
  authInitialized: false,
};

const toFriendlyError = (error) => {
  const message = error?.message ?? 'Unexpected error.';

  if (message === 'Failed to fetch') {
    return new Error(
      'Unable to reach Supabase from the browser. Restart npm run dev after editing .env, then confirm the Supabase URL/key are correct and your project is active.',
    );
  }

  return error;
};

export const useStore = create((set, get) => ({
  ...initialAuthState,
  teams: [],
  sports: [],
  lookupsLoading: false,
  hydrateSession: async (session) => {
    if (!session?.user) {
      set({ ...initialAuthState, authLoading: false, authInitialized: true });
      return null;
    }

    set({
      session,
      user: session.user,
      authLoading: true,
      authInitialized: true,
    });

    return get().fetchProfile(session.user.id);
  },
  initializeAuth: async () => {
    try {
      assertSupabaseConfigured();
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        set({ ...initialAuthState, authLoading: false, authInitialized: true });
        throw error;
      }

      await get().hydrateSession(data.session);

      const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
        void get().hydrateSession(nextSession);
      });

      return listener.data.subscription;
    } catch (error) {
      set({ ...initialAuthState, authLoading: false, authInitialized: true });
      throw toFriendlyError(error);
    }
  },
  fetchProfile: async (userId) => {
    try {
      assertSupabaseConfigured();
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, role, team_id, team:teams!admin_users_team_id_fkey(id, name, logo_url, auction_credits)')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        set({ authLoading: false });
        throw error;
      }

      set({
        profile: data ?? null,
        role: data?.role ?? null,
        teamId: data?.team_id ?? null,
        authLoading: false,
      });

      return data;
    } catch (error) {
      set({ authLoading: false });
      throw toFriendlyError(error);
    }
  },
  loadLookups: async () => {
    try {
      assertSupabaseConfigured();
      set({ lookupsLoading: true });

      const [teamsResponse, sportsResponse] = await Promise.all([
        supabase.from('teams').select('id, name, logo_url, auction_credits').order('name'),
        supabase.from('sports').select('id, name, icon').order('name'),
      ]);

      if (teamsResponse.error) {
        set({ lookupsLoading: false });
        throw teamsResponse.error;
      }

      if (sportsResponse.error) {
        set({ lookupsLoading: false });
        throw sportsResponse.error;
      }

      set({
        teams: teamsResponse.data ?? [],
        sports: sportsResponse.data ?? [],
        lookupsLoading: false,
      });
    } catch (error) {
      set({ lookupsLoading: false });
      throw toFriendlyError(error);
    }
  },
  signIn: async (email, password) => {
    try {
      assertSupabaseConfigured();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw error;
      }

      const profile = await get().hydrateSession(data.session);

      return profile?.role ?? null;
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
  signOut: async () => {
    try {
      assertSupabaseConfigured();
      const { error } = await supabase.auth.signOut();

      set({
        ...initialAuthState,
        teams: get().teams,
        sports: get().sports,
        lookupsLoading: false,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      throw toFriendlyError(error);
    }
  },
}));