import { createClient } from '@supabase/supabase-js';

// These environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
}

// Create Supabase client with additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Ensure cookies are used for session storage
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        const found = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${key}=`));
        
        return found ? found.split('=')[1] : null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax; secure`;
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; secure`;
        }
      },
    },
  },
});

// Helper types for Supabase tables
export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type Brief = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: any; // JSONB content
  created_at: string;
  updated_at: string;
}; 