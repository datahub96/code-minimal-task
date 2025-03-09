import { createClient } from "@supabase/supabase-js";

// Get environment variables with fallbacks for development
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://jzfprhwcmganisxxjpyt.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Check if credentials are available
let supabase;

// Import error codes
import { logError, ErrorCodes } from "./errorCodes";

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase client initialized successfully");
  } catch (error) {
    logError(ErrorCodes.DB_CONNECTION_FAILED, error, { source: "supabase.ts" });
    console.error("Error initializing Supabase client:", error);
    supabase = null;
  }
} else {
  logError(
    ErrorCodes.DB_SUPABASE_NOT_CONFIGURED,
    new Error("Supabase credentials not found"),
    { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey },
  );
  console.warn(
    "Supabase credentials not found. Using localStorage for data persistence.",
  );
  supabase = null;
}

export { supabase };
