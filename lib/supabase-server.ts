import { createClient } from "@supabase/supabase-js";

// Ensure these environment variables are correctly set in your .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for server-side client.");
}

// Create a Supabase client configured for the server environment (e.g., Service Role)
// The service role key bypasses Row-Level Security (RLS), so be very cautious when using it.
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false, // Sessions should not persist in serverless functions
    },
  }
);
