import React, { useEffect, useState } from 'react';
import supabase from '../../../supabase-client';
import { FaFileAlt, FaFolderOpen, FaDownload } from 'react-icons/fa';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { useRef } from 'react';


const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null); // Track which doc is being viewed
  const pdfPlugin = defaultLayoutPlugin();
  const [signedUrl, setSignedUrl] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const toggleModal = () => setShowModal(!showModal);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('employee_documents')
        .select(`
          document_type, 
          status, 
          file_url,
          employee_id, 
          member:employee_id(
            name,
            department
          )
        `);
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

  // Group documents by employee_id
  const employees = React.useMemo(() => {
    const map = {};
    documents.forEach(doc => {
      if (!map[doc.employee_id]) {
        map[doc.employee_id] = {
          ...doc.member,
          employee_id: doc.employee_id,
          documents: [],
          department: doc.member?.department,
        };
      }
      map[doc.employee_id].documents.push(doc);
    });
    return Object.values(map);
  }, [documents]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
  if (error) return (
    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
      <span className="font-medium">Error!</span> {error}
    </div>
  );

  const handleViewDoc = async (doc) => {
    setViewingDoc(doc);
    if (doc.file_url) {
      const url = await getSignedUrl(doc.file_url);
      setSignedUrl(url);
    }
  };

  const updateDocumentStatus = async () => {
    if (!viewingDoc) return;
    setStatusLoading(true);
    setStatusMessage('');
    const newStatus = viewingDoc.status === 'approved' ? 'pending' : 'approved';
    console.log('Updating:', {
      employee_id: viewingDoc.employee_id,
      document_type: viewingDoc.document_type,
      newStatus
    });
    const { error, data } = await supabase
      .from('employee_documents')
      .update({ status: newStatus })
      .eq('employee_id', viewingDoc.employee_id)
      .eq('document_type', viewingDoc.document_type);
    console.log('Update result:', { error, data });
    if (error) {
      setStatusMessage('Failed to update status.');
    } else {
      setStatusMessage('Status updated!');
      // Optionally re-fetch documents here
    }
    setStatusLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Employee Documents</h2>
        <button
          onClick={toggleModal}
          className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaFileAlt className="mr-2" />
          New Document
        </button>
      </div>

      {/* Card layout for mobile */}
      <div className="sm:hidden grid grid-cols-1 gap-4">
        {employees.map((emp, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <div className="font-bold text-gray-800 text-base">{emp.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">Department: {emp.department?.name || 'N/A'}</div>
            <div className="text-xs text-gray-500">Documents: {emp.documents.map(d => d.document_type).join(', ')}</div>
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedEmployee(emp);
                  setShowModal(true);
                }}
                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Documents
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Table layout for desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documents
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((emp, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {emp.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {emp.department?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {emp.documents.map(d => d.document_type).join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setShowModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Documents
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Document Modal */}
      {showModal && selectedEmployee && (
        <>
          {/* PDF Fullscreen Preview */}
          {viewingDoc ? (
            <div className="fixed inset-0 bg-white z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setViewingDoc(null); setSignedUrl(null); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold "
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={updateDocumentStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold disabled:opacity-50"
                    disabled={statusLoading}
                  >
                    {statusLoading ? 'Updating...' : 'Update Status'}
                  </button>
                  {statusMessage && (
                    <span className="ml-2 text-xs text-gray-600">{statusMessage}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mx-auto">{viewingDoc.document_type?.toUpperCase()} Document</h3>
                <div className="w-32" /> {/* Spacer to balance layout */}
              </div>
              <div className="flex-1 w-full h-full overflow-auto">
                {signedUrl ? (
                  <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                    <Viewer fileUrl={signedUrl} plugins={[pdfPlugin]} />
                  </Worker>
                ) : (
                  <div className="text-red-500 p-8">No PDF file found for this document.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-xl">
                <div className="bg-white rounded-lg shadow-xl w-full">
                  <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold">Uploaded Documents</h3>
                    <button
                      onClick={toggleModal}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {['id', 'qualification', 'poa', 'bankaccount','nda'].map(type => {
                      const doc = selectedEmployee.documents.find(d => d.document_type === type);
                      return (
                        <div key={type} className="border rounded-lg p-4 flex flex-col items-center">
                          <div className="font-semibold">{type}</div>
                          {doc ? (
                            <>
                              <div className="text-xs text-gray-500">{doc.status}</div>
                              <button
                                className="mt-2 text-blue-600 flex items-center"
                                onClick={() => handleViewDoc(doc)}
                              >
                                <FaDownload className="mr-1" /> View
                              </button>
                            </>
                          ) : (
                            <div className="text-red-500 mt-2">Not Uploaded</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Documents;

async function getSignedUrl(file_url) {
  const bucket = 'employee-documents'; // replace with your actual bucket name
  const path = file_url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  return data.signedUrl;
}
