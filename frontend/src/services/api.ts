import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { ClothingItem, Goal } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Success Response:', response);
    return response;
  },
  (error) => {
    console.error('API Error Response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        params: error.config?.params,
      }
    });
    return Promise.reject(handleApiError(error));
  }
);

// 添加请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Diary 相关接口
export const diaryApi = {
  getAllDiaries: (date: string) => apiClient.get('/api/diary', { params: { date } }),
  getDiaryById: (id: number) => apiClient.get(`/api/diary/${id}`),
  createDiary: (data: any) => apiClient.post('/api/diary/save', data),
  updateDiary: (id: number, data: any) => apiClient.put(`/api/diary/${id}`, data),
  deleteDiary: (id: number) => apiClient.delete(`/api/diary/${id}`),
  getDiaryHistory: (pageNum: number = 1, pageSize: number = 10) => 
    apiClient.get('/api/diary/list', { 
      params: { 
        pageNum, 
        pageSize 
      } 
    }),
};

// Closet 相关接口
export const closetApi = {
  getAllClothes: () => apiClient.get('/api/closet'),
  getClothById: (id: number) => apiClient.get(`/api/closet/${id}`),
  createCloth: (data: Omit<ClothingItem, 'id'>) => apiClient.post('/api/closet', data),
  updateCloth: (id: number, data: Partial<ClothingItem>) => apiClient.put(`/api/closet/${id}`, data),
  deleteCloth: (id: number) => apiClient.delete(`/api/closet/${id}`),
  getOutfitRecommendation: () => apiClient.get('/api/closet/outfit-recommendation'),
};

// Goals 相关接口
export interface GoalResponse {
  pages: number;
  records: never[];
  content: Goal[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const goalsApi = {
  getGoals: (page = 0, size = 10) => 
    apiClient.get<GoalResponse>(`/api/goals?page=${page}&size=${size}`),
  
  createGoal: (goal: Omit<Goal, 'id'>) => 
    apiClient.post<Goal>('/api/goals', goal),
  
  getGoal: (id: number) => 
    apiClient.get<Goal>(`/api/goals/${id}`),
  
  updateGoal: (id: number, goal: Partial<Goal>) => 
    apiClient.put<Goal>(`/api/goals/${id}`, goal),
  
  deleteGoal: (id: number) => 
    apiClient.delete(`/api/goals/${id}`),
  
  generatePlan: (id: number) => 
    apiClient.post<Goal>(`/api/goals/plan?id=${id}`)
};

// 添加文件相关接口
export const fileApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/oss/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getFile: (id: string) => apiClient.get(`/api/oss/${id}`),
}; 