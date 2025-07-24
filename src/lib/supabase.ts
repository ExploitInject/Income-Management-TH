import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const hasValidConfig = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  isValidUrl(supabaseUrl);

if (!hasValidConfig) {
  console.warn('Supabase configuration is missing or invalid. Please set up your Supabase credentials.');
}

// Use dummy values if configuration is missing to prevent crashes
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  hasValidConfig ? supabaseUrl : fallbackUrl,
  hasValidConfig ? supabaseAnonKey : fallbackKey
);

export const isSupabaseConfigured = hasValidConfig;

// Database type definitions that match the exact schema
export type Database = {
  public: {
    Tables: {
      work_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          category: string;
          description: string;
          amount: number;
          currency: string;
          payment_status: 'paid' | 'unpaid';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          category: string;
          description: string;
          amount: number;
          currency: string;
          payment_status?: 'paid' | 'unpaid';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          category?: string;
          description?: string;
          amount?: number;
          currency?: string;
          payment_status?: 'paid' | 'unpaid';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};