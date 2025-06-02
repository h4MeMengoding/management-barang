'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Check } from 'lucide-react';

export default function PWAStatusIndicator() {
  const [isPWAReady, setIsPWAReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = (window.navigator as any).standalone === true;
    
    if (isInStandaloneMode || isIOSInstalled) {
      setIsInstalled(true);
    }

    // Check if PWA is ready (service worker registered)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsPWAReady(true);
      });
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isPWAReady && !isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-30">
      <div className={`p-2 rounded-full shadow-lg border ${
        isInstalled 
          ? 'bg-green-100 border-green-300 text-green-700' 
          : 'bg-blue-100 border-blue-300 text-blue-700'
      }`}>
        {isInstalled ? (
          <div className="flex items-center space-x-1">
            <Check size={16} />
            <span className="text-xs font-medium hidden sm:block">Terinstall</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <Smartphone size={16} />
            <span className="text-xs font-medium hidden sm:block">Siap Install</span>
          </div>
        )}
      </div>
    </div>
  );
}
