import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'



// Initializing Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,  // Use AsyncStorage for storing auth sessions
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, 
    },
  });