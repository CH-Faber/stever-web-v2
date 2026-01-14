import { api } from './client';
import type {
  BotProfile,
  BotsListResponse,
  BotResponse,
  CreateBotRequest,
  UpdateBotRequest,
  BotStatusResponse,
  BotStartRequest,
} from '../../../shared/types';

export const botsApi = {
  // Get all bot profiles
  getAll: async (): Promise<BotProfile[]> => {
    const response = await api.get<BotsListResponse>('/api/bots');
    return response.bots;
  },

  // Get a single bot profile by ID
  getById: async (id: string): Promise<BotProfile> => {
    const response = await api.get<BotResponse>(`/api/bots/${id}`);
    return response.bot;
  },

  // Create a new bot profile
  create: async (data: CreateBotRequest): Promise<BotProfile> => {
    const response = await api.post<BotResponse>('/api/bots', data);
    return response.bot;
  },

  // Update an existing bot profile
  update: async (id: string, data: UpdateBotRequest): Promise<BotProfile> => {
    const response = await api.put<BotResponse>(`/api/bots/${id}`, data);
    return response.bot;
  },

  // Delete a bot profile
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/bots/${id}`);
  },

  // Start a bot
  start: async (id: string, data?: BotStartRequest): Promise<BotStatusResponse> => {
    return api.post<BotStatusResponse>(`/api/bots/${id}/start`, data);
  },

  // Stop a bot
  stop: async (id: string): Promise<BotStatusResponse> => {
    return api.post<BotStatusResponse>(`/api/bots/${id}/stop`);
  },

  // Get bot status
  getStatus: async (id: string): Promise<BotStatusResponse> => {
    return api.get<BotStatusResponse>(`/api/bots/${id}/status`);
  },
};
