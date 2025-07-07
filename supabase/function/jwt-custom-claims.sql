-- Grant USAGE on the auth schema to public so the claims function can be called
GRANT USAGE ON SCHEMA auth TO public;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS auth.jwt_custom_claims(uuid);

-- Create the new auth hook for JWT custom claims
CREATE OR REPLACE FUNCTION auth.jwt_custom_claims(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  user_role text;
begin
  -- Adjust this query to your roles table/column as needed
  SELECT role INTO user_role FROM permission WHERE member_id = user_id LIMIT 1;
  RETURN jsonb_build_object('role', user_role);
end;
$$;
