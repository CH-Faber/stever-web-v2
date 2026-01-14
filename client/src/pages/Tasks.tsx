import { useEffect, useState } from 'react';
import { ListTodo, Plus, RefreshCw, AlertCircle, X, Trash2, Package } from 'lucide-react';
import { TaskCard } from '../components/tasks';
import { useTasksStore } from '../stores/tasksStore';
import { useBotsStore } from '../stores/botsStore';
import { tasksApi } from '../api/tasks';
import { botsApi } from '../api/bots';
import type { Task, BotProfile, CreateTaskRequest } from '../../../shared/types';

// Inventory item for form
interface InventoryItemInput {
  id: string;
  itemName: string;
  count: number;
}

// Default form values
const defaultFormValues: CreateTaskRequest = {
  name: '',
  goal: '',
  target: '',
  numberOfTarget: 1,
  timeout: 300,
  agentCount: 1,
  type: 'techtree',
  initialInventory: {},
  blockedActions: {},
};

export function Tasks() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateTaskRequest>(defaultFormValues);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showBotSelector, setShowBotSelector] = useState(false);
  const [selectedTaskForStart, setSelectedTaskForStart] = useState<Task | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemInput[]>([]);

  const { tasks, setTasks, addTask, removeTask } = useTasksStore();
  const { bots, setBots } = useBotsStore();

  // Fetch tasks and bots on mount
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tasksData, botsData] = await Promise.all([
        tasksApi.getAll(),
        botsApi.getAll(),
      ]);
      setTasks(tasksData);
      setBots(botsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  // Handle inventory item changes
  const handleAddInventoryItem = () => {
    setInventoryItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), itemName: '', count: 1 },
    ]);
  };

  const handleRemoveInventoryItem = (id: string) => {
    setInventoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleInventoryItemChange = (
    id: string,
    field: 'itemName' | 'count',
    value: string | number
  ) => {
    setInventoryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Convert inventory items to the format expected by the API
  const buildInitialInventory = (): Record<string, Record<string, number>> => {
    const inventory: Record<string, Record<string, number>> = {};
    const validItems = inventoryItems.filter((item) => item.itemName.trim());
    
    if (validItems.length > 0) {
      // Use 'bot' as the default agent name for initial inventory
      inventory['bot'] = {};
      validItems.forEach((item) => {
        inventory['bot'][item.itemName.trim()] = item.count;
      });
    }
    
    return inventory;
  };

  // Handle create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.goal.trim() || !formData.target.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const taskData: CreateTaskRequest = {
        ...formData,
        initialInventory: buildInitialInventory(),
      };
      const newTask = await tasksApi.create(taskData);
      addTask(newTask);
      setFormData(defaultFormValues);
      setInventoryItems([]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      await tasksApi.delete(taskId);
      removeTask(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除任务失败');
    } finally {
      setDeletingTaskId(null);
    }
  };

  // Handle start task - show bot selector
  const handleStartTask = (task: Task) => {
    setSelectedTaskForStart(task);
    setShowBotSelector(true);
  };

  // Handle bot selection for task start
  const handleBotSelect = async (bot: BotProfile) => {
    if (!selectedTaskForStart) return;
    
    try {
      await botsApi.start(bot.id, { taskId: selectedTaskForStart.id });
      setShowBotSelector(false);
      setSelectedTaskForStart(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动任务失败');
    }
  };

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <ListTodo size={24} strokeWidth={1.5} className="text-text-secondary" />
          <h2 className="text-2xl font-semibold text-text-primary">任务管理</h2>
        </div>
        <div className="flex items-center gap-sm">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-xs text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} strokeWidth={1.5} className={isLoading ? 'animate-spin' : ''} />
            <span>刷新</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
          >
            <Plus size={18} strokeWidth={1.5} />
            <span>创建任务</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/20 rounded-md p-md">
          <div className="flex items-center gap-sm">
            <AlertCircle size={16} strokeWidth={1.5} className="text-status-error" />
            <p className="text-sm text-status-error">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-status-error hover:text-status-error/80"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      {isLoading && tasks.length === 0 ? (
        <div className="bg-background-primary rounded-lg border border-border p-xl shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <RefreshCw size={32} strokeWidth={1.5} className="text-text-muted animate-spin mb-md" />
            <p className="text-text-secondary">加载中...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-background-primary rounded-lg border border-border p-xl shadow-sm">
          <div className="flex flex-col items-center justify-center text-center">
            <ListTodo size={48} strokeWidth={1} className="text-text-muted mb-md" />
            <h4 className="text-lg font-medium text-text-primary mb-sm">暂无任务</h4>
            <p className="text-text-secondary mb-lg">点击上方按钮创建您的第一个任务</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors"
            >
              <Plus size={18} strokeWidth={1.5} />
              <span>创建任务</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={() => handleStartTask(task)}
              onDelete={() => handleDeleteTask(task.id)}
              isDeleting={deletingTaskId === task.id}
            />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-primary rounded-lg border border-border shadow-lg w-full max-w-lg mx-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-md border-b border-border">
              <h3 className="text-lg font-medium text-text-primary">创建任务</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setInventoryItems([]);
                }}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-md space-y-md">
              {/* Task Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-xs">
                  任务名称 <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="输入任务名称"
                  required
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>

              {/* Goal Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-xs">
                  目标描述 <span className="text-status-error">*</span>
                </label>
                <textarea
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  placeholder="描述任务目标"
                  required
                  rows={3}
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                />
              </div>

              {/* Target Item */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-xs">
                  目标物品 <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  name="target"
                  value={formData.target}
                  onChange={handleInputChange}
                  placeholder="例如: diamond, iron_ingot"
                  required
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>

              {/* Number and Timeout Row */}
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-xs">
                    目标数量
                  </label>
                  <input
                    type="number"
                    name="numberOfTarget"
                    value={formData.numberOfTarget}
                    onChange={handleInputChange}
                    min={1}
                    className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-xs">
                    超时时间 (秒)
                  </label>
                  <input
                    type="number"
                    name="timeout"
                    value={formData.timeout}
                    onChange={handleInputChange}
                    min={60}
                    className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                  />
                </div>
              </div>

              {/* Task Type */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-xs">
                  任务类型
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                >
                  <option value="techtree">科技树</option>
                  <option value="construction">建造</option>
                </select>
              </div>

              {/* Agent Count */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-xs">
                  代理数量
                </label>
                <input
                  type="number"
                  name="agentCount"
                  value={formData.agentCount}
                  onChange={handleInputChange}
                  min={1}
                  max={10}
                  className="w-full px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                />
              </div>

              {/* Initial Inventory */}
              <div>
                <div className="flex items-center justify-between mb-xs">
                  <label className="block text-sm font-medium text-text-primary">
                    初始物品栏
                  </label>
                  <button
                    type="button"
                    onClick={handleAddInventoryItem}
                    className="flex items-center gap-xs text-xs text-accent hover:text-accent-dark transition-colors"
                  >
                    <Plus size={14} strokeWidth={1.5} />
                    <span>添加物品</span>
                  </button>
                </div>
                
                {inventoryItems.length === 0 ? (
                  <div className="flex items-center gap-sm p-md bg-background-secondary border border-border border-dashed rounded-md">
                    <Package size={16} strokeWidth={1.5} className="text-text-muted" />
                    <p className="text-sm text-text-muted">暂无初始物品，点击上方按钮添加</p>
                  </div>
                ) : (
                  <div className="space-y-sm">
                    {inventoryItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-sm">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleInventoryItemChange(item.id, 'itemName', e.target.value)}
                          placeholder="物品名称 (如: diamond)"
                          className="flex-1 px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm"
                        />
                        <input
                          type="number"
                          value={item.count}
                          onChange={(e) => handleInventoryItemChange(item.id, 'count', Number(e.target.value))}
                          min={1}
                          className="w-20 px-md py-sm bg-background-secondary border border-border rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveInventoryItem(item.id)}
                          className="p-sm text-text-muted hover:text-status-error transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-sm pt-md border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setInventoryItems([]);
                  }}
                  className="px-md py-sm bg-background-tertiary hover:bg-border-light text-text-secondary rounded-md transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !formData.name.trim() || !formData.goal.trim() || !formData.target.trim()}
                  className="flex items-center gap-sm px-md py-sm bg-accent hover:bg-accent-dark text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating && <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />}
                  <span>创建</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bot Selector Modal */}
      {showBotSelector && selectedTaskForStart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-primary rounded-lg border border-border shadow-lg w-full max-w-md mx-md">
            <div className="flex items-center justify-between p-md border-b border-border">
              <h3 className="text-lg font-medium text-text-primary">选择机器人</h3>
              <button
                onClick={() => {
                  setShowBotSelector(false);
                  setSelectedTaskForStart(null);
                }}
                className="text-text-muted hover:text-text-secondary transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-md">
              <p className="text-sm text-text-secondary mb-md">
                选择一个机器人来执行任务: <span className="font-medium">{selectedTaskForStart.name}</span>
              </p>
              {bots.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-lg">暂无可用机器人</p>
              ) : (
                <div className="space-y-sm max-h-64 overflow-y-auto">
                  {bots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => handleBotSelect(bot)}
                      className="w-full flex items-center gap-md p-md bg-background-secondary hover:bg-background-tertiary rounded-md transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-md bg-accent-light flex items-center justify-center">
                        <span className="text-accent font-medium text-sm">
                          {bot.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{bot.name}</p>
                        <p className="text-xs text-text-muted">{bot.model.api} / {bot.model.model}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
