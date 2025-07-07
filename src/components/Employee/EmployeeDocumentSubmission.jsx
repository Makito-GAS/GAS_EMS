import React, { useState, useContext } from 'react';
import { FaFileUpload } from 'react-icons/fa';

import supabase from '../../../supabase-client';
import { AuthContext } from '../../context/AuthContext';
import Sidebar, { SidebarItem } from '../Sidebar/Sidebar';

const REQUIRED_DOCS = [
  { key: 'bankaccount', label: 'Bank Account' },
  { key: 'id', label: 'ID' },
  { key: 'nda', label: 'NDA' },
  { key: 'poa', label: 'POA' },
  { key: 'qualification', label: 'Qualification' },
];

export default function EmployeeDocumentSubmission() {
  const { session } = useContext(AuthContext);
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(''); 

  const handleFileChange = (e, docType) => {
    setFiles({ ...files, [docType]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');
    try {
      for (const doc of REQUIRED_DOCS) {
        const file = files[doc.key];
        if (!file) continue;
        const filePath = `${session.user.id}/${doc.key}_${Date.now()}_${file.name}`;
        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('employee-documents')
          .upload(filePath, file, { upsert: true });
        if (storageError) {
          console.error('Supabase Storage Error:', storageError);
          throw storageError;
        }
        // Insert row in employee_documents table
        const { error: dbError } = await supabase.from('employee_documents').insert({
          employee_id: session.user.id,
          document_type: doc.key,
          file_url: filePath,
        });
        if (dbError) {
          console.error('Supabase DB Insert Error:', dbError);
          throw dbError;
        }
      }
      setMessage('Documents submitted successfully!');
    } catch (err) {
      setMessage('Error submitting documents: ' + (err.message || err.details || JSON.stringify(err)));
      console.error('Document Submission Error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar>
        <SidebarItem
          icon={<FaFileUpload className="w-6 h-6" />}
          text="Submit Documents"
          path="/employee/submit-documents"
        />
        {/* ...other sidebar items if needed... */}
      </Sidebar>
      <main className="flex-1">
        <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Submit Required Documents</h2>
          <form onSubmit={handleSubmit}>
            {REQUIRED_DOCS.map((doc) => (
              <div key={doc.key} className="mb-4">
                <label className="block font-medium mb-1">{doc.label}</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => handleFileChange(e, doc.key)}
                  required={!files[doc.key]}
                  className="border p-2 rounded w-full"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {uploading ? 'Submitting...' : 'Submit Documents'}
            </button>
          </form>
          {message && <div className="mt-4 text-center">{message}</div>}
        </div>
      </main>
    </div>
  );
}
