import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'oagronaopara',
    }
  },
  db: {
    schema: 'public'
  }
});

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Clear local storage
    localStorage.removeItem('supabase.auth.token');
  }
});

// Add error handling for failed requests
const originalAuthRequest = supabase.auth.api;
if (originalAuthRequest) {
  supabase.auth.api = new Proxy(originalAuthRequest, {
    get: (target, prop) => {
      const original = target[prop];
      if (typeof original === 'function') {
        return async (...args) => {
          try {
            const result = await original.apply(target, args);
            return result;
          } catch (error) {
            console.error('Supabase auth error:', error);
            throw error;
          }
        };
      }
      return original;
    }
  });
}

export default supabase;