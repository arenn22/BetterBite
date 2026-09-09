import { supabase } from "../lib/supabase";
import type { Profile } from "../types/auth";

async function handleSignUp(
  username: string,
  email: string,
  password: string
): Promise<Profile | null> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error(authError.message);
    return null;
  }

  if (!authData.user) {
    return null;
  }

  const profile: Profile = {
    id: authData.user.id,
    username,
    email,
    date_joined: new Date(),
  };

  const { error: profileError } = await supabase.from("profiles").insert(profile);

  if (profileError) {
    console.error("Profile error:", profileError.message);
    return null;
  }

  return profile;
}

async function handleSignInEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error) console.log(error.message);
  else console.log('User signed in:', data.session);
}

async function handleSignInUsername(username: string, password: string) {
    const email = await getEmailWithUsername(username);
    if (email) {
        await handleSignInEmail(email, password);
    }
    else {
        console.error('No email found for chosen username:', username);
    }
}

async function getEmailWithUsername(username: string) {
    const {data, error} = await supabase.rpc('get_email_with_username', {
        username: username,
    })

    if(error) {
        console.error('Error fetching email:', error.message);
        return null;
    }

    if(data && data.length > 0) {
        return data[0].email;
    }
    return null;
}