import { supabase } from '@/lib/supabase';

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

    return { user: data.user, profile: userData };
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}