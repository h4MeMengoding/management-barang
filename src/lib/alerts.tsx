import React from 'react';
import toast from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

// Success alerts
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    style: {
      background: '#10B981',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '8px',
      border: '1px solid #059669',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#10B981',
    },
  });
};

// Error alerts
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    style: {
      background: '#EF4444',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '8px',
      border: '1px solid #DC2626',
    },
    iconTheme: {
      primary: 'white',
      secondary: '#EF4444',
    },
  });
};

// Warning alerts
export const showWarning = (message: string) => {
  toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '8px',
      border: '1px solid #D97706',
    },
  });
};

// Info alerts
export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '8px',
      border: '1px solid #2563EB',
    },
  });
};

// Confirmation dialog
export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  confirmAlert({
    customUI: ({ onClose }) => {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700">
            <h2 className="text-xl font-bold text-gray-100 mb-4">{title}</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  if (onCancel) onCancel();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-gray-200 rounded-lg transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      );
    },
  });
};

// Confirmation dialog with custom actions
export const showCustomConfirm = (
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
  confirmStyle: 'danger' | 'primary' | 'success' = 'danger',
  onCancel?: () => void
) => {
  const confirmButtonStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    primary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700'
  };

  confirmAlert({
    customUI: ({ onClose }) => {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-700">
            <h2 className="text-xl font-bold text-gray-100 mb-4">{title}</h2>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  if (onCancel) onCancel();
                  onClose();
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-gray-200 rounded-lg transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 ${confirmButtonStyles[confirmStyle]} text-white rounded-lg transition-colors font-medium`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      );
    },
  });
};
