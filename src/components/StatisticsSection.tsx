'use client';

import { Container, Package, Tag, QrCode } from 'lucide-react';
import { CounterAnimation } from './CounterAnimation';

interface Locker {
  _id: string;
  code: string;
  label: string;
  description?: string;
  qrCode: string;
  createdAt: string;
}

interface Item {
  _id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  lockerId: string | { _id: string; code: string; label: string };
  createdAt: string;
}

interface StatisticsSectionProps {
  lockers: Locker[];
  items: Item[];
  getItemsForLocker: (lockerId: string) => Item[];
}

export function StatisticsSection({ lockers, items, getItemsForLocker }: StatisticsSectionProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8">
      <div className="dark-stat qr-card-stroke transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
          <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
            <Container className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Loker</p>
            <CounterAnimation 
              end={lockers.length} 
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
            />
          </div>
        </div>
      </div>
      
      <div className="dark-stat qr-card-stroke transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
          <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Total Barang</p>
            <CounterAnimation 
              end={items.reduce((total, item) => total + item.quantity, 0)} 
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
            />
          </div>
        </div>
      </div>
      
      <div className="dark-stat qr-card-stroke transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
          <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
            <Tag className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 animate-ping-slow" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Jenis Barang</p>
            <CounterAnimation 
              end={items.length} 
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
            />
          </div>
        </div>
      </div>
      
      <div className="dark-stat qr-card-stroke transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
          <div className="dark-icon animate-pulse mb-2 sm:mb-0 sm:mr-3">
            <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 animate-float" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Loker Terisi</p>
            <CounterAnimation 
              end={lockers.filter(locker => getItemsForLocker(locker._id).length > 0).length} 
              className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
