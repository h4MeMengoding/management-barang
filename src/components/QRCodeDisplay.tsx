'use client';

import Image from 'next/image';

interface QRCode {
  _id: string;
  code: string;
  qrCode: string;
  isUsed: boolean;
  lockerId?: string;
  createdAt: string;
}

interface QRCodeDisplayProps {
  qrCode: QRCode;
  showDetails: boolean;
  printMode: boolean;
}

export default function QRCodeDisplay({ qrCode, showDetails, printMode }: QRCodeDisplayProps) {
  if (printMode) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 text-center bg-white">
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
    <div className={`border rounded-lg p-4 ${
      qrCode.isUsed 
        ? 'border-green-300 bg-green-50' 
        : 'border-gray-300 bg-white'
    }`}>
      <div className="text-center mb-3">
        <Image
          src={qrCode.qrCode}
          alt={`QR Code ${qrCode.code}`}
          width={100}
          height={100}
          className="mx-auto"
        />
      </div>
      
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-semibold">Kode:</span> 
          <span className="font-mono ml-1">{qrCode.code}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            qrCode.isUsed ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          <span className="text-sm">
            {qrCode.isUsed ? 'Sudah Digunakan' : 'Belum Digunakan'}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="text-xs text-gray-600">
              Dibuat: {new Date(qrCode.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            {qrCode.lockerId && (
              <div className="text-xs text-green-600">
                Terhubung dengan Loker: {qrCode.lockerId}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
