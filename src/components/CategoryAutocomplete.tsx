'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface CategoryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function CategoryAutocomplete({
  value,
  onChange,
  placeholder = "Ketik atau pilih kategori",
  required = false,
  className = ""
}: CategoryAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on input value
    if (value.trim()) {
      const filtered = categories.filter(category =>
        category.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [value, categories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setFilteredCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleCategorySelect = async (category: string) => {
    // If this is a new category, save it to database
    if (!categories.includes(category) && category.trim()) {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: category.trim() }),
        });
        
        if (response.ok) {
          // Add to local categories list
          setCategories(prev => [...prev, category.trim()].sort());
        }
      } catch (error) {
        console.error('Error saving new category:', error);
        // Still allow the category to be used even if saving fails
      }
    }
    
    onChange(category);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's a matching category, select it
      if (filteredCategories.length > 0 && filteredCategories[0].toLowerCase() === value.toLowerCase()) {
        handleCategorySelect(filteredCategories[0]);
      } else {
        // Use the typed value as new category
        setIsOpen(false);
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && filteredCategories.length > 0) {
      e.preventDefault();
      // Focus first item in dropdown (could be enhanced with keyboard navigation)
    }
  };

  const clearInput = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          required={required}
          className={`w-full pr-20 ${className}`}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value && (
            <button
              type="button"
              onClick={clearInput}
              className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
              title="Hapus"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
            title="Lihat kategori"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Memuat kategori...
            </div>
          ) : filteredCategories.length > 0 ? (
            <>
              {/* Show existing categories */}
              {filteredCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className="w-full text-left px-4 py-2 text-gray-200 hover:bg-slate-700 transition-colors duration-200 border-b border-slate-700/50 last:border-b-0"
                >
                  {category}
                </button>
              ))}
              
              {/* Show "add new category" option if input doesn't match any existing category */}
              {value.trim() && !filteredCategories.some(cat => cat.toLowerCase() === value.toLowerCase()) && (
                <button
                  type="button"
                  onClick={() => handleCategorySelect(value.trim())}
                  className="w-full text-left px-4 py-2 text-green-400 hover:bg-green-900/20 transition-colors duration-200 border-t border-slate-600"
                >
                  <span className="font-medium">+ Tambah kategori baru:</span> &ldquo;{value.trim()}&rdquo;
                </button>
              )}
            </>
          ) : value.trim() ? (
            <button
              type="button"
              onClick={() => handleCategorySelect(value.trim())}
              className="w-full text-left px-4 py-2 text-green-400 hover:bg-green-900/20 transition-colors duration-200"
            >
              <span className="font-medium">+ Tambah kategori baru:</span> &ldquo;{value.trim()}&rdquo;
            </button>
          ) : (
            <div className="p-4 text-center text-gray-400">
              Belum ada kategori. Ketik untuk menambah kategori baru.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
