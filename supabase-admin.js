import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const service_role_key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

const supabaseAdmin = createClient(supabase_url, service_role_key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Access auth admin api
const adminAuthClient = supabaseAdmin.auth.admin

export default adminAuthClient;


