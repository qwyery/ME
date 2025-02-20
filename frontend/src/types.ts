export interface DiaryEntry {
  id: string;
  date: string;
  weather: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired';
  content: string;
  activities: string[];
}

export interface ClothingItem {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  description?: string;
  season: string[];
}

export interface Goal {
  endDate: string | number | Date;
  startDate: string | number | Date;
  type: string;
  status: string;
  id: number;
  title: string;
  category: string;
  progress: number;
  plan?: string[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

