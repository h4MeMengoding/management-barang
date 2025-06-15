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
      <div className="w-full max-w-3xl mx-auto my-auto flex flex-col items-center justify-center min-h-full py-6 sm:py-8 px-4 sm:px-6">
        {/* QR Code Title */}
        <div className="text-center mb-2 sm:mb-3 px-2 sm:px-4 max-w-full">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-1 break-words leading-tight">
            QR Code Detail
          </h3>
          <p className="font-mono text-sm sm:text-base md:text-lg text-gray-300 break-all px-2">
            {qrCode.code}
          </p>
        </div>
      
        {/* Full Screen QR Code */}
        <div 
          className="bg-white p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-2xl max-w-[85vw] sm:max-w-[70vw] max-h-[55vh] sm:max-h-[60vh] flex items-center justify-center mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={qrCode.qrCode}
            alt={`QR Code ${qrCode.code}`}
            width={450}
            height={450}
            className="mx-auto block max-w-full max-h-full object-contain"
            style={{ 
              minWidth: '200px', 
              minHeight: '200px',
              maxWidth: '75vw',
              maxHeight: '50vh'
            }}
          />
        </div>

        {/* QR Code Details */}
        <div className="mt-2 sm:mt-3 bg-slate-800/80 backdrop-blur-md border border-slate-600/50 rounded-lg sm:rounded-xl p-3 sm:p-4 max-w-full sm:max-w-md w-full mx-4">
          <div className="space-y-2 sm:space-y-3">
            {/* Status indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                qrCode.isUsed ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className={`text-sm sm:text-base font-medium ${
                qrCode.isUsed ? 'text-green-400' : 'text-gray-300'
              }`}>
                {qrCode.isUsed ? 'Sudah Digunakan' : 'Belum Digunakan'}
              </span>
            </div>

            {/* Creation date */}
            <div className="text-center border-t border-slate-600/30 pt-2 sm:pt-3">
              <span className="text-xs text-gray-400 block mb-1">Dibuat pada</span>
              <span className="text-xs sm:text-sm text-gray-300 break-words">
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
            {qrCode.isUsed && qrCode.lockerId ? (
              <div className="text-center p-3 bg-green-900/20 text-green-400 rounded-lg border border-green-500/30">
                <span className="text-xs block mb-1">✅ Terhubung dengan Loker</span>
                <span className="text-sm sm:text-base font-semibold break-words">
                  {typeof qrCode.lockerId === 'object' ? qrCode.lockerId.label : String(qrCode.lockerId)}
                </span>
              </div>
            ) : (
              <div className="text-center p-3 bg-gray-800/30 text-gray-400 rounded-lg border border-gray-600/30">
                <span className="text-xs block mb-1">⏳ Belum Terhubung</span>
                <span className="text-sm break-words">
                  Scan QR code ini untuk membuat loker baru
                </span>
              </div>
            )}

            {/* QR Code ID */}
            <div className="text-center text-xs text-gray-500 border-t border-slate-600/30 pt-2 break-all">
              ID: {qrCode._id}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-3 sm:mt-4 text-center px-4 max-w-full">
          <p className="text-gray-400 text-xs break-words">
            Klik di area gelap atau tekan ESC untuk menutup
          </p>
        </div>
      </div>
    </div>
  );

  if (printMode) {
    return (
      <div className="border-2 border-gray-200 rounded-2xl p-6 text-center bg-white print:bg-white shadow-sm">
        <div className="mb-4">
          <Image
            src={qrCode.qrCode}
            alt={`QR Code ${qrCode.code}`}
            width={200}
            height={230}
            className="mx-auto rounded-lg"
          />
        </div>
        {/* QR code is now clean and simple */}
        <div className="text-xs text-gray-500 mt-3">
          ID: {qrCode._id.slice(-6)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`dark-card qr-card-stroke p-6 ${
        qrCode.isUsed 
          ? 'border-green-500/30 bg-green-900/10' 
          : 'border-slate-600/30'
      }`}>
        <div className="text-center mb-4">
          <div className="dark-icon inline-flex p-3 mb-3">
            <Image
              src={qrCode.qrCode}
              alt={`QR Code ${qrCode.code}`}
              width={120}
              height={140}
              className="rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsModalOpen(true)}
              title="Klik untuk memperbesar QR Code"
            />
          </div>
          {/* QR code is now clean and simple */}
        </div>
      
      <div className="space-y-3">
        {/* QR Code */}
        <div className="text-center">
          <div className="font-mono text-lg font-semibold text-white mb-2">
            {qrCode.code}
          </div>
        </div>

        {/* Status */}
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

        {/* Locker Information */}
        {qrCode.isUsed && qrCode.lockerId ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <div className="text-center">
              <div className="text-xs text-green-300 font-medium mb-1">
                Terhubung dengan Loker
              </div>
              <div className="text-sm text-green-400 font-semibold break-words">
                {typeof qrCode.lockerId === 'object' ? qrCode.lockerId.label : String(qrCode.lockerId)}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/30 border border-gray-600/30 rounded-lg p-3">
            <div className="text-center">
              <div className="text-xs text-gray-400 font-medium">
                Belum terhubung dengan loker
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Scan QR code ini untuk membuat loker baru
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Modal using portal to render outside of any container */}
      {isMounted && isModalOpen && createPortal(<QRModal />, document.body)}
    </>
  );
}
