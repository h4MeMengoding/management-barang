'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowOfflineMessage(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage && isOnline) {
    return null;
  }

  return (
    <div 
      className={`fixed top-16 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40 transition-all duration-300 ${
        showOfflineMessage ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className={`p-3 rounded-lg shadow-lg border ${
        isOnline 
          ? 'bg-green-600 border-green-500 text-white' 
          : 'bg-red-600 border-red-500 text-white'
      }`}>
        <div className="flex items-center space-x-2">
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="text-sm font-medium">
            {isOnline ? 'Kembali online' : 'Mode offline - Data tersimpan secara lokal'}
          </span>
        </div>
      </div>
    </div>
  );
}
