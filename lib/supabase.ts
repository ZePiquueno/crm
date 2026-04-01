import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Prevenção contra crash de build se as URLs forem strings vazias
if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Key is missing. This is expected during some build phases but will cause run-time errors.");
}

// Cliente Supabase que será usado pelas API Routes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder'
);
