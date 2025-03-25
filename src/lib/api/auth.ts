import { supabase } from '@/lib/supabase';
export { signUp } from './auth/signup';

// Auth-related functions are now organized in the auth/ directory
// The signUp function is imported from './auth/signup'
// This prevents code duplication and ensures a single source of truth