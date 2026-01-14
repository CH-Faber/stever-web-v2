import { api } from './client';
import type {
  ServerSettings,
  SettingsResponse,
  UpdateSettingsRequest,
} from '../../../shared/types';

export const settingsApi = {
  // Get server settings
  get: async (): Promise<ServerSettings> => {
    const response = await api.get<SettingsResponse>('/api/settings');
    return response.settings;
  },

  // Update server settings
  update: async (data: UpdateSettingsRequest): Promise<ServerSettings> => {
    const response = await api.put<SettingsResponse>('/api/settings', data);
    return response.settings;
  },
};
