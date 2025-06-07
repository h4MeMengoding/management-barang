'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tag, Save, Edit2, Trash2, Package, ArrowLeft, Plus, Eye, MapPin } from 'lucide-react';
import { showSuccess, showError, showCustomConfirm } from '@/lib/alerts';
import Link from 'next/link';

interface CategoryWithCount {
  name: string;
  itemCount: number;
}

interface Item {
  _id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  lockerId: {
    _id: string;
    code: string;
    label: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }
    
    fetchCategories();
  }, [session, status, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const categoriesData = await response.json();
      
      // Fetch item count for each category
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (category: string) => {
          const itemsResponse = await fetch(`/api/items?category=${encodeURIComponent(category)}`);
          const items = itemsResponse.ok ? await itemsResponse.json() : [];
          return {
            name: category,
            itemCount: items.length
          };
        })
      );
      
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryItems = async (categoryName: string) => {
    try {
      setLoadingItems(true);
      const response = await fetch(`/api/items?category=${encodeURIComponent(categoryName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const items = await response.json();
      setCategoryItems(items);
    } catch (error) {
      console.error('Error fetching category items:', error);
      showError('Gagal memuat barang kategori');
      setCategoryItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCategoryClick = async (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setCategoryItems([]);
    } else {
      setSelectedCategory(categoryName);
      await fetchCategoryItems(categoryName);
    }
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      showError('Nama kategori tidak boleh kosong');
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      showError('Kategori sudah ada');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to add category');
      }

      setNewCategoryName('');
      fetchCategories();
      showSuccess('Kategori berhasil ditambahkan');
    } catch (error) {
      console.error('Error adding category:', error);
      showError('Gagal menambahkan kategori');
    }
  };

  const updateCategory = async (oldName: string, newName: string) => {
    if (!newName.trim()) {
      showError('Nama kategori tidak boleh kosong');
      return;
    }

    if (oldName === newName.trim()) {
      setEditingCategory(null);
      return;
    }

    // Check if new category name already exists
    if (categories.some(cat => cat.name.toLowerCase() === newName.trim().toLowerCase() && cat.name !== oldName)) {
      showError('Kategori sudah ada');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldName, newName: newName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      setEditingCategory(null);
      fetchCategories();
      showSuccess('Kategori berhasil diperbarui');
    } catch (error) {
      console.error('Error updating category:', error);
      showError('Gagal memperbarui kategori');
    }
  };

  const deleteCategory = async (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    
    if (category && category.itemCount > 0) {
      showError('Tidak dapat menghapus kategori yang masih memiliki item');
      return;
    }

    showCustomConfirm(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus kategori "${categoryName}"?`,
      'Hapus',
      async () => {
        try {
          const response = await fetch('/api/categories', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: categoryName }),
          });

          if (!response.ok) {
            throw new Error('Failed to delete category');
          }

          fetchCategories();
          showSuccess('Kategori berhasil dihapus');
        } catch (error) {
          console.error('Error deleting category:', error);
          showError('Gagal menghapus kategori');
        }
      },
      'danger'
    );
  };

  const startEditing = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditingName(categoryName);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingName('');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen dark-theme pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen dark-theme pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors duration-200 flex-shrink-0"
            >
              <ArrowLeft size={20} className="text-slate-300" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-3">
                <Tag size={24} className="sm:w-7 sm:h-7 text-blue-500 flex-shrink-0" />
                <span>Kategori</span>
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">Kelola kategori item Anda.</p>
              <p className="text-slate-400 text-xs sm:text-sm sm:hidden">Klik kategori untuk melihat barang-barangnya.</p>
            </div>
          </div>
        </div>

        {/* Add New Category */}
        <div className="bg-slate-800/50 rounded-lg p-4 sm:p-6 mb-8 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Tambah Kategori Baru</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori"
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCategory();
                }
              }}
            />
            <button
              onClick={addCategory}
              className="px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-medium min-h-[44px] flex-shrink-0"
            >
              <Plus size={16} />
              <span className="whitespace-nowrap">Tambah</span>
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Daftar Kategori</h2>
          </div>
          
          {categories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Tag size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Belum ada kategori</p>
              <p className="text-slate-500 text-sm">Tambahkan kategori pertama Anda di atas</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {categories.map((category) => (
                <div key={category.name}>
                  <div className="px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div 
                      className="flex items-center space-x-3 sm:space-x-4 flex-1 cursor-pointer hover:bg-slate-700/30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 rounded-lg transition-colors duration-200 min-w-0"
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Tag size={16} className="sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingCategory === category.name ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-base sm:text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateCategory(category.name, editingName);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <>
                            <h3 className="text-base sm:text-lg font-medium text-white flex items-center space-x-2 truncate">
                              <span className="truncate">{category.name}</span>
                              {selectedCategory === category.name && (
                                <Eye size={14} className="sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                              )}
                            </h3>
                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-400">
                              <Package size={12} className="flex-shrink-0" />
                              <span>{category.itemCount} item</span>
                              {category.itemCount > 0 && (
                                <span className="text-blue-400 hidden sm:inline">• Klik untuk melihat barang</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {editingCategory === category.name ? (
                        <>
                          <button
                            onClick={() => updateCategory(category.name, editingName)}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Simpan"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Batal"
                          >
                            <ArrowLeft size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(category.name);
                            }}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCategory(category.name);
                            }}
                            disabled={category.itemCount > 0}
                            className={`p-2 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                              category.itemCount > 0
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                            title={category.itemCount > 0 ? 'Tidak dapat menghapus kategori yang masih memiliki item' : 'Hapus'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Items List for Selected Category */}
                  {selectedCategory === category.name && (
                    <div className="px-4 sm:px-6 pb-4">
                      <div className="bg-slate-900/50 rounded-lg border border-slate-600/50 overflow-hidden">
                        <div className="px-3 sm:px-4 py-3 bg-slate-700/30 border-b border-slate-600/50">
                          <h4 className="text-xs sm:text-sm font-medium text-slate-300 flex items-center space-x-2">
                            <Package size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span className="truncate">Barang dalam kategori &quot;{category.name}&quot;</span>
                          </h4>
                        </div>
                        
                        {loadingItems ? (
                          <div className="p-6 sm:p-8 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-3"></div>
                            <p className="text-slate-400 text-sm">Memuat barang...</p>
                          </div>
                        ) : categoryItems.length === 0 ? (
                          <div className="p-6 sm:p-8 text-center">
                            <Package size={28} className="sm:w-8 sm:h-8 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm sm:text-base">Tidak ada barang dalam kategori ini</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-600/30">
                            {categoryItems.map((item) => (
                              <div key={item._id} className="p-3 sm:p-4 hover:bg-slate-800/30 transition-colors duration-200">
                                <div className="flex items-start sm:items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-white mb-1 text-sm sm:text-base truncate">{item.name}</h5>
                                    {item.description && (
                                      <p className="text-xs sm:text-sm text-slate-400 mb-2 line-clamp-2">{item.description}</p>
                                    )}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-slate-400">
                                      <span>Jumlah: {item.quantity}</span>
                                      <div className="flex items-center space-x-1">
                                        <MapPin size={10} className="sm:w-3 sm:h-3 flex-shrink-0" />
                                        <span className="truncate">{item.lockerId.code} - {item.lockerId.label}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                                    <Link
                                      href={`/items/${item._id}/edit`}
                                      className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                      title="Edit barang"
                                    >
                                      <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                    </Link>
                                    <Link
                                      href={`/lockers/${item.lockerId._id}`}
                                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                      title="Lihat loker"
                                    >
                                      <Eye size={12} className="sm:w-3.5 sm:h-3.5" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
