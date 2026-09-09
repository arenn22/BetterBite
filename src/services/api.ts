import { supabase } from "../lib/supabase";
import type { AuthResult, Profile } from "../types/auth";

async function handleSignUp(
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error(authError.message);
    return {profile: null, error: authError.message};
  }

  if (!authData.user) {
    return {profile: null, error: "Failed to create user"};
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
    return {profile: null, error: profileError.message};
  }

  return {profile, error: null};
}

async function handleSignInEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error) console.log(error.message);
  else {
    const date = await getDateJoinedByID(data.user.id);
    const authProfile: AuthResult = {
      profile: {
        id: data.user.id,
        username: data.user.user_metadata.username || "",
        email: data.user.email || "",
        date_joined: date,
      },
      error: null,
    };
    console.log("Signed in user profile:", authProfile);
    return authProfile;
  }
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

async function getDateJoinedByID(userId:string): Promise<Date | null>  {
  const { data, error } = await supabase.rpc('get_dateJoined_by_id', {
    idVal: userId
  });

  if (error) {
    console.error('Error fetching date joined:', error.message);
    return null;
  }

  return data.date_joined ? new Date(data.date_joined) : null;
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