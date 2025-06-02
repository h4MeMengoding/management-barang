'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tag, Save, Edit2, Trash2, Package, ArrowLeft, Plus } from 'lucide-react';
import { showSuccess, showError, showCustomConfirm } from '@/lib/alerts';
import Link from 'next/link';

interface CategoryWithCount {
  name: string;
  itemCount: number;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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
      <div className="min-h-screen bg-slate-900 pt-20">
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
    <div className="min-h-screen bg-slate-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft size={20} className="text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
                <Tag size={28} className="text-blue-500" />
                <span>Kategori</span>
              </h1>
              <p className="text-slate-400 mt-1">Kelola kategori item Anda</p>
            </div>
          </div>
        </div>

        {/* Add New Category */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Tambah Kategori Baru</h2>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nama kategori"
              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addCategory();
                }
              }}
            />
            <button
              onClick={addCategory}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Tambah</span>
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
                <div key={category.name} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Tag size={20} className="text-blue-400" />
                    </div>
                    <div>
                      {editingCategory === category.name ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCategory(category.name, editingName);
                            } else if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <h3 className="text-lg font-medium text-white">{category.name}</h3>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Package size={14} />
                        <span>{category.itemCount} item</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {editingCategory === category.name ? (
                      <>
                        <button
                          onClick={() => updateCategory(category.name, editingName)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                          title="Simpan"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors duration-200"
                          title="Batal"
                        >
                          <ArrowLeft size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(category.name)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.name)}
                          disabled={category.itemCount > 0}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
