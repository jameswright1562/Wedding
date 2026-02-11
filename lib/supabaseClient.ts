import { createClient } from "@supabase/supabase-js";

// Allow tests to run without real credentials by falling back to placeholders.
const fallbackUrl =
  process.env.NODE_ENV === "test" ? "http://localhost:54321" : undefined;
const fallbackKey =
  process.env.NODE_ENV === "test"
    ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    : undefined;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fallbackKey;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseClient = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
