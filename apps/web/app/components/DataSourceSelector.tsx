/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable line-comment-position */
import React, { useState, useCallback } from 'react';
import { uploadDocument } from '../services/uploadService';
import { scrapeWebsite } from '../services/scrapingService'; // Import scraping service
import { checkTaskState } from '../services/taskService'; // Import task service
import { UploadResponse } from '../models/api';
import Chatbox from './Chatbox';

interface DataSourceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState<File | null>(null);
  // upload 
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [contextLibId, setContextLibId] = useState<string | null>(null);
  // web
  const [websiteUrl, setWebsiteUrl] = useState('');
  //sql TODO 
  const [sqlConnection, setSqlConnection] = useState('');
  const [scrapedUrl, setScrapedUrl] = useState<string | null>(null); // Add scrapedUrl state

  const handleSubmit = useCallback(async () => {
    setContextLibId(null);
    setContextLibId(null);
    if (activeTab === 'file' && file) {
      setIsUploading(true);
      try {
        const response: UploadResponse = await uploadDocument(file);
        setContextLibId(response.data.lib_id);
        setUploadedFileName(file.name);  // Save the file name
      } catch (error) {
        console.error('File upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    } else if (activeTab === 'web' && websiteUrl) {
      // Check if the URL is valid using a regex
      const urlPattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,6}(\/[^\s]*)?$|^([a-z0-9-]+\.)+[a-z]{2,6}$/i;
      if (!urlPattern.test(websiteUrl)) {
        console.error('Invalid URL format:', websiteUrl);
        alert('Please enter a valid URL.');
        return; // Exit the function if the URL is invalid
      }

      setIsUploading(true);
      try {
        const data = await scrapeWebsite(websiteUrl); // Use scraping service
        if (data.code === 0) {
          const taskId = data.data.task_id;
          // Polling for task status
          let isTaskComplete = false;
          while (!isTaskComplete) {
            const taskStateData = await checkTaskState(taskId); // Use task service
            if (taskStateData.code !== 0) {
              setIsUploading(false);
              const errMsg = taskStateData.message || taskStateData.error || 'Unknown error';
              console.error('Error fetching task state:', errMsg);
              alert(`Web scraping failed: ${data.message || data.error}`);
              break; // Stop polling on error
            }
            if (taskStateData.data.status === 'done') {
              setContextLibId(taskStateData.data.lib_id); // Cache scraping lib_id
              setScrapedUrl(websiteUrl); // Set scrapedUrl
              isTaskComplete = true;
              setIsUploading(false);
            } else if (taskStateData.data.status === 'in_progress') {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before next check
            }
          }
        }
      } catch (error) {
        console.error('Web scraping failed:', error);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Handle other tabs as before
      console.log('Submitted data:', { type: activeTab, sqlConnection, websiteUrl });
    }
  }, [activeTab, file, sqlConnection, websiteUrl]);

  const handleClose = () => {
    setContextLibId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-base-200 rounded-lg p-6 w-full max-w-4xl relative ${contextLibId ? 'h-[90vh]' : ''}`}>
        <button className="btn btn-ghost rounded-md absolute top-2 right-2" onClick={handleClose}>Close</button>
        { !contextLibId ? (
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
            {scrapedUrl && ( // Conditionally render scrapedUrl
              <div className="mb-4 text-lg text-gray-700">
                Scraped URL: <a href={scrapedUrl} target="_blank" rel="noopener noreferrer">{scrapedUrl}</a>
              </div>
            )}
            <div className="flex-grow overflow-hidden">
              <Chatbox libId={contextLibId} fileName={uploadedFileName} scrapedUrl={scrapedUrl} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourceSelector;
