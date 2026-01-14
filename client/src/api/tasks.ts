import { api } from './client';
import type {
  Task,
  TasksListResponse,
  TaskResponse,
  CreateTaskRequest,
} from '../../../shared/types';

export const tasksApi = {
  // Get all tasks
  getAll: async (): Promise<Task[]> => {
    const response = await api.get<TasksListResponse>('/api/tasks');
    return response.tasks;
  },

  // Create a new task
  create: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<TaskResponse>('/api/tasks', data);
    return response.task;
  },

  // Delete a task
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },
};
