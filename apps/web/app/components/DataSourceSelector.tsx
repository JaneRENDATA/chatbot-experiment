/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable line-comment-position */
import React, { useState, useCallback } from 'react';
import { uploadDocument } from '../services/uploadService';
import { UploadResponse } from '../models/api';
import Chatbox from './Chatbox';

interface DataSourceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState<File | null>(null);
  const [sqlConnection, setSqlConnection] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedLibId, setUploadedLibId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (activeTab === 'file' && file) {
      setIsUploading(true);
      try {
        const response: UploadResponse = await uploadDocument(file);
        setUploadedLibId(response.data.lib_id);
        setUploadedFileName(file.name);  // Save the file name
      } catch (error) {
        console.error('File upload failed:', error);
        // Handle error (e.g., show an error message to the user)
      } finally {
        setIsUploading(false);
      }
    } else {
      // Handle other tabs as before
      console.log('Submitted data:', { type: activeTab, sqlConnection, websiteUrl });
    }
  }, [activeTab, file, sqlConnection, websiteUrl]);

  const handleClose = () => {
    setUploadedLibId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-base-200 rounded-lg p-6 w-full max-w-4xl relative ${uploadedLibId ? 'h-[90vh]' : ''}`}>
        <button className="btn btn-ghost rounded-md absolute top-2 right-2" onClick={handleClose}>Close</button>
        {!uploadedLibId ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-primary">Choose Data Source</h2>
            <div className="tabs tabs-boxed mb-4">
              <a className={`tab rounded-md ${activeTab === 'file' ? 'tab-active' : ''}`} onClick={() => setActiveTab('file')}>File Upload</a>
              <a className={`tab rounded-md ${activeTab === 'sql' ? 'tab-active' : ''}`} onClick={() => setActiveTab('sql')}>SQL Connection</a>
              <a className={`tab rounded-md ${activeTab === 'web' ? 'tab-active' : ''}`} onClick={() => setActiveTab('web')}>Web Scraping</a>
            </div>
            {activeTab === 'file' && (
              <input type="file" className="file-input file-input-bordered w-full rounded-md" onChange={(event) => setFile(event.target.files?.[0] || null)} accept=".xlsx,.pdf,.csv,.json,.txt" />
            )}
            {activeTab === 'sql' && (
              <input type="text" placeholder="Enter SQL connection string" className="input input-bordered w-full rounded-md" value={sqlConnection} onChange={(event) => setSqlConnection(event.target.value)} />
            )}
            {activeTab === 'web' && (
              <input type="url" placeholder="Enter website URL" className="input input-bordered w-full rounded-md" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} />
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <button className="btn btn-primary rounded-md" onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? <span className="loading loading-spinner"></span> : 'Submit'}
              </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-primary">Chat with AI</h2>
            <div className="flex-grow overflow-hidden">
              <Chatbox libId={uploadedLibId} fileName={uploadedFileName} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceSelector;
