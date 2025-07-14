'use client';

import { useState } from 'react';
import { CHAT_BASE_URL, CHAT_ENDPOINT } from '../../../../libs/shared/config/constants';

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testBackendConnection = async () => {
    setIsLoading(true);
    setTestResult('Testing...');
    
    try {
      console.log('Testing connection to:', `${CHAT_BASE_URL}${CHAT_ENDPOINT}`);
      
      const response = await fetch(`${CHAT_BASE_URL}${CHAT_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [
            { role: 'user', content: 'Hello, this is a test message' }
          ] 
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        setTestResult(`❌ Error: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      setTestResult(`✅ Success! Response: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error: unknown) {
      let message = '未知错误';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      console.error('Test error:', error);
      setTestResult(`❌ Connection failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Configuration</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>CHAT_BASE_URL:</strong> {CHAT_BASE_URL}</p>
          <p><strong>CHAT_ENDPOINT:</strong> {CHAT_ENDPOINT}</p>
          <p><strong>Full URL:</strong> {CHAT_BASE_URL}{CHAT_ENDPOINT}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <button 
          onClick={testBackendConnection}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Backend Connection'}
        </button>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Test Result</h2>
        <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap font-mono text-sm">
          {testResult || 'No test run yet'}
        </div>
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Common Issues</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Backend not deployed:</strong> Make sure your NestJS backend is running and accessible</li>
          <li><strong>CORS issues:</strong> Backend might not allow requests from your frontend domain</li>
          <li><strong>Missing API key:</strong> DEEPSEEK_API_KEY environment variable might not be set</li>
          <li><strong>Wrong URL:</strong> CHAT_BASE_URL might be pointing to the wrong server</li>
        </ul>
      </div>
    </div>
  );
} 