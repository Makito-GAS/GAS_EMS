-- Grant SELECT on employee_documents to authenticated users (so RLS can work)
GRANT SELECT ON TABLE public.employee_documents TO authenticated;

-- Enable RLS if not already enabled
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Allow HR to view all documents
CREATE POLICY "HR can view all documents"
  ON public.employee_documents
  FOR SELECT
  USING (auth.jwt() ->> 'user_role' = 'hr');

-- (Optional) Allow employees to view their own documents
CREATE POLICY "Employee can view own documents"
  ON public.employee_documents
  FOR SELECT
  USING (user_id = auth.uid());
