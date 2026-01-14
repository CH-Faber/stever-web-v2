import { api } from './client';
import type {
  ExportResponse,
  ImportRequest,
  ImportResponse,
} from '../../../shared/types';

export const importExportApi = {
  // Export all configurations
  export: async (): Promise<ExportResponse> => {
    return api.get<ExportResponse>('/api/export');
  },

  // Import configurations
  import: async (data: ImportRequest): Promise<ImportResponse> => {
    return api.post<ImportResponse>('/api/import', data);
  },
};
