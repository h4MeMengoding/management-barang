'use client';

import { Search } from 'lucide-react';

interface LockerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export function LockerSearch({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Cari loker..." 
}: LockerSearchProps) {
  return (
    <div className="mb-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 dark-input text-gray-200 placeholder-gray-500"
        />
      </div>
    </div>
  );
}
