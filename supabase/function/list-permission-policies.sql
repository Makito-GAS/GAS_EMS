-- List all RLS policies for the 'permission' table
SELECT * FROM pg_policies WHERE tablename = 'permission';

-- Show if RLS is enabled on the 'permission' table
SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'permission';
 