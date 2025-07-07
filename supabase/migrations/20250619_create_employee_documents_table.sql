-- Table: employee_documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type text NOT NULL CHECK (document_type IN ('bankaccount', 'id', 'nda', 'poa', 'qualification')),
    file_url text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at timestamp with time zone DEFAULT timezone('utc', now()),
    reviewed_at timestamp with time zone,
    reviewed_by uuid REFERENCES auth.users(id),
    notes text
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_document_type ON employee_documents(document_type);

-- RLS Policies
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Employees can insert and view their own documents
CREATE POLICY "Employees can insert and view their own documents" ON employee_documents
    FOR ALL
    USING (auth.uid() = employee_id);

-- Policy: HR/Admin can view and update all documents (assumes HR/Admin role is set in JWT)
CREATE POLICY "HR and Admin can view and update all documents" ON employee_documents
    FOR ALL
    USING (auth.role() IN ('hr', 'admin'));

-- You may need to adjust the HR/Admin policy depending on your JWT claims setup.

-- Supabase Storage: Create a bucket named 'employee-documents' and set RLS policies to allow employees to upload their own files and HR/Admin to access all files.
