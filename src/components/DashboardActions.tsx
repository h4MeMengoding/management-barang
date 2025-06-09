'use client';

import Link from 'next/link';
import { Container, Package, Tag, QrCode, Search } from 'lucide-react';

interface DashboardActionsProps {
  onSearchClick: () => void;
}

export function DashboardActions({ onSearchClick }: DashboardActionsProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <Link
        href="/lockers/new"
        className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-blue-400 font-medium hover:text-blue-300 transition-all duration-200 text-sm sm:text-base"
      >
        <Container size={18} className="sm:w-5 sm:h-5" />
        <span>Tambah Loker</span>
      </Link>
      <Link
        href="/items/new"
        className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-green-400 font-medium hover:text-green-300 transition-all duration-200 text-sm sm:text-base"
      >
        <Package size={18} className="sm:w-5 sm:h-5" />
        <span>Tambah Barang</span>
      </Link>
      <Link
        href="/categories"
        className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-yellow-400 font-medium hover:text-yellow-300 transition-all duration-200 text-sm sm:text-base"
      >
        <Tag size={18} className="sm:w-5 sm:h-5" />
        <span>Kelola Kategori</span>
      </Link>
      <Link
        href="/qrcodes"
        className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-indigo-400 font-medium hover:text-indigo-300 transition-all duration-200 text-sm sm:text-base"
      >
        <QrCode size={18} className="sm:w-5 sm:h-5" />
        <span>Kelola QR Code</span>
      </Link>
      <Link
        href="/scan"
        className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-purple-400 font-medium hover:text-purple-300 transition-all duration-200 text-sm sm:text-base"
      >
        <QrCode size={18} className="sm:w-5 sm:h-5" />
        <span>Scan QR Code</span>
      </Link>
      <button
        onClick={onSearchClick}
        className="flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 dark-button text-orange-400 font-medium hover:text-orange-300 transition-all duration-200 text-sm sm:text-base transform active:scale-95"
      >
        <Search size={18} className="sm:w-5 sm:h-5" />
        <span>Cari Barang</span>
      </button>
    </div>
  );
}
