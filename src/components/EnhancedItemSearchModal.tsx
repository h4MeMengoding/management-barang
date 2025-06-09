'use client';

import { useState } from 'react';
import { Search, Package, X, MapPin, Edit2, Eye } from 'lucide-react';
import Link from 'next/link';
import { Item } from '@/types';

interface ItemSearchModalProps {
  items: Item[];
  isOpen: boolean;
  onClose: () => void;
  getLockerInfo: (lockerId: string | { _id: string; code: string; label: string }) => any;
}

export function EnhancedItemSearchModal({ items, isOpen, onClose, getLockerInfo }: ItemSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchItems = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredItems);
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    searchItems(query);
  };

  const handleClose = () => {
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="dark-card max-w-4xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-600/50">
          <h2 className="text-lg sm:text-xl font-bold text-gray-100">Pencarian Barang</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-200 dark-button transition-all duration-200 transform active:scale-95"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari nama barang, deskripsi, atau kategori..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 dark-input text-gray-200 placeholder-gray-500"
              autoFocus
            />
          </div>

          <div className="max-h-80 sm:max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Mencari barang...</p>
              </div>
            ) : searchTerm && searchResults.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-200 mb-2">Barang tidak ditemukan</h3>
                <p className="text-gray-400">Tidak ada barang yang sesuai dengan pencarian &ldquo;{searchTerm}&rdquo;</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400 mb-4">
                  Ditemukan {searchResults.reduce((total, item) => total + item.quantity, 0)} barang ({searchResults.length} jenis)
                </p>
                {searchResults.map((item) => {
                  const lockerInfo = getLockerInfo(item.lockerId);
                  return (
                    <div key={item._id} className="dark-card p-3 sm:p-4 hover:bg-slate-700/50 transition-all duration-200">
                      <div className="flex flex-col gap-3">
                        {/* Item Header - Name with Quantity */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-100 break-words">
                              {item.name} ({item.quantity})
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded-full border border-blue-500/30">
                                {item.category}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-gray-400 text-sm mt-2 break-words line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Locker Information */}
                        {lockerInfo && (
                          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div className="dark-icon p-1.5 flex-shrink-0">
                                  <MapPin className="h-3 w-3 text-green-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-200 truncate">
                                    {lockerInfo.label} • {lockerInfo.code}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Link
                                  href={`/items/${item._id}/edit`}
                                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
                                >
                                  <Edit2 size={12} />
                                  <span>Edit Barang</span>
                                </Link>
                                <Link
                                  href={`/lockers/${lockerInfo._id}`}
                                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
                                >
                                  <Eye size={12} />
                                  <span>Lihat Loker</span>
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-200 mb-2">Mulai Pencarian</h3>
                <p className="text-gray-400">Ketik nama barang, deskripsi, atau kategori untuk mencari</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
