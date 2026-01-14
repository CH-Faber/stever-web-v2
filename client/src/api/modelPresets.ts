import { api } from './client';
import type {
  ModelPreset,
  ModelPresetsListResponse,
  CreateModelPresetRequest,
  UpdateModelPresetRequest,
} from '../../../shared/types';

const BASE_PATH = '/api/model-presets';

export const modelPresetsApi = {
  /**
   * 获取所有模型预设
   */
  async getAll(): Promise<ModelPreset[]> {
    const response = await api.get<ModelPresetsListResponse>(BASE_PATH);
    return response.presets;
  },

  /**
   * 获取单个模型预设
   */
  async getById(id: string): Promise<ModelPreset> {
    const response = await api.get<{ preset: ModelPreset }>(`${BASE_PATH}/${id}`);
    return response.preset;
  },

  /**
   * 创建模型预设
   */
  async create(data: CreateModelPresetRequest): Promise<ModelPreset> {
    const response = await api.post<{ preset: ModelPreset }>(BASE_PATH, data);
    return response.preset;
  },

  /**
   * 更新模型预设
   */
  async update(id: string, data: UpdateModelPresetRequest): Promise<ModelPreset> {
    const response = await api.put<{ preset: ModelPreset }>(`${BASE_PATH}/${id}`, data);
    return response.preset;
  },

  /**
   * 删除模型预设
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${BASE_PATH}/${id}`);
  },

  /**
   * 设置默认预设
   */
  async setDefault(id: string): Promise<ModelPreset> {
    const response = await api.post<{ preset: ModelPreset }>(`${BASE_PATH}/${id}/set-default`, {});
    return response.preset;
  },
};
