import { supabase } from '@/lib/supabase';
import { createTeam } from '@/lib/api/team';

interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export async function signUp({ email, password, name }: SignUpData) {
  try {
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Sign up the user with minimal metadata to avoid database conflicts
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // Only include essential data in the initial sign-up
      options: {
        data: { name },
        // Don't automatically sign in after sign-up
        emailRedirectTo: window.location.origin + '/login',
      },
    });

    if (signUpError) throw signUpError;
    if (!data.user) throw new Error('Failed to create user');

    // Wait for database triggers with retry logic
    let retries = 5;
    let userData = null;
    
    while (retries > 0 && !userData) {
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, 5 - retries) * 1000));
      
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      if (user) {
        userData = user;
        break;
      }

      retries--;
    }

    if (!userData) {
      throw new Error('Failed to verify user creation');
    }
    
    // Only attempt to create a team if user was successfully created
    if (data?.user?.id) {
      try {
        // Wait a bit to ensure user is fully created in the database
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if the user already has a team (in case the database trigger already created one)
        const { data: existingTeams, error: teamQueryError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('user_id', data.user.id);
        
        if (teamQueryError) {
          console.error('Error checking for existing teams:', teamQueryError);
        }
        
        // Only create a team if the user doesn't already have one
        if (!existingTeams || existingTeams.length === 0) {
          const teamName = `${name}'s team`;
          await createTeam(teamName, email);
          console.log(`Team created for user: ${email}`);
        } else {
          console.log(`User already has a team: ${existingTeams[0].name}`);
        }
      } catch (teamError) {
        console.error('Error creating team:', teamError);
        // Continue with sign-up even if team creation fails
        // The user can create a team later
      }
    }

    return { user: data.user, profile: userData };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}