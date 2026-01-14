import { api } from './client';
import type {
  APIKeyStatus,
  KeysStatusResponse,
  UpdateKeyRequest,
} from '../../../shared/types';

export const keysApi = {
  // Get all API key statuses (not actual keys)
  getAll: async (): Promise<APIKeyStatus[]> => {
    const response = await api.get<KeysStatusResponse>('/api/keys');
    return response.keys;
  },

  // Update an API key for a provider
  update: async (provider: string, key: string): Promise<void> => {
    const data: UpdateKeyRequest = { key };
    await api.put(`/api/keys/${provider}`, data);
  },

  // Delete an API key for a provider
  delete: async (provider: string): Promise<void> => {
    await api.delete(`/api/keys/${provider}`);
  },
};
