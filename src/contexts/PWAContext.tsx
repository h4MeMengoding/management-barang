'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import IOSInstallModal from '@/components/IOSInstallModal';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isIOSChrome: boolean;
  installPWA: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);

    // Detect iOS and iOS Chrome
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isIOSChromeApp = isIOSDevice && /crios/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsIOSChrome(isIOSChromeApp);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Service Worker registered successfully
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            // Service Worker update found
          });
        })
        .catch(() => {
          // Service Worker registration failed
        });
    }

    // Check if app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSInstalled = (window.navigator as { standalone?: boolean }).standalone === true;
    
    if (isInStandaloneMode || isIOSInstalled) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event (Android/Desktop only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      
      // Show success message
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Management Barang', {
          body: 'Aplikasi berhasil diinstall! Sekarang dapat diakses dari layar utama.',
          icon: '/icons/icon-barangku-192.png'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    // For iOS devices, show instruction modal
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      
      setDeferredPrompt(null);
    } catch {
      // Error installing PWA - silent fail for production
    }
  };

  // Can install if:
  // 1. Has deferredPrompt (Android/Desktop Chrome/Edge)
  // 2. iOS device in Safari (not Chrome)
  // 3. iOS Chrome (show instructions)
  const canInstall = isClient && !isInstalled && (
    !!deferredPrompt || 
    (isIOS && !isIOSChrome) || 
    isIOSChrome
  );

  return (
    <PWAContext.Provider value={{
      deferredPrompt,
      isInstalled,
      canInstall,
      isIOS,
      isIOSChrome,
      installPWA
    }}>
      {children}
      <IOSInstallModal 
        isOpen={showIOSModal} 
        onClose={() => setShowIOSModal(false)}
        isIOSChrome={isIOSChrome}
      />
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
