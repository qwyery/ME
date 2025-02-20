import React, { useState, useEffect } from 'react';
import { Plus, Sun, Cloud, Droplets, Edit2, Trash2 } from 'lucide-react';
import type { ClothingItem } from '../types';
import { ImageUpload } from './ImageUpload';
import { closetApi, fileApi } from '../services/api';

// 添加默认图片常量
const DEFAULT_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';

// 添加 API_BASE_URL 常量
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  data: {
    ossId?: string;
    records?: T[];
    content?: T[];
  } | T;
  status: number;
  message?: string;
}

export interface UploadResponse {
  data: {
    ossId: string;
  };
}

const OutfitSuggestion: React.FC = () => {
  const [outfits, setOutfits] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        setLoading(true);
        const response = await closetApi.getOutfitRecommendation();
        const responseData = response.data;
        console.log('Raw API response:', responseData);
        setOutfits((responseData as ClothingItem[][]).flat());
      } catch (error) {
        console.error('Error fetching outfit recommendation:', error);
        setError('Failed to load outfit suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchOutfits();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading suggestions...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {outfits.length > 0 ? (
        outfits.map((outfit, index) => (
          <div key={outfit.id || index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={outfit.imageUrl.startsWith('http') ? outfit.imageUrl : `${API_BASE_URL}${outfit.imageUrl}`}
              alt={`${outfit.name} suggestion`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
              {outfit.name || 'Suggested Item'}
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-2 text-center text-gray-500 py-8">
          No outfit suggestions available
        </div>
      )}
    </div>
  );
};

export const ClosetView: React.FC = () => {
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    season: [] as string[],
  });
  const [currentClothId, setCurrentClothId] = useState<number | null>(null);


  // 获取衣物列表
  const fetchClothes = async () => {
    try {
      setLoading(true);
      const response = await closetApi.getAllClothes() as ApiResponse<ClothingItem[]>;
      if (!response || !response.data) {
        throw new Error('Invalid response format');
      }
  
      const clothesData = Array.isArray(response.data) 
        ? response.data 
        : response.data.records || response.data.content || [];
      
      const flattenedClothesData = clothesData.flat();
      setClothes(flattenedClothesData);
    } catch (err: any) {
      console.error('Failed to fetch clothes:', err);
      setError(err.message || 'Failed to load clothes');
    } finally {
      setLoading(false);
    }
  };

  // 添加错误处理
  useEffect(() => {
    const init = async () => {
      try {
        console.log('Initializing ClosetView');
        await fetchClothes();
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Error in ClosetView initialization:', error);
        setError(error.message || 'Failed to initialize closet view');
      }
    };

    init();
  }, []);

  // 添加调试渲染
  console.log('ClosetView render state:', {
    loading,
    error,
    clothesCount: clothes.length,
    showForm,
    showEditForm
  });

  // 添加 season 选项
  const seasonOptions = [
    { value: 'Spring', label: 'Spring' },
    { value: 'Summer', label: 'Summer' },
    { value: 'Fall', label: 'Fall' },
    { value: 'Winter', label: 'Winter' },
  ];

  // 处理 season 选择
  const handleSeasonChange = (seasonValue: string) => {
    setFormData(prev => {
      const currentSeasons = prev.season;
      if (currentSeasons.includes(seasonValue)) {
        return {
          ...prev,
          season: currentSeasons.filter(s => s !== seasonValue)
        };
      } else {
        return {
          ...prev,
          season: [...currentSeasons, seasonValue]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = selectedImage || '';
      
      // 如果选择了图片，先上传图片
      if (selectedImage.startsWith('blob:')) {
        try {
          const response = await fetch(selectedImage);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: blob.type });
          const uploadResponse = await fileApi.uploadFile(file);
          const data = uploadResponse.data as { ossId: string };
          imageUrl = `${API_BASE_URL}/api/oss/${data.ossId}`;
        } catch (err: unknown) {
          const error = err as Error;
          console.error('Failed to save clothing:', error);
          setError('Failed to save clothing item');
        }
      }

      const clothingData: Omit<ClothingItem, 'id'> = {
        name: formData.name,
        category: formData.category,
        imageUrl: imageUrl,
        description: formData.description || undefined,
        season: formData.season,
      };

      await closetApi.createCloth(clothingData);
      setShowForm(false);
      setFormData({ name: '', category: '', description: '', season: [] });
      setSelectedImage('');
      fetchClothes();
    } catch (err) {
      console.error('Failed to save clothing:', err);
      setError('Failed to save clothing item');
    }
  };

  // 在打开新增衣物弹窗时重置表单数据
  const openAddItemForm = () => {
    setFormData({ name: '', category: '', description: '', season: [] }); // 重置表单数据
    setSelectedImage(''); // 清空图片选择
    setShowForm(true); // 显示新增衣物表单
  };

  const handleEditCloth = (item: ClothingItem) => {
    setCurrentClothId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      season: item.season || [],
    });
    setSelectedImage(item.imageUrl);
    setShowEditForm(true);
  };

  const handleUpdateCloth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = selectedImage;

      if (selectedImage.startsWith('blob:')) {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        const uploadResponse = await fileApi.uploadFile(file) as ApiResponse<{ ossId: string }>;
        imageUrl = `${API_BASE_URL}/api/oss/${uploadResponse.data.ossId}`;
      }

      if (!currentClothId) {
        throw new Error('No clothing item ID found');
      }

      const clothingData: Partial<ClothingItem> = {
        id: currentClothId,
        name: formData.name,
        category: formData.category,
        imageUrl: imageUrl,
        description: formData.description || undefined,
        season: formData.season,
      };

      await closetApi.updateCloth(currentClothId, clothingData);
      setShowEditForm(false);
      fetchClothes();
    } catch (err) {
      console.error('Failed to update clothing:', err);
      setError('Failed to update clothing item');
    }
  };

  // 添加删除衣物的处理函数
  const handleDeleteCloth = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await closetApi.deleteCloth(id);
        // 删除成功后重新获取列表
        await fetchClothes();
      } catch (err: any) {
        console.error('Failed to delete item:', err);
      setError(err.message || 'Failed to delete clothing item');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading closet...</p>
        <p className="text-sm text-gray-500">Debug info: Initial load</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error: {error}</p>
        <p className="text-sm">Debug info: Error occurred</p>
        <button
          onClick={fetchClothes}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 修改建议展示区域的样式 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Today's Recommended Outfits</h3>
          <OutfitSuggestion />
        </div>
      </div>

      {/* 添加分隔线 */}
      <div className="border-b my-6"></div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Closet</h2>
        <button
          onClick={openAddItemForm}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-4">Add New Clothing Item</h3>
            <form onSubmit={handleSubmit}>
              <ImageUpload
                onImageSelect={setSelectedImage}
                currentImage={selectedImage}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select category</option>
                  <option value="tops">Tops</option>
                  <option value="bottoms">Bottoms</option>
                  <option value="dresses">Dresses</option>
                  <option value="outerwear">Outerwear</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Season</label>
                <div className="flex flex-wrap gap-2">
                  {seasonOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSeasonChange(value)}
                      className={`px-4 py-2 rounded-full border ${
                        formData.season.includes(value)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-xl font-semibold mb-4">Edit Clothing Item</h3>
            <form onSubmit={handleUpdateCloth}>
              <ImageUpload
                onImageSelect={setSelectedImage}
                currentImage={selectedImage}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select category</option>
                  <option value="tops">Tops</option>
                  <option value="bottoms">Bottoms</option>
                  <option value="dresses">Dresses</option>
                  <option value="outerwear">Outerwear</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Season</label>
                <div className="flex flex-wrap gap-2">
                  {seasonOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSeasonChange(value)}
                      className={`px-4 py-2 rounded-full border ${
                        formData.season.includes(value)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clothes.map((item) => (
          <div key={item.id || Math.random()} className="bg-white rounded-lg shadow overflow-hidden">
            {item.imageUrl ? (
              <div className="relative w-full h-64">
                <img
                  // 如果 imageUrl 不是完整的 URL，添加基础 URL
                  src={item.imageUrl.startsWith('http') ? item.imageUrl : `${API_BASE_URL}${item.imageUrl}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_IMAGE;
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                <img src={DEFAULT_IMAGE} alt="Placeholder" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg">{item.name || 'Unnamed Item'}</h3>
              <p className="text-sm text-gray-500 capitalize">
                {item.category || 'Uncategorized'}
              </p>
              {Array.isArray(item.season) && item.season.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.season.map(season => {
                    if (!season) return null;
                    return (
                      <span
                        key={season}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        {typeof season === 'string' 
                          ? season.charAt(0).toUpperCase() + season.slice(1)
                          : ''}
                      </span>
                    );
                  })}
                </div>
              )}
              {item.description && (
                <p className="mt-2 text-gray-600">{item.description}</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => handleEditCloth(item)} className="p-2 text-blue-500 hover:text-blue-600">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDeleteCloth(item.id)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};