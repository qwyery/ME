export interface Diary {
  id: number;
  content: string;
  createdAt: string;
  // 其他字段
}

export interface Cloth {
  id: number;
  name: string;
  category: string;
  // 其他字段
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  status: string;
  // 其他字段
} 