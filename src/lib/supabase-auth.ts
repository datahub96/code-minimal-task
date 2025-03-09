import { supabase } from "./supabase";
import { StorageManager } from "@/components/storage/StorageManager";

// Check if Supabase is available
const isSupabaseAvailable = !!supabase;

// User authentication functions
export async function registerUser(userData: {
  username: string;
  email: string;
  password: string;
}) {
  if (!isSupabaseAvailable) {
    throw new Error("Supabase is not configured properly");
  }

  try {
    // First check if username or email already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq."${userData.username}",email.eq."${userData.email}"`);

    if (checkError) throw checkError;

    if (existingUsers && existingUsers.length > 0) {
      // Check which field is duplicated
      const duplicateUsername = existingUsers.some(
        (user) => user.username === userData.username,
      );
      const duplicateEmail = existingUsers.some(
        (user) => user.email === userData.email,
      );

      if (duplicateUsername) {
        throw new Error("Username already exists");
      }
      if (duplicateEmail) {
        throw new Error("Email already exists");
      }
    }

    // Create auth user with email/password
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) throw authError;

    // Store additional user data in the users table
    const { data: userData2, error: userError } = await supabase
      .from("users")
      .insert([
        {
          auth_id: authData.user?.id,
          username: userData.username,
          email: userData.email,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (userError) throw userError;

    return { user: userData2, session: authData.session };
  } catch (error: any) {
    console.error("Registration error:", error);
    throw error;
  }
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  if (!isSupabaseAvailable) {
    throw new Error("Supabase is not configured properly");
  }

  try {
    // Sign in with email and password
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

    if (authError) throw authError;

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authData.user?.id)
      .single();

    if (userError) throw userError;

    // Update last login timestamp
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("auth_id", authData.user?.id);

    // We'll return the user data and let the component handle storage
    // This prevents issues with the storage not being updated properly

    return { user: userData, session: authData.session };
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function logoutUser() {
  if (!isSupabaseAvailable) {
    // Just clear local storage if Supabase isn't available
    StorageManager.removeItem("taskManagerUser");
    return;
  }

  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local storage
    StorageManager.removeItem("taskManagerUser");
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  if (!isSupabaseAvailable) {
    return null;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      return null;
    }

    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", sessionData.session.user.id)
      .single();

    if (error) throw error;

    return userData;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function checkUsernameExists(username: string) {
  if (!isSupabaseAvailable) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the "no rows returned" error
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
}

export async function checkEmailExists(email: string) {
  if (!isSupabaseAvailable) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is the "no rows returned" error
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
}
