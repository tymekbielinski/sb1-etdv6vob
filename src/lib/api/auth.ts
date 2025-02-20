import { supabase } from '@/lib/supabase';
import { createTeam } from './team';

interface SignUpData {
  email: string;
  password: string;
  name: string;
  teamName: string;
}

export async function signUp({ email, password, name, teamName }: SignUpData) {
  // First check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (checkError) throw checkError;
  if (existingUser) throw new Error('User already registered');

  // Sign up the user
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (signUpError) throw signUpError;
  if (!data.user) throw new Error('Failed to create user');

  // Wait for user profile creation
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Create team
  try {
    await createTeam(teamName, email);
  } catch (error) {
    console.error('Error creating team:', error);
    // Clean up by deleting the user if team creation fails
    await supabase.auth.admin.deleteUser(data.user.id);
    throw new Error('Failed to create team');
  }

  return data;
}