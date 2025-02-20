import React, { useState } from 'react';
import type { Goal } from '../types';

interface GoalModalProps {
  goal?: Goal;
  onClose: () => void;
  onSubmit: (goal: Omit<Goal, 'id'>) => void;
}

export function GoalModal({ goal, onClose, onSubmit }: GoalModalProps) {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    type: goal?.type || 'CAREER',
    status: goal?.status || '0',
    startDate: goal?.startDate || '',
    endDate: goal?.endDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      category: formData.type,
      progress: parseInt(formData.status) || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">
          {goal ? '编辑目标' : '添加新目标'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">类别</label>
            <select
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full border rounded p-2"
              required
            >
              <option value="CAREER">职业发展</option>
              <option value="PERSONAL">个人成长</option>
              <option value="FINANCIAL">财务目标</option>
              <option value="HEALTH">健康</option>
              <option value="OTHER">其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 