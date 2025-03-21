import { supabase } from "./supabase"

//SIGN UP 

export const signUpUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
  
    if (error) {
      console.error(error.message)
    } else {
      console.log("User signed up:", data)
    }
  }

//SIGN IN 
const signInUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      console.error(error.message);
    } else {
      console.log("User signed in:", data)
    }
  }

//SIGN OUT 
const signOutUser = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error(error.message)
  }


//CHECK IF USER LOGGED IN 
const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    console.log("Logged in user:", data)
  }
  