'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function DatabaseTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: data.message
      });
    } catch {
      setResult({
        success: false,
        message: 'Failed to connect to database API'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connection Test</h3>
      
      <button
        onClick={testConnection}
        disabled={testing}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle size={16} />
        )}
        <span>{testing ? 'Testing...' : 'Test Connection'}</span>
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {result.success ? (
            <CheckCircle size={16} className="text-green-600" />
          ) : (
            <XCircle size={16} className="text-red-600" />
          )}
          <span className="text-sm">{result.message}</span>
        </div>
      )}
    </div>
  );
}
