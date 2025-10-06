import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. La autenticación no funcionará.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export default supabase;
