'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share, Plus, Smartphone } from 'lucide-react';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOSChrome?: boolean;
}

export default function IOSInstallModal({ isOpen, onClose, isIOSChrome = false }: IOSInstallModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Install Aplikasi</h2>
              <p className="text-sm text-slate-400">
                {isIOSChrome ? 'iOS Chrome' : 'iOS Safari'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          {isIOSChrome ? (
            <>
              {/* iOS Chrome Instructions */}
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
                <p className="text-amber-200 text-sm font-medium mb-2">
                  ⚠️ Chrome di iOS tidak mendukung install PWA langsung
                </p>
                <p className="text-amber-100 text-sm">
                  Untuk pengalaman terbaik, gunakan Safari untuk menginstall aplikasi ini.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-white font-medium">Langkah-langkah:</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <p className="text-slate-300 text-sm">
                      Buka Safari di iPhone/iPad Anda
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <p className="text-slate-300 text-sm">
                      Kunjungi aplikasi Management Barang
                    </p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <p className="text-slate-300 text-sm">
                      Ikuti instruksi install yang akan muncul
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* iOS Safari Instructions */}
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                <p className="text-green-200 text-sm font-medium mb-2">
                  📱 Safari mendukung install PWA
                </p>
                <p className="text-green-100 text-sm">
                  Ikuti langkah-langkah berikut untuk menginstall aplikasi ke home screen.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-white font-medium">Langkah-langkah:</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 text-sm mb-1">
                        Tap tombol <strong>Share</strong> di Safari
                      </p>
                      <div className="flex items-center space-x-1 text-blue-400">
                        <Share size={16} />
                        <span className="text-xs">(kotak dengan panah ke atas)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 text-sm mb-1">
                        Pilih <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                      </p>
                      <div className="flex items-center space-x-1 text-blue-400">
                        <Plus size={16} />
                        <span className="text-xs">Add to Home Screen</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      3
                    </div>
                    <p className="text-slate-300 text-sm">
                      Tap <strong>&ldquo;Add&rdquo;</strong> untuk konfirmasi
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
