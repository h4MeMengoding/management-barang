'use client';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center dark-theme">
      <div className="dark-card p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-400 text-center">Memuat...</p>
      </div>
    </div>
  );
}

export function DataLoadingSpinner() {
  return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-400">Memuat data...</p>
    </div>
  );
}
