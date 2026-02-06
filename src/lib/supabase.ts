
import { createClient } from '@supabase/supabase-js';

// These should be in your .env file
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing. Cloud sync will be disabled.');
}

export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export type DatabaseMatch = {
    id: string;
    data: any; // Storing the full JSON blob of the match
    updated_at: string;
};
