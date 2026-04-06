import { createClient } from '@supabase/supabase-js';

const normalizeEnv = (value) => value?.trim().replace(/^['"]|['"]$/g, '') ?? '';

const supabaseUrl = normalizeEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

const hasPlaceholderValue = (value) => !value || value.includes('placeholder') || value.includes('your_supabase');
const hasValidSupabaseUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl);

export const supabaseConfigError = (() => {
  if (hasPlaceholderValue(supabaseUrl) || hasPlaceholderValue(supabaseAnonKey)) {
    return 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart npm run dev.';
  }

  if (!hasValidSupabaseUrl) {
    return 'VITE_SUPABASE_URL is invalid. It should look like https://your-project-ref.supabase.co.';
  }

  return '';
})();

if (supabaseConfigError) {
  console.warn(supabaseConfigError);
}

export const assertSupabaseConfigured = () => {
  if (supabaseConfigError) {
    throw new Error(supabaseConfigError);
  }
};

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});