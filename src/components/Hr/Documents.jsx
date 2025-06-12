import React, { useEffect, useState } from 'react'
import supabase from '../../../supabase-client'



const Documents = () => {
  const [uploading, setUploading] = useState(false);
  const [pdfs, setPdfs] = useState([]);

  // Fetch list of PDFs in the bucket
  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    const { data, error } = await supabase.storage.from('test').list('', { limit: 10 });
    if (!error && data) {
      setPdfs(data.filter(file => file.name.endsWith('.pdf')));
    }
  };

  // Upload PDF to Supabase 'test' bucket
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    setUploading(true);
    const { data, error } = await supabase.storage.from('test').upload(file.name, file, { upsert: true });
    setUploading(false);
    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      fetchPdfs();
      alert('Upload successful!');
    }
  };

  // Download PDF from Supabase 'test' bucket
  const handleDownload = async (fileName) => {
    const { data, error } = await supabase.storage.from('test').download(fileName);
    if (error) {
      alert('Download failed: ' + error.message);
      return;
    }
    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };



  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Document Management</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Upload, store, and manage employee documents securely. E-signature and download support.
      </p>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleUpload}
        disabled={uploading}
        className="mb-4"
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Available PDFs</h2>
        <ul>
          {pdfs.map(file => (
            <li key={file.name} className="flex items-center justify-between mb-2">
              <span>{file.name}</span>
              <button
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                onClick={() => handleDownload(file.name)}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Documents
