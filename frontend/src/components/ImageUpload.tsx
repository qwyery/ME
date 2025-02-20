import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void;
  currentImage?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, currentImage }) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // 创建本地 URL
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      onImageSelect(imageUrl);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onImageSelect('');
  };

  return (
    <div className="w-full">
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Clothing preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>
      )}
    </div>
  );
}; 