import { supabase } from "./supabase"

//SIGN UP 
export const signUpUser = async (email, password, fullName) => {
  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'yourapp://',
      }
    });
  
    if (authError) {
      console.error("Auth error:", authError.message);
      throw authError;
    }
    
    // If auth user creation was successful, create a profile in the 'profiles' table
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      
      if (profileError) {
        console.error("Profile creation error:", profileError.message);
      }
    }
    
    return { data: authData, error: null };
  } catch (error) {
    console.error("Signup error:", error.message);
    return { data: null, error };
  }
}

//SIGN IN 
export const signInUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        shouldCreateUser: false,
      }
    });
  
    if (error) {
      console.error("Signin error:", error.message);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Signin error:", error.message);
    return { data: null, error };
  }
}

//Signing in with Google
export const signInWithGoogle = async () => {
  try {
    // Get the hostname from environment or device IP
    // For development in Expo, we use a deep link that will redirect back to Expo
    const redirectUrl = 'exp://192.168.1.91:8081'; // Use your device's actual IP or configure your app scheme
    
    console.log('Starting Google OAuth with redirect URL:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
        // Add specific OAuth options
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    
    if (error) {
      console.error("Google signin error:", error.message);
      throw error;
    }
    
    console.log('OAuth initiated successfully, URL:', data?.url);
    return { data, error: null };
  } catch (error) {
    console.error("Google signin error:", error.message);
    return { data: null, error };
  }
}

//SIGN OUT 
export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Signout error:", error.message);
      throw error;
    }
    return { error: null };
  } catch (error) {
    console.error("Signout error:", error.message);
    return { error };
  }
}

//CHECK IF USER LOGGED IN 
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      return { user: null, error: new Error('No active session') };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return { user: data.user, error: null };
  } catch (error) {
    console.error("Get user error:", error.message);
    return { user: null, error };
  }
}

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      throw error;
    }
    
    return { profile: data, error: null };
  } catch (error) {
    console.error("Get profile error:", error.message);
    return { profile: null, error };
  }
}

// Send password reset email
export const resetPassword = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'yourapp://reset-password',
    });
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Password reset error:", error.message);
    return { data: null, error };
  }
}
  