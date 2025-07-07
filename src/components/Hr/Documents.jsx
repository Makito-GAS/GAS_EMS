import React, { useEffect, useState } from 'react';
import supabase from '../../../supabase-client';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      // Use the correct foreign key 'employee_id' for the join
      const { data, error } = await supabase
        .from('employee_documents')
        .select('document_type, status, employee_id, member:employee_id(name)');
      if (error) {
        setError(error.message);
        setDocuments([]);
      } else {
        setDocuments(data || []);
        setError(null);
      }
      setLoading(false);
    };
    fetchDocuments();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>All Employee Documents</h2>
      {documents.length === 0 ? (
        <div>No documents found.</div>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Document Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, idx) => (
              <tr key={idx}>
                <td>{doc.member?.name || 'Unknown'}</td>
                <td>{doc.document_type}</td>
                <td>{doc.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Documents;
