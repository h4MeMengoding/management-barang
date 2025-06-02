'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('SW update found');
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = (window.navigator as any).standalone === true;
    const isAndroidInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isInStandaloneMode || isIOSInstalled || isAndroidInstalled) {
      setIsInstalled(true);
      console.log('App is already installed');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install banner after a delay if not already installed
      const isBannerDismissed = isClient && typeof window !== 'undefined' && sessionStorage.getItem('installBannerDismissed');
      if (!isInstalled && !isBannerDismissed) {
        setTimeout(() => {
          setShowInstallBanner(true);
        }, 5000); // Show after 5 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('PWA was installed successfully');
      
      // Show success message
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Management Barang', {
          body: 'Aplikasi berhasil diinstall! Sekarang dapat diakses dari layar utama.',
          icon: '/icons/icon-192x192.png'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleBannerClose = () => {
    setShowInstallBanner(false);
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('installBannerDismissed', 'true');
    }
  };

  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }

  // Don't show banner if dismissed in this session
  if (isClient && typeof window !== 'undefined' && sessionStorage.getItem('installBannerDismissed')) {
    return null;
  }

  if (!showInstallBanner || !deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg shadow-lg border border-blue-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Download size={20} />
              <h3 className="font-semibold text-sm">Install Aplikasi</h3>
            </div>
            <p className="text-xs text-blue-100 mb-3">
              Install Management Barang untuk akses yang lebih cepat dan pengalaman yang lebih baik
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="bg-white text-blue-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleBannerClose}
                className="bg-blue-800 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-blue-900 transition-colors"
              >
                Nanti
              </button>
            </div>
          </div>
          <button
            onClick={handleBannerClose}
            className="ml-2 text-blue-200 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
