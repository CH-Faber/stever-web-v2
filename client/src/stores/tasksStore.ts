import { create } from 'zustand';
import type { Task } from '../../../shared/types';

interface TasksState {
  // State
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getTaskById: (id: string) => Task | undefined;
  getTasksByType: (type: Task['type']) => Task[];
}

export const useTasksStore = create<TasksState>((set, get) => ({
  // Initial state
  tasks: [],
  loading: false,
  error: null,

  // Actions
  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task],
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    ),
  })),

  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Computed getters
  getTaskById: (id) => {
    const { tasks } = get();
    return tasks.find((task) => task.id === id);
  },

  getTasksByType: (type) => {
    const { tasks } = get();
    return tasks.filter((task) => task.type === type);
  },
}));
