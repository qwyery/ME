import React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Edit2, Info } from 'lucide-react';
import type { Goal } from '../types';
import { goalsApi } from '../services/api';
import { Toast } from './Toast';

// 添加类型定义
interface PlanPhase {
  phase: string;
  period: string;
  days: string;
}

// 移动 parsePlan 函数到前面
const parsePlan = (plan: string[] | string | undefined): PlanPhase[] => {
  if (!plan) return [];
  
  console.log('Raw plan input:', plan);
  
  const planArray = Array.isArray(plan) ? plan : 
                   typeof plan === 'string' ? plan.split('\n') : [];
  
  console.log('Plan array:', planArray);
  
  const phases = planArray
    .filter(line => typeof line === 'string' && line.includes('####'))
    .map(line => {
      console.log('Processing line:', line);
      // 使用两个正则表达式匹配不同格式
      const match1 = line.match(/####\s+阶段[一二三四五六七八九十]+：(.*?)\（(.*?)，共?(\d+)天\）/);
      const match2 = line.match(/####\s+阶段[一二三四五六七八九十]+：(.*?)（(.*?)至(.*?)）/);
      
      if (match1) {
        return {
          phase: match1[1].trim(),
          period: match1[2],
          days: match1[3]
        };
      } else if (match2) {
        const start = new Date(match2[2]);
        const end = new Date(match2[3]);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          phase: match2[1].trim(),
          period: `${match2[2]}至${match2[3]}`,
          days: days.toString()
        };
      }
      
      console.log('No match for line:', line);
      return null;
    })
    .filter((item): item is PlanPhase => item !== null);
  
  console.log('Parsed phases:', phases);
  return phases;
};

// 时间轴事件类型定义
interface TimelineEvent {
  startDate: Date;
  endDate: Date;
  events: {
    goalTitle: string;
    phase: string;
  }[];
}

// 整合时间轴函数
const aggregateTimeline = (goals: Goal[]): TimelineEvent[] => {
  const timePoints: { date: Date; type: 'start' | 'end'; goalTitle: string; phase: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  goals.forEach(goal => {
    if (!goal.plan) return;
    
    const phases = parsePlan(goal.plan);
    phases.forEach((phase: PlanPhase) => {
      const [startDateStr, endDateStr] = phase.period.split('至');
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      // 设置时间为当天开始
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // 只添加今天及以后结束的时间段
      if (endDate >= today) {
        timePoints.push({
          date: startDate < today ? today : startDate,  // 如果开始日期在今天之前，使用今天作为开始日期
          type: 'start',
          goalTitle: goal.title,
          phase: phase.phase
        });
        timePoints.push({
          date: endDate,
          type: 'end',
          goalTitle: goal.title,
          phase: phase.phase
        });
      }
    });
  });
  
  // 按时间排序
  timePoints.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // 生成时间段
  const timeline: TimelineEvent[] = [];
  let currentEvents: { goalTitle: string; phase: string }[] = [];
  
  for (let i = 0; i < timePoints.length - 1; i++) {
    const currentPoint = timePoints[i];
    const nextPoint = timePoints[i + 1];
    
    if (currentPoint.type === 'start') {
      currentEvents.push({
        goalTitle: currentPoint.goalTitle,
        phase: currentPoint.phase
      });
    }
    
    if (currentPoint.type === 'end') {
      currentEvents = currentEvents.filter(
        event => event.goalTitle !== currentPoint.goalTitle || event.phase !== currentPoint.phase
      );
    }
    
    if (currentEvents.length > 0 && 
        currentPoint.date.getTime() !== nextPoint.date.getTime()) {
      timeline.push({
        startDate: currentPoint.date,
        endDate: nextPoint.date,
        events: [...currentEvents]
      });
    }
  }
  
  return timeline;
};

// 修改 getTodayEvents 函数
const getTodayEvents = (timeline: TimelineEvent[]): { goalTitle: string; phase: string }[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 找到所有包含今天的时间段
  const todayEvents = timeline.filter(event => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return startDate <= today && today <= endDate;
  });

  // 返回所有相关事件
  return todayEvents.flatMap(event => event.events);
};

// 在组件中添加日期格式化函数
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'CAREER',
    status: '0',
    startDate: '',
    endDate: '',
    category: '',
    progress: 0
  });
  const [selectedGoalPlan, setSelectedGoalPlan] = useState<string | string[]>('');
  const [goalDetails, setGoalDetails] = useState<Goal | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    fetchGoals();
  }, [currentPage]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsApi.getGoals(currentPage);
      setGoals(response.data?.records || []);
      setTotalPages(response.data?.pages || 0);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      setGoals([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (window.confirm('确定要删除这个目标吗？')) {
      try {
        await goalsApi.deleteGoal(id);
        
        // 刷新目标列表
        const goalsResponse = await goalsApi.getGoals(currentPage);
        const freshGoals = goalsResponse.data?.records || [];
        setGoals(freshGoals);
        
        // 强制更新 Today's Focus
        const timeline = aggregateTimeline(freshGoals);
        getTodayEvents(timeline);
        
        setExpandedPlans(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        setToast({ message: 'Goal deleted successfully', type: 'success' });
      } catch (error) {
        console.error('Failed to delete goal:', error);
        setToast({ message: 'Failed to delete goal', type: 'error' });
      }
    }
  };

  const handleGetGoalDetails = async (goalId: number) => {
    try {
      const response = await goalsApi.getGoal(goalId);
      setGoalDetails(response.data);
    } catch (error) {
      console.error('Failed to get goal details:', error);
    }
  };

  const handleGeneratePlan = async (goalId: number) => {
    try {
      setGeneratingPlan(goalId);
      setToast({ message: 'Please wait a moment...', type: 'info' });
      
      const response = await goalsApi.generatePlan(goalId);
      
      // 立即更新当前目标的计划
      const updatedGoals = goals.map(goal => 
        goal.id === goalId ? { ...goal, plan: response.data.plan } : goal
      );
      setGoals(updatedGoals);
      
      // 刷新所有目标数据以确保同步
      const goalsResponse = await goalsApi.getGoals(currentPage);
      const freshGoals = goalsResponse.data?.records || [];
      setGoals(freshGoals);
      
      // 强制更新 Today's Focus
      const timeline = aggregateTimeline(freshGoals);
      getTodayEvents(timeline);
      
      // 自动展开新生成的计划
      setExpandedPlans(prev => ({
        ...prev,
        [goalId]: true
      }));
      
      setToast({ message: 'Plan generated! Check details to view.', type: 'success' });
    } catch (error) {
      console.error('Failed to generate plan:', error);
      setToast({ message: 'Failed to generate plan. Please try again.', type: 'error' });
    } finally {
      setGeneratingPlan(null);
    }
  };

  const togglePlan = (goalId: number) => {
    setExpandedPlans(prev => ({
      ...prev,
      [goalId]: !prev[goalId]
    }));
  };

  return (
    <div className="p-4">
      {/* 添加综合时间轴 */}
      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-6">What I do defines who I am</h2>
        <div className="flex gap-6">
          {/* 今日任务 */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <div className="flex items-center mb-4">
                <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                <h3 className="text-lg font-semibold text-blue-800">Today's Focus</h3>
              </div>
              <div className="space-y-4">
                {getTodayEvents(aggregateTimeline(goals)).map((event, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-base font-medium text-blue-900">
                      {event.goalTitle}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      {event.phase}
                    </div>
                  </div>
                ))}
                {getTodayEvents(aggregateTimeline(goals)).length === 0 && (
                  <div className="text-gray-500 text-sm italic">
                    No tasks scheduled for today
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 修改时间轴容器 */}
          <div className="flex-grow overflow-hidden">
            <div className="relative">
              <div className="overflow-x-auto pb-4 timeline-scroll"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#93C5FD #F3F4F6'
                }}
              >
                <div className="relative" style={{ minWidth: '150%' }}>
                  {/* 时间轴线 */}
                  <div className="absolute left-0 right-0 h-1 bg-gray-200 top-16"></div>
                  
                  {/* 时间轴事件 */}
                  <div className="relative pt-8">
                    <div className="flex space-x-8" style={{ paddingRight: '2rem' }}>
                      {aggregateTimeline(goals).map((timelineEvent, index) => (
                        <div 
                          key={index}
                          className="relative flex-shrink-0 w-64"
                          style={{
                            marginLeft: index === 0 ? '0' : '0'
                          }}
                        >
                          {/* 时间段标记 */}
                          <div className="absolute -top-6 left-0 right-0 text-xs text-gray-500">
                            {formatDate(new Date(timelineEvent.startDate))} - 
                            {formatDate(new Date(timelineEvent.endDate))}
                          </div>
                          
                          {/* 事件内容 */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            {timelineEvent.events.map((event, eventIndex) => (
                              <div key={eventIndex} className="mb-2 last:mb-0">
                                <div className="text-sm font-medium text-blue-800">
                                  {event.goalTitle}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {event.phase}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Goals</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {isEditing && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-3">
            {editingGoal ? 'Edit Goal' : 'New Goal'}
          </h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (editingGoal) {
              try {
                await goalsApi.updateGoal(editingGoal.id, editingGoal);
                fetchGoals();
              } catch (error) {
                console.error('Failed to update goal:', error);
              }
            } else {
              try {
                await goalsApi.createGoal(newGoal);
                fetchGoals();
              } catch (error) {
                console.error('Failed to create goal:', error);
              }
            }
            setIsEditing(false);
            setEditingGoal(null);
            setNewGoal({ 
              title: '', 
              description: '', 
              type: 'CAREER', 
              status: '0', 
              startDate: '', 
              endDate: '',
              category: '',
              progress: 0 
            });
          }}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Goal Title"
                  value={editingGoal ? editingGoal.title : newGoal.title}
                  onChange={(e) => editingGoal 
                    ? setEditingGoal({ ...editingGoal, title: e.target.value })
                    : setNewGoal({ ...newGoal, title: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Goal Description"
                  value={editingGoal ? editingGoal.description : newGoal.description}
                  onChange={(e) => editingGoal
                    ? setEditingGoal({ ...editingGoal, description: e.target.value })
                    : setNewGoal({ ...newGoal, description: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={editingGoal ? editingGoal.type : newGoal.type}
                  onChange={(e) => editingGoal
                    ? setEditingGoal({ ...editingGoal, type: e.target.value })
                    : setNewGoal({ ...newGoal, type: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="CAREER">Career</option>
                  <option value="PERSONAL">Personal Growth</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="HEALTH">Health</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={editingGoal ? String(editingGoal.startDate) : newGoal.startDate}
                  onChange={(e) => editingGoal
                    ? setEditingGoal({ ...editingGoal, startDate: e.target.value })
                    : setNewGoal({ ...newGoal, startDate: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={editingGoal ? String(editingGoal.endDate) : newGoal.endDate}
                  onChange={(e) => editingGoal
                    ? setEditingGoal({ ...editingGoal, endDate: e.target.value })
                    : setNewGoal({ ...newGoal, endDate: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingGoal(null);
                    setNewGoal({ 
                      title: '', 
                      description: '', 
                      type: 'CAREER', 
                      status: '0', 
                      startDate: '', 
                      endDate: '',
                      category: '',
                      progress: 0 
                    });
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <p className="text-gray-600">{goal.description}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Category: {goal.type === 'CAREER' ? 'Career' : 'Personal'}</p>
                    <p>Status: {goal.status === '0' ? 'In Progress' : 'Completed'}</p>
                    <p>Start Date: {new Date(goal.startDate).toLocaleDateString()}</p>
                    <p>End Date: {new Date(goal.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleGeneratePlan(goal.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    title="Generate Plan"
                    disabled={generatingPlan === goal.id}
                  >
                    <RefreshCw className={`w-4 h-4 ${generatingPlan === goal.id ? 'animate-spin' : ''}`} />
                    {generatingPlan === goal.id ? 'Generating...' : 'Generate Plan'}
                  </button>
                  <button
                    onClick={() => handleGetGoalDetails(goal.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="View Details"
                  >
                    <Info className="w-4 h-4" />
                    Details
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsEditing(true);
                      }}
                      className="p-2 text-blue-500 hover:text-blue-600"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {goal.plan && parsePlan(goal.plan).length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <button 
                    onClick={() => togglePlan(goal.id)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 hover:text-blue-600 transition-colors"
                  >
                    <div className={`transform transition-transform duration-200 ${expandedPlans[goal.id] ? 'rotate-90' : ''}`}>
                      ▶
                    </div>
                    Implementation Plan
                  </button>
                  
                  <div className={`space-y-4 transition-all duration-200 overflow-hidden ${
                    expandedPlans[goal.id] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    {parsePlan(goal.plan).map((phase, index) => (
                      <div key={index} className="relative pl-6">
                        <div className="absolute left-0 top-2 bottom-0 w-px bg-blue-200">
                          {index < parsePlan(goal.plan).length - 1 && (
                            <div className="absolute top-2 -bottom-4 w-px bg-blue-200"></div>
                          )}
                        </div>
                        
                        <div className="absolute left-[-5px] top-2 w-[10px] h-[10px] rounded-full bg-blue-500"></div>
                        
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-blue-800">
                            Phase {index + 1}: {phase.phase}
                          </div>
                          <div className="mt-1 text-xs text-blue-600">
                            <span className="inline-block mr-3">{phase.period}</span>
                            <span className="text-blue-400">{phase.days} days</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`px-3 py-1 rounded ${
                currentPage === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {goalDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold">Goal Details</h3>
              <button
                onClick={() => setGoalDetails(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-600">Title</p>
                    <p>{goalDetails.title}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Category</p>
                    <p>{goalDetails.type === 'CAREER' ? 'Career' : 'Personal'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Status</p>
                    <p>{goalDetails.status === '0' ? 'In Progress' : 'Completed'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Start Date</p>
                    <p>{new Date(goalDetails.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">End Date</p>
                    <p>{new Date(goalDetails.endDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-gray-600">Description</p>
                  <p className="whitespace-pre-wrap">{goalDetails.description}</p>
                </div>

                {goalDetails.plan && (
                  <div>
                    <p className="font-medium text-gray-600 mb-2">Plan</p>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 max-h-[300px] overflow-y-auto">
                      {Array.isArray(goalDetails.plan) ? (
                        goalDetails.plan.map((step, index) => (
                          <div key={index} className="flex gap-2">
                            <span className="text-gray-500 flex-shrink-0">{index + 1}.</span>
                            <p className="text-gray-700 whitespace-pre-wrap">{step}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-700 whitespace-pre-wrap">{goalDetails.plan}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t">
              <button
                onClick={() => setGoalDetails(null)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}