/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import { useState, useCallback } from 'react';

interface DataSourceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState<File | null>(null);
  const [sqlConnection, setSqlConnection] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const handleSubmit = useCallback(() => {
    let data;
    switch (activeTab) {
      case 'file':
        data = { type: 'file', file };
        break;
      case 'sql':
        data = { type: 'sql', connection: sqlConnection };
        break;
      case 'web':
        data = { type: 'web', url: websiteUrl };
        break;
    }
    onSubmit(data);
  }, [activeTab, file, sqlConnection, websiteUrl, onSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-200 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-primary">Choose Data Source</h2>
        <div className="tabs tabs-boxed mb-4">
          <a className={`tab rounded-md ${activeTab === 'file' ? 'tab-active' : ''}`} onClick={() => setActiveTab('file')}>File Upload</a>
          <a className={`tab rounded-md ${activeTab === 'sql' ? 'tab-active' : ''}`} onClick={() => setActiveTab('sql')}>SQL Connection</a>
          <a className={`tab rounded-md ${activeTab === 'web' ? 'tab-active' : ''}`} onClick={() => setActiveTab('web')}>Web Scraping</a>
        </div>
        {activeTab === 'file' && (
          <input type="file" className="file-input file-input-bordered w-full rounded-md" onChange={(e) => setFile(e.target.files?.[0] || null)} accept=".xlsx,.pdf,.csv,.json,.txt" />
        )}
        {activeTab === 'sql' && (
          <input type="text" placeholder="Enter SQL connection string" className="input input-bordered w-full rounded-md" value={sqlConnection} onChange={(e) => setSqlConnection(e.target.value)} />
        )}
        {activeTab === 'web' && (
          <input type="url" placeholder="Enter website URL" className="input input-bordered w-full rounded-md" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <button className="btn btn-ghost rounded-md" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary rounded-md" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <span className="loading loading-spinner"></span> : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataSourceSelector;
