'use client';

import { signIn } from 'next-auth/react';
import { Package, QrCode } from 'lucide-react';
import { useButtonLoading } from '@/hooks/useButtonLoading';

export function LoginPage() {
  const { isLoading: isSigningIn, withLoading: withSignInLoading } = useButtonLoading();

  return (
    <div className="min-h-screen flex items-center justify-center dark-theme overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full dark-card opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full dark-card opacity-5"></div>
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full dark-card opacity-15"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full dark-card opacity-20"></div>
      </div>

      <div className="relative z-10 text-center dark-card p-12 max-w-md mx-4">
        {/* Logo/Icon */}
        <div className="dark-icon inline-flex mb-8 p-6">
          <Package className="h-16 w-16 text-blue-500" />
        </div>
        
        {/* Welcome Text */}
        <h1 className="text-4xl font-bold text-gray-100 mb-3">
          Management Barang
        </h1>
        <p className="text-lg text-gray-300 mb-2">
          Sistem Manajemen Barang Modern
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Kelola barang dengan mudah menggunakan teknologi QR Code
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="flex items-center space-x-3 text-left p-3 dark-card">
            <div className="dark-icon p-2">
              <QrCode className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-gray-200">QR Code Integration</p>
              <p className="text-sm text-gray-400">Scan untuk akses cepat</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-left p-3 dark-card">
            <div className="dark-icon p-2">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-gray-200">Smart Organization</p>
              <p className="text-sm text-gray-400">Atur barang dengan loker</p>
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={() => withSignInLoading(async () => {
            await signIn('google');
          })}
          disabled={isSigningIn}
          className="group relative w-full dark-button-primary p-4 text-white font-semibold text-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform duration-150 active:scale-95"
        >
          <div className="relative flex items-center justify-center space-x-3">
            {isSigningIn ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </div>
        </button>

        {/* Footer */}
        <p className="mt-6 text-xs text-gray-500">
          Secure • Fast • Modern
        </p>
      </div>
    </div>
  );
}
