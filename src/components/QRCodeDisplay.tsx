'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface QRCode {
  _id: string;
  code: string;
  qrCode: string;
  isUsed: boolean;
  lockerId?: string | { _id: string; label: string };
  createdAt: string;
}

interface QRCodeDisplayProps {
  qrCode: QRCode;
  showDetails: boolean;
  printMode: boolean;
}

export default function QRCodeDisplay({ qrCode, showDetails, printMode }: QRCodeDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side mounting for createPortal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Modal component
  const QRModal = () => (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] p-4 sm:p-6 md:p-8 overflow-y-auto"
      onClick={() => setIsModalOpen(false)}
    >
      {/* Close button - positioned absolutely */}
      <button
        onClick={() => setIsModalOpen(false)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 sm:p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 backdrop-blur-sm"
        aria-label="Tutup modal"
      >
        <X size={24} className="sm:w-8 sm:h-8" />
      </button>

      {/* Modal Content Container */}
      <div className="w-full max-w-6xl mx-auto my-auto flex flex-col items-center justify-center min-h-full py-16 sm:py-20 px-4 sm:px-6">
        {/* QR Code Title */}
        <div className="text-center mb-4 sm:mb-6 px-2 sm:px-4 max-w-full">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-2 break-words leading-tight">
            QR Code Detail
          </h3>
          <p className="font-mono text-base sm:text-lg md:text-xl text-gray-300 break-all px-2">
            {qrCode.code}
          </p>
        </div>
      
        {/* Full Screen QR Code */}
        <div 
          className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-[95vw] sm:max-w-[90vw] max-h-[60vh] sm:max-h-[70vh] flex items-center justify-center mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={qrCode.qrCode}
            alt={`QR Code ${qrCode.code}`}
            width={600}
            height={600}
            className="mx-auto block max-w-full max-h-full object-contain"
            style={{ 
              minWidth: '250px', 
              minHeight: '250px',
              maxWidth: '85vw',
              maxHeight: '55vh'
            }}
          />
        </div>

        {/* QR Code Details */}
        <div className="mt-4 sm:mt-6 bg-slate-800/80 backdrop-blur-md border border-slate-600/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-full sm:max-w-md w-full mx-4">
          <div className="space-y-3 sm:space-y-4">
            {/* Status indicator */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                qrCode.isUsed ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className={`text-base sm:text-lg font-medium ${
                qrCode.isUsed ? 'text-green-400' : 'text-gray-300'
              }`}>
                {qrCode.isUsed ? 'Sudah Digunakan' : 'Belum Digunakan'}
              </span>
            </div>

            {/* Creation date */}
            <div className="text-center border-t border-slate-600/30 pt-3 sm:pt-4">
              <span className="text-xs sm:text-sm text-gray-400 block mb-1">Dibuat pada</span>
              <span className="text-sm sm:text-base text-gray-300 break-words">
                {new Date(qrCode.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {/* Locker connection info */}
            {qrCode.lockerId && (
              <div className="text-center p-2 sm:p-3 bg-green-900/20 text-green-400 rounded-lg border border-green-500/30">
                <span className="text-xs sm:text-sm block mb-1">Terhubung dengan</span>
                <span className="text-sm sm:text-base font-medium break-words">
                  Loker: {typeof qrCode.lockerId === 'object' ? String(qrCode.lockerId.label) : String(qrCode.lockerId)}
                </span>
              </div>
            )}

            {/* QR Code ID */}
            <div className="text-center text-xs text-gray-500 border-t border-slate-600/30 pt-3 sm:pt-4 break-all">
              ID: {qrCode._id}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 sm:mt-8 text-center px-4 max-w-full">
          <p className="text-gray-400 text-xs sm:text-sm break-words">
            Klik di area gelap atau tekan ESC untuk menutup
          </p>
        </div>
      </div>
    </div>
  );

  if (printMode) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 text-center bg-white print:bg-white">
        <div className="mb-2">
          <Image
            src={qrCode.qrCode}
            alt={`QR Code ${qrCode.code}`}
            width={120}
            height={120}
            className="mx-auto"
          />
        </div>
        <div className="text-sm font-mono font-bold text-gray-900">
          {qrCode.code}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          ID: {qrCode._id.slice(-6)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`dark-card p-6 transition-all duration-300 hover:scale-105 ${
        qrCode.isUsed 
          ? 'border-green-500/30 bg-green-900/10' 
          : 'border-slate-600/30'
      }`}>
        <div className="text-center mb-4">
          <div className="dark-icon inline-flex p-3 mb-3">
            <Image
              src={qrCode.qrCode}
              alt={`QR Code ${qrCode.code}`}
              width={100}
              height={100}
              className="rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsModalOpen(true)}
              title="Klik untuk memperbesar QR Code"
            />
          </div>
        </div>
      
      <div className="space-y-3">
        <div className="text-center">
          <span className="text-xs font-medium text-gray-400 block mb-1">Kode QR</span> 
          <span className="font-mono text-lg font-bold text-gray-100">{qrCode.code}</span>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            qrCode.isUsed ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
          <span className={`text-sm font-medium ${
            qrCode.isUsed ? 'text-green-400' : 'text-gray-400'
          }`}>
            {qrCode.isUsed ? 'Sudah Digunakan' : 'Belum Digunakan'}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="pt-3 border-t border-slate-600/30">
              <div className="text-xs text-gray-500 text-center">
                Dibuat: {new Date(qrCode.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              
              {qrCode.lockerId && (
                <div className="text-xs text-green-400 text-center mt-2 p-2 bg-green-900/20 rounded-lg border border-green-500/30">
                  Terhubung dengan Loker: {typeof qrCode.lockerId === 'object' ? String(qrCode.lockerId.label) : String(qrCode.lockerId)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>

      {/* Modal using portal to render outside of any container */}
      {isMounted && isModalOpen && createPortal(<QRModal />, document.body)}
    </>
  );
}
