import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Smile, Frown, Meh, Star, CheckCircle2 } from 'lucide-react';
import { diaryApi } from '../services/api';

const STORAGE_KEY = 'diary-entries';

interface DiaryData {
  id: number;
  date: string;
  weather: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired';
  content: string;
  activities?: string[];
}

interface PageResponse {
  records: DiaryData[];
  total: number;
  size: number;
  current: number;
  orders: any[];
}

interface DiaryResponse {
  weather: string;
  mood: string;
  content: string;
  date: string;
  id: number;
}

export const DiaryView: React.FC = () => {
  const [diaries, setDiaries] = useState<DiaryData[]>(() => {
    // Load diaries from localStorage on initial render
    const savedDiaries = localStorage.getItem(STORAGE_KEY);
    return savedDiaries ? JSON.parse(savedDiaries) : [];
  });
  const [selectedWeather, setSelectedWeather] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [content, setContent] = useState('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyDiaries, setHistoryDiaries] = useState<DiaryData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Save diaries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
  }, [diaries]);

  // Load today's diary if it exists
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const todayDiary = diaries.find(diary => diary.date === today);
    
    if (todayDiary) {
      setSelectedWeather(todayDiary.weather);
      setSelectedMood(todayDiary.mood.charAt(0).toUpperCase() + todayDiary.mood.slice(1));
      setContent(todayDiary.content);
    }
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // 获取今天的日记
        const today = new Date().toISOString().split('T')[0];
        const todayResponse = await diaryApi.getAllDiaries(today) as { data: DiaryResponse };
        const todayDiary = todayResponse.data;
        // 设置今天的日记内容
        setSelectedWeather(todayDiary.weather || '');
        setSelectedMood(todayDiary.mood ? todayDiary.mood.charAt(0).toUpperCase() + todayDiary.mood.slice(1) : '');
        setContent(todayDiary.content || '');
        // 获取历史日记
        await fetchHistoryDiaries(1);
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize data:', err);
        setError('Failed to load diary data');
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      const response = await diaryApi.getAllDiaries(today) as { data: DiaryResponse };
      console.log('API Response:', response);
      setDiaries([response.data] as DiaryData[]);
    } catch (err: any) {
      console.error('Error details:', err);
      setError(err.message || 'Failed to fetch diaries');
    } finally {
      setLoading(false);
    }
  };

  const createDiary = async (diaryData: any) => {
    try {
      await diaryApi.createDiary(diaryData);
      fetchDiaries(); // 重新获取列表
    } catch (err) {
      console.error('Failed to create diary:', err);
    }
  };

  const handleSaveDiary = async () => {
    if (!selectedWeather || !selectedMood || !content.trim()) {
      alert('Please fill in all fields before saving');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const diaryData = {
        content: content.trim(),
        date: today,
        mood: selectedMood.toLowerCase() as 'happy' | 'neutral' | 'sad' | 'excited' | 'tired',
        weather: selectedWeather
      };

      // 调用后端 API 保存日记
      const saveResponse = await diaryApi.createDiary(diaryData);
      console.log('Save response:', saveResponse);
      
      if (saveResponse.data) {
        setNotification({
          message: "no matter how today goes, remember to love myself!",
          type: 'success'
        });

        // 等待一小段时间确保后端数据已更新
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          // 重新获取今天的日记
          const todayResponse = await diaryApi.getAllDiaries(today) as { data: DiaryResponse };
          if (todayResponse.data) {
            const todayDiary = todayResponse.data as DiaryResponse;
            // 更新表单内容
            setSelectedWeather(todayDiary.weather || '');
            setSelectedMood(todayDiary.mood ? todayDiary.mood.charAt(0).toUpperCase() + todayDiary.mood.slice(1) : '');
            setContent(todayDiary.content || '');
          }

          // 重新获取历史日记列表
          await fetchHistoryDiaries(1);
        } catch (refreshErr) {
          console.error('Failed to refresh data:', refreshErr);
          setError('Failed to refresh diary data');
        }
      } else {
        setError('Failed to save diary. No response from server.');
      }

    } catch (err) {
      console.error('Failed to save diary:', err);
      setError('Failed to save diary. Please try again.');
    }
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'Sunny': return Sun;
      case 'Cloudy': return Cloud;
      case 'Rainy': return CloudRain;
      default: return Sun;
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'happy': return Smile;
      case 'neutral': return Meh;
      case 'sad': return Frown;
      case 'excited': return Star;
      default: return Meh;
    }
  };

  // 渲染日记编辑表单
  const renderDiaryForm = () => {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Today's Diary</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Weather</label>
            <div className="flex gap-2">
              {[
                { icon: Sun, label: 'Sunny' },
                { icon: Cloud, label: 'Cloudy' },
                { icon: CloudRain, label: 'Rainy' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => setSelectedWeather(label)}
                  className={`p-2 rounded-full transition-colors ${
                    selectedWeather === label
                      ? 'bg-blue-100 text-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Mood</label>
            <div className="flex gap-2">
              {[
                { icon: Smile, label: 'Happy' },
                { icon: Meh, label: 'Neutral' },
                { icon: Frown, label: 'Sad' },
                { icon: Star, label: 'Excited' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => setSelectedMood(label)}
                  className={`p-2 rounded-full transition-colors ${
                    selectedMood === label
                      ? 'bg-blue-100 text-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              What happened today?
            </label>
            <textarea
              className="w-full p-2 border rounded-lg"
              rows={4}
              placeholder="Write about your day..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSaveDiary}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Diary
          </button>
        </div>
      </div>
    );
  };

  // 修改 fetchHistoryDiaries 函数
  const fetchHistoryDiaries = async (page: number) => {
    try {
      setLoadingHistory(true);
      const response = await diaryApi.getDiaryHistory(page);
      console.log('History API Response:', response);
      
      if (response.data) {
        const pageData = response.data as PageResponse;
        setHistoryDiaries(pageData.records || []);
        setTotalPages(Math.ceil(pageData.total / pageData.size));
        setCurrentPage(pageData.current);
      } else {
        setHistoryDiaries([]);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setHistoryDiaries([]);
      setTotalPages(0);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 修改 renderHistoryTimeline 函数
  const renderHistoryTimeline = () => {
    if (loadingHistory) {
      return <div className="text-center py-4">Loading history...</div>;
    }

    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-6">My Diary Book</h3>
        {(!historyDiaries || historyDiaries.length === 0) ? (
          <p className="text-center text-gray-500">No history records found.</p>
        ) : (
          <div className="relative">
            {/* 日记本展示区域 */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6 px-4 min-w-max">
                {historyDiaries.map((diary, index) => {
                  const WeatherIcon = diary.weather ? getWeatherIcon(diary.weather) : null;
                  const MoodIcon = diary.mood ? getMoodIcon(diary.mood) : null;

                  return (
                    <div 
                      key={diary.id}
                      className="relative w-80 bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105"
                      style={{
                        backgroundImage: `linear-gradient(to bottom, #EFF6FF 0%, #ffffff 100%)`,
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      {/* 日记本顶部装饰 */}
                      <div className="h-2 bg-blue-500"></div>
                      
                      <div className="p-6">
                        {/* 日期和图标 */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm text-gray-600">
                            {new Date(diary.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            {WeatherIcon && (
                              <div className="flex items-center">
                                <WeatherIcon className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                            {MoodIcon && (
                              <div className="flex items-center">
                                <MoodIcon className="w-5 h-5 text-gray-600" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 日记内容 */}
                        <div 
                          className="text-gray-700 whitespace-pre-wrap"
                          style={{
                            fontFamily: "'Segoe UI', serif",
                            lineHeight: '1.8',
                            minHeight: '150px',
                            background: 'repeating-linear-gradient(transparent, transparent 27px, #E5E7EB 28px)',
                            backgroundPosition: '0 5px',
                            paddingTop: '2px'
                          }}
                        >
                          {diary.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                {/* ... 分页按钮保持不变 ... */}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => fetchDiaries()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading diaries...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Notification */}
      <div
        className={`fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center transition-transform duration-300 ${
          notification ? 'translate-x-0' : 'translate-x-[150%]'
        }`}
        role="alert"
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        <span className="font-medium">{notification?.message}</span>
      </div>

      {/* 总是显示编辑表单 */}
      {renderDiaryForm()}

      {/* 历史日记时间轴 */}
      {!loading && renderHistoryTimeline()}
    </div>
  );
}